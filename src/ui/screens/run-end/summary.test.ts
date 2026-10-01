import { describe, expect, it } from 'vitest';
import { newRun } from '../../../run/new-run.ts';
import type { RunResult, RunState } from '../../../run/state.ts';
import { DEADLINE, emptyStats } from '../../../run/stats.ts';
import type { CombatEvent } from '../../../sim/events.ts';
import { countThrottles, type HintInput, pickHint, summarize } from './summary.ts';

const base: HintInput = {
  zoneMs: [0, 9000, 1000, 0],
  throttles: 0,
  outcome: 'ctrlc',
  cause: 'typo',
};

const throttle = (dst: CombatEvent['dst']): CombatEvent => ({
  seq: 0,
  t: 0,
  kind: 'statusOn',
  src: 'e1',
  dst,
  v: 2000,
  d: { status: 'throttle', remaining: 2000 },
});

function ended(outcome: RunResult['outcome'], damage: Record<string, number>): RunState {
  const run = newRun(
    { seed: 'T070', harness: 'terminal_purist', lint: [], tutorial: false },
    { unlocked: [], lessons: [], lintCap: 0 },
  );
  const stats = { ...emptyStats(), damageBySource: damage, cause: 'yak_shave' };
  stats.lastFight = { zoneMs: [500, 6000, 3500, 0], compactions: 2 };
  return { ...run, mode: 'runEnd', stats, result: { outcome, td: 0, lessons: [] } };
}

describe('pickHint (onboarding.md "Why did I lose?")', () => {
  it('Rot: more than 40% of the last fight in Rot', () => {
    expect(pickHint({ ...base, zoneMs: [0, 5900, 4100, 0] })).toBe('rot');
    expect(pickHint({ ...base, zoneMs: [0, 6000, 4000, 0] })).toBe('default');
  });

  it('Throttle: more than 3 Throttles', () => {
    expect(pickHint({ ...base, throttles: 4 })).toBe('throttle');
    expect(pickHint({ ...base, throttles: 3 })).toBe('default');
  });

  it('Deadline: a lost run whose final damage came from the Deadline', () => {
    expect(pickHint({ ...base, cause: DEADLINE })).toBe('deadline');
    expect(pickHint({ ...base, cause: DEADLINE, outcome: 'shipped' })).toBe('default');
  });

  it('default when no rule matches, also without any fight time', () => {
    expect(pickHint(base)).toBe('default');
    expect(pickHint({ ...base, zoneMs: [0, 0, 0, 0] })).toBe('default');
  });

  it('exactly one hint: the first matching rule wins', () => {
    const all = { zoneMs: [0, 1000, 9000, 0], throttles: 9, outcome: 'ctrlc', cause: DEADLINE };
    expect(pickHint(all as HintInput)).toBe('rot');
    expect(pickHint({ ...(all as HintInput), zoneMs: [0, 1, 0, 0] })).toBe('throttle');
  });
});

describe('countThrottles', () => {
  it('counts Throttles on the agent and its tools, not on enemies', () => {
    expect(countThrottles([throttle('t0'), throttle('a'), throttle('e2'), throttle('t11')])).toBe(
      3,
    );
  });
});

describe('summarize', () => {
  it('top 3 damage sources, most first; zone time and compactions of the last fight', () => {
    const s = summarize(ended('ctrlc', { typo: 5, yak_shave: 30, deadline: 12, flaky: 12 }), []);
    expect(s.top).toEqual([
      { src: 'yak_shave', dmg: 30 },
      { src: 'deadline', dmg: 12 },
      { src: 'flaky', dmg: 12 },
    ]);
    expect(s).toMatchObject({ cause: 'yak_shave', compactions: 2, outcome: 'ctrlc' });
    expect(s.zoneMs).toEqual([500, 6000, 3500, 0]);
    expect(s.hint).toBe('default');
  });

  it('feeds the last fight log into the hint', () => {
    const log = [1, 2, 3, 4].map((i) => throttle(`t${i}`));
    expect(summarize(ended('shipped', {}), log)).toMatchObject({ top: [], hint: 'throttle' });
  });
});
