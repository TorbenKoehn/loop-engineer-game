import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CombatEvent } from '../../sim/events.ts';
import { type CombatInput, resolveCombat } from '../../sim/index.ts';
import { buildCheckpoints, CHECKPOINT_EVERY, viewAt } from './checkpoints.ts';
import { advanceTo, type CombatView, foldAll, foldEvent, initialView } from './fold.ts';
import { createPlayback, HIT_STOP_MS, MAX_FRAME_MS, rafClock } from './playback.ts';
import { fightInput as buildInput } from './testing/fights.ts';
import { manualClock } from './testing/manual-clock.ts';

const SETUP = { harness: 'terminal_purist', encounter: 'p1e1', seed: 'playback-test' };

function fight(input: CombatInput = buildInput(SETUP)) {
  const { events } = resolveCombat(input);
  const start = initialView(input.agent.tools.map((s) => ({ def: s.def.id, version: s.version })));
  return { events, start };
}

/** A fight the agent loses: enemies keep Severity, so the end state is not all zeros. */
function lostFight() {
  const base = buildInput({ ...SETUP, encounter: 'p1h3' });
  return fight({ ...base, agent: { ...base.agent, trust: 5 } });
}

function player(f = fight()) {
  const clock = manualClock();
  const pb = createPlayback({ ...f, clock });
  return { ...f, clock, pb };
}

const straight = (start: CombatView, events: readonly CombatEvent[], n: number): CombatView =>
  events.slice(0, n).reduce(foldEvent, start);

/** Severity per enemy at the end, read backwards from the log (independent of the fold). */
function endSeverities(events: readonly CombatEvent[]): number[] {
  const spawned = events.flatMap((e) => (e.kind === 'spawn' && e.dst ? [e] : []));
  return spawned.map((s) => {
    const hit = events.findLast(
      (e) => (e.kind === 'damage' || e.kind === 'heal') && e.dst === s.dst,
    );
    if (events.some((e) => e.kind === 'resolved' && e.src === s.dst)) return 0;
    if (hit?.kind === 'damage') return hit.d.sev;
    if (hit?.kind === 'heal') return hit.d.total;
    return s.v ?? 0;
  });
}

describe('playback frames', () => {
  it.each([1, 2, 4] as const)('at %ix advances simT by frameMs x speed', (speed) => {
    const { events, start, clock, pb } = player();
    pb.speed.value = speed;
    for (let frame = 1; frame <= 40; frame++) {
      clock.tick(16);
      expect(pb.simT.value).toBe(frame * 16 * speed);
      expect(pb.view.value).toEqual(advanceTo(start, events, pb.simT.value));
      expect(events[pb.cursor.value]?.t ?? Number.POSITIVE_INFINITY).toBeGreaterThan(pb.simT.value);
    }
  });

  it('emits each applied event once, in order, and stops at the end', () => {
    const { events, start, clock, pb } = player();
    const seen: CombatEvent[] = [];
    pb.subscribe((e) => seen.push(e));
    for (let i = 0; i < 10_000 && !pb.ended.value; i++) clock.tick(MAX_FRAME_MS);
    expect(seen).toEqual(events);
    expect(pb.view.value).toEqual(foldAll(start, events));
    expect(pb.simT.value).toBe(events.at(-1)?.t);
    clock.tick(16);
    expect(seen).toHaveLength(events.length);
  });

  it('caps a long frame at MAX_FRAME_MS', () => {
    const { clock, pb } = player();
    clock.tick(5000);
    expect(pb.simT.value).toBe(MAX_FRAME_MS);
  });

  it('dispose stops the clock', () => {
    const { clock, pb } = player();
    pb.dispose();
    expect(clock.running()).toBe(false);
  });
});

describe('skip', () => {
  it('folds to the end without emitting bus events', () => {
    const { events, start, clock, pb } = player();
    let emitted = 0;
    pb.subscribe(() => emitted++);
    pb.speed.value = 'skip';
    clock.tick(16);
    expect(emitted).toBe(0);
    expect(pb.ended.value).toBe(true);
    expect(pb.view.value).toEqual(foldAll(start, events));
  });

  it('finish() mid-fight folds the rest silently', () => {
    const { events, start, clock, pb } = player();
    let emitted = 0;
    clock.tick(50);
    pb.subscribe(() => emitted++);
    pb.finish();
    expect(emitted).toBe(0);
    expect(pb.view.value).toEqual(foldAll(start, events));
  });
});

