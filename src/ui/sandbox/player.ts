// Timer-driven replay of one resolved fight for the sandbox (T098): an injectable clock
// advances playback time by frame time x speed and the view folds forward. TODO(T059): the
// sandbox switches to src/ui/combat/playback.ts (checkpoints, seeking, fx bus).
import { batch, type Signal, signal } from '@preact/signals';
import type { Ref } from '../../sim/events.ts';
import { type CombatInput, type CombatResult, resolveCombat } from '../../sim/index.ts';
import { advanceTo, type CombatView, initialView } from '../combat/fold.ts';
import { buildInput, type SandboxSetup } from './adapter.ts';
import { buildLog, type LogLine } from './log-text.ts';
import { enemyLabels } from './names.ts';
import { fireTimes } from './timeline.ts';

/** Calls `onFrame` with elapsed real ms per frame; returns a stop function. */
export interface Clock {
  start(onFrame: (dtMs: number) => void): () => void;
}

/** Longest frame step, so a background tab does not jump to the end. */
const MAX_FRAME_MS = 100;

export const rafClock: Clock = {
  start(onFrame) {
    let last: number | undefined;
    let id = 0;
    const loop = (now: number): void => {
      if (last !== undefined) onFrame(Math.min(MAX_FRAME_MS, now - last));
      last = now;
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  },
};

export interface Fight {
  readonly setup: SandboxSetup;
  readonly input: CombatInput;
  readonly result: CombatResult;
  readonly log: readonly LogLine[];
  /** `toolFired` times per slot. */
  readonly fires: readonly (readonly number[])[];
  readonly start: CombatView;
  /** Enemy display labels by ref (`Typo #2`). */
  readonly labels: ReadonlyMap<Ref, string>;
}

/** Resolves the fight once; everything the replay shows derives from its event log. */
export function runFight(setup: SandboxSetup): Fight {
  const input = buildInput(setup);
  const result = resolveCombat(input);
  const { tools } = input.agent;
  return {
    setup,
    input,
    result,
    log: buildLog(result.events, tools),
    fires: fireTimes(result.events, tools.length),
    start: initialView(tools.map((s) => ({ def: s.def.id, version: s.version }))),
    labels: enemyLabels(result.events),
  };
}

export type Speed = 1 | 2 | 4;

export interface Player {
  readonly fight: Fight;
  readonly time: Signal<number>;
  readonly view: Signal<CombatView>;
  readonly speed: Signal<Speed>;
  readonly playing: Signal<boolean>;
  play(): void;
  pause(): void;
  /** Jump to the end of the fight (no animation). */
  skip(): void;
  restart(): void;
  dispose(): void;
}

/** Moves playback to `t` (clamped to the fight end); seeking back refolds from the start. */
function seekTo(fight: Fight, s: Pick<Player, 'time' | 'view'>, t: number): void {
  const { events, endT } = fight.result;
  const clamped = Math.min(endT, t);
  batch(() => {
    const from = clamped < s.view.value.t ? fight.start : s.view.value;
    s.view.value = advanceTo(from, events, clamped);
    s.time.value = clamped;
  });
}

export function createPlayer(fight: Fight, clock: Clock, speed: Speed = 1): Player {
  const { events, endT } = fight.result;
  const time = signal(0);
  const view = signal(advanceTo(fight.start, events, 0));
  const playing = signal(false);
  let stop: (() => void) | undefined;

  const seek = (t: number): void => seekTo(fight, { time, view }, t);
  const pause = (): void => {
    stop?.();
    stop = undefined;
    playing.value = false;
  };
  const frame = (dt: number): void => {
    seek(time.value + dt * player.speed.value);
    if (time.value >= endT) pause();
  };
  const play = (): void => {
    if (stop) return;
    if (time.value >= endT) seek(0);
    playing.value = true;
    stop = clock.start(frame);
  };

  const player: Player = {
    fight,
    time,
    view,
    speed: signal(speed),
    playing,
    play,
    pause,
    skip: () => {
      pause();
      seek(endT);
    },
    restart: () => {
      seek(0);
      play();
    },
    dispose: pause,
  };
  return player;
}
