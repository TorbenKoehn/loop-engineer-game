// Combat replay player (docs/architecture/ui.md "Combat replay player"): plays a recorded
// event log against an injectable clock and folds it into the view. It never calls the sim.
import { batch, computed, type ReadonlySignal, type Signal, signal } from '@preact/signals';
import type { CombatEvent } from '../../sim/events.ts';
import { buildCheckpoints, type Checkpoints, viewAt } from './checkpoints.ts';
import { advanceTo, type CombatView, foldEvent } from './fold.ts';

export type Speed = 1 | 2 | 4 | 'skip';

/** Frame source: `rafClock` in the browser, a manual clock in tests. */
export interface Clock {
  now(): number;
  /** Calls `cb` with the current time once per frame until the returned stop function runs. */
  onFrame(cb: (now: number) => void): () => void;
}

export const rafClock: Clock = {
  now: () => performance.now(),
  onFrame(cb) {
    let id = 0;
    let live = true;
    const loop = (now: number): void => {
      cb(now);
      // `cb` may stop the loop itself (a listener disposing the playback): no new frame then.
      if (live) id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => {
      live = false;
      cancelAnimationFrame(id);
    };
  },
};

/** Real ms a hit-stop request holds playback. */
export const HIT_STOP_MS = 60;
/** Longest frame step, so a background tab does not jump ahead. */
export const MAX_FRAME_MS = 100;

/** Receives every event applied by normal playback (fx, audio); never at skip or on seek. */
export type Listener = (e: CombatEvent) => void;

export interface Playback {
  readonly events: readonly CombatEvent[];
  /** Index of the next event to apply. */
  readonly cursor: ReadonlySignal<number>;
  /** Current playback time in ms. */
  readonly simT: ReadonlySignal<number>;
  readonly speed: Signal<Speed>;
  readonly paused: Signal<boolean>;
  /** Fold of `events[0..cursor)`. */
  readonly view: ReadonlySignal<CombatView>;
  readonly ended: ReadonlySignal<boolean>;
  /** Shows the view after `events[0..index)` and pauses. */
  seek(index: number): void;
  /** Folds to the end without emitting events. */
  finish(): void;
  /** Hit-stop: holds playback for `ms` of real time; ignored at skip. */
  hold(ms?: number): void;
  subscribe(fn: Listener): () => void;
  dispose(): void;
}

export interface PlaybackOptions {
  readonly events: readonly CombatEvent[];
  /** The view before the first event (`initialView` of the loadout). */
  readonly start: CombatView;
  readonly clock: Clock;
  /** Pass the store's signal so the speed persists between fights. */
  readonly speed?: Signal<Speed>;
}

interface State {
  readonly events: readonly CombatEvent[];
  readonly checkpoints: Checkpoints;
  readonly endT: number;
  readonly view: Signal<CombatView>;
  readonly simT: Signal<number>;
  readonly speed: Signal<Speed>;
  readonly paused: Signal<boolean>;
  readonly listeners: Set<Listener>;
  /** Real ms of hit-stop still to wait. */
  holdLeft: number;
}

function show(s: State, next: CombatView, t: number): void {
  batch(() => {
    s.view.value = next;
    s.simT.value = t;
  });
}

function finish(s: State): void {
  s.holdLeft = 0;
  show(s, advanceTo(s.view.value, s.events, Number.POSITIVE_INFINITY), s.endT);
}

/** Advances simT by `frameMs x speed` (minus any hold) and applies every event up to it. */
function step(s: State, frameMs: number): void {
  const speed = s.speed.value;
  if (s.paused.value || s.view.value.cursor >= s.events.length) return;
  if (speed === 'skip') {
    finish(s);
    return;
  }
  const held = Math.min(s.holdLeft, frameMs);
  s.holdLeft -= held;
  const t = Math.min(s.endT, s.simT.value + (frameMs - held) * speed);
  const applied: CombatEvent[] = [];
  let next = s.view.value;
  for (let e = s.events[next.cursor]; e && e.t <= t; e = s.events[next.cursor]) {
    next = foldEvent(next, e);
    applied.push(e);
  }
  show(s, next, t);
  for (const e of applied) for (const fn of s.listeners) fn(e);
}

function seek(s: State, index: number): void {
  s.holdLeft = 0;
  const next = viewAt(s.checkpoints, s.events, index);
  batch(() => {
    show(s, next, next.t);
    s.paused.value = true;
  });
}

/** Feeds `step` with clamped frame times; returns the stop function. */
function drive(s: State, clock: Clock): () => void {
  let last = clock.now();
  return clock.onFrame((now) => {
    const frameMs = Math.min(MAX_FRAME_MS, Math.max(0, now - last));
    last = now;
    step(s, frameMs);
  });
}

function initState({ events, start, speed }: PlaybackOptions): State {
  return {
    events,
    checkpoints: buildCheckpoints(start, events),
    endT: events.at(-1)?.t ?? 0,
    view: signal(start),
    simT: signal(0),
    speed: speed ?? signal<Speed>(1),
    paused: signal(false),
    listeners: new Set(),
    holdLeft: 0,
  };
}

/** Starts playing at once (unpaused) from `start`; call `dispose` to stop the clock. */
export function createPlayback(opts: PlaybackOptions): Playback {
  const s = initState(opts);
  const stop = drive(s, opts.clock);
  const { events, view, simT, speed, paused, listeners } = s;
  return {
    events,
    view,
    simT,
    speed,
    paused,
    cursor: computed(() => view.value.cursor),
    ended: computed(() => view.value.cursor >= events.length),
    seek: (index) => seek(s, index),
    finish: () => finish(s),
    hold(ms = HIT_STOP_MS) {
      if (speed.value !== 'skip') s.holdLeft = Math.max(s.holdLeft, ms);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    dispose() {
      stop();
      listeners.clear();
    },
  };
}