describe('full fold equals fightEnd', () => {
  it.each([
    ['won', fight()],
    ['lost', lostFight()],
  ])('Trust and Severities of a %s reference fight', (_, f) => {
    const { events, clock, pb } = player(f);
    pb.speed.value = 'skip';
    clock.tick(16);
    const end = events.at(-1);
    if (end?.kind !== 'fightEnd') throw new Error('log must end with fightEnd');
    expect(pb.view.value.agent.trust).toBe(end.d.trust);
    expect(pb.view.value.end).toEqual({ ...end.d, t: end.t });
    expect(pb.view.value.enemies.map((e) => e.sev)).toEqual(endSeverities(events));
  });

  it('the lost fight leaves Severity on the board', () => {
    expect(endSeverities(lostFight().events).some((s) => s > 0)).toBe(true);
  });
});

describe('seeking', () => {
  /** The Phase-1 boss: about 300 events, so seeks cross several checkpoints. */
  const long = fight(buildInput({ ...SETUP, encounter: 'p1b' }));

  it('restores the nearest checkpoint and folds forward to a straight fold', () => {
    expect(long.events.length).toBeGreaterThan(2 * CHECKPOINT_EVERY);
    const { events, start, pb } = player(long);
    fc.assert(
      fc.property(fc.integer({ min: 0, max: events.length }), (i) => {
        pb.seek(i);
        expect(pb.cursor.value).toBe(i);
        expect(pb.view.value).toEqual(straight(start, events, i));
        expect(pb.simT.value).toBe(pb.view.value.t);
        expect(pb.paused.value).toBe(true);
      }),
    );
  });

  it('works for any checkpoint spacing and clamps the index', () => {
    const { events, start } = long;
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 150 }), fc.integer({ min: -5, max: 900 }), (k, i) => {
        const cp = buildCheckpoints(start, events, k);
        const n = Math.max(0, Math.min(events.length, i));
        expect(viewAt(cp, events, i)).toEqual(straight(start, events, n));
      }),
      { numRuns: 30 },
    );
  });
});

describe('rafClock', () => {
  afterEach(() => vi.unstubAllGlobals());

  /** Stubbed requestAnimationFrame: frames run only when the test calls `frame()`. */
  function stubRaf() {
    const queue = new Map<number, (now: number) => void>();
    let next = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: (now: number) => void) => {
      queue.set(++next, cb);
      return next;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => queue.delete(id));
    const frame = (now: number): void => {
      const due = [...queue.values()];
      queue.clear();
      for (const cb of due) cb(now);
    };
    return { frame, pending: () => queue.size };
  }

  it('runs once per frame until stopped from outside', () => {
    const raf = stubRaf();
    const seen: number[] = [];
    const stop = rafClock.onFrame((now) => seen.push(now));
    raf.frame(16);
    raf.frame(32);
    stop();
    raf.frame(48);
    expect(seen).toEqual([16, 32]);
    expect(raf.pending()).toBe(0);
  });

  it('stop() inside a frame callback ends the loop (R045 F1)', () => {
    const raf = stubRaf();
    let calls = 0;
    const stop = rafClock.onFrame(() => {
      calls++;
      stop();
    });
    raf.frame(16);
    raf.frame(32);
    expect(calls).toBe(1);
    expect(raf.pending()).toBe(0);
  });
});

describe('pause and hit-stop', () => {
  it('paused stops advancing', () => {
    const { clock, pb } = player();
    clock.tick(16);
    pb.paused.value = true;
    const view = pb.view.value;
    clock.tick(16);
    expect(pb.simT.value).toBe(16);
    expect(pb.view.value).toBe(view);
    pb.paused.value = false;
    clock.tick(16);
    expect(pb.simT.value).toBe(32);
  });

  it('a hit-stop holds 60 ms of real time, then playback resumes', () => {
    const { clock, pb } = player();
    pb.speed.value = 2;
    clock.tick(10);
    pb.hold();
    clock.tick(40);
    clock.tick(HIT_STOP_MS - 40);
    expect(pb.simT.value).toBe(20);
    clock.tick(16);
    expect(pb.simT.value).toBe(52);
  });

  it('a hit-stop inside a frame only holds part of it', () => {
    const { clock, pb } = player();
    pb.hold();
    clock.tick(90);
    expect(pb.simT.value).toBe(90 - HIT_STOP_MS);
  });

  it('a hit-stop is ignored at skip', () => {
    const { clock, pb } = player();
    pb.speed.value = 'skip';
    pb.hold();
    pb.speed.value = 1;
    clock.tick(16);
    expect(pb.simT.value).toBe(16);
  });
});
