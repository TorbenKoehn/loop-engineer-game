import { describe, expect, it } from 'vitest';
import type { HarnessId } from '../../src/content/types/ids.ts';
import { legalActions } from '../../src/run/apply.ts';
import { replay } from '../../src/run/replay.ts';
import { BOTS, type BotName, playRun, reachedBoss } from './run.ts';

const HARNESSES: readonly HarnessId[] = ['terminal_purist', 'ide_companion'];
/** 200 runs: seeds bot-1..bot-200, harnesses alternating. */
const SPECS = Array.from({ length: 200 }, (_, i) => ({
  seed: `bot-${i + 1}`,
  harness: HARNESSES[i % 2] as HarnessId,
}));

describe.each<BotName>(['random', 'greedy'])('%s bot', (name) => {
  const bot = BOTS[name];

  it('the same seed gives the same run, and replay rebuilds it', () => {
    for (const spec of SPECS.slice(0, 6)) {
      const a = playRun(spec, bot);
      const b = playRun(spec, bot);
      expect(b.actions).toEqual(a.actions);
      expect(b.state).toEqual(a.state);
      const r = replay(a.state.setup, a.actions);
      expect(r.ok && r.state).toEqual(a.state);
    }
  });

  it('is pure: returns a legal action and leaves the state untouched', () => {
    const { state, actions } = playRun(SPECS[1] as (typeof SPECS)[number], BOTS.greedy);
    const mid = replay(state.setup, actions.slice(0, Math.floor(actions.length / 2)));
    if (!mid.ok) throw new Error(mid.error);
    const before = structuredClone(mid.state);
    const legal = legalActions(mid.state);
    const pick = bot(mid.state, legal);
    expect(legal).toContainEqual(pick);
    expect(bot(mid.state, legal)).toEqual(pick);
    expect(mid.state).toEqual(before);
  });
});

describe('batch runs', () => {
  it('the random bot completes 200 runs, each ending in runEnd', () => {
    for (const spec of SPECS) {
      const { state } = playRun(spec, BOTS.random);
      expect(state.mode).toBe('runEnd');
      expect(state.result).not.toBeNull();
    }
  });

  it('random runs vary with the seed', () => {
    const runs = SPECS.slice(0, 20).map((s) => JSON.stringify(playRun(s, BOTS.random).actions));
    expect(new Set(runs).size).toBeGreaterThan(10);
  });

  it('the greedy bot reaches the boss in at least half of 200 runs (sanity)', () => {
    const boss = SPECS.filter((spec) => reachedBoss(playRun(spec, BOTS.greedy).state)).length;
    expect(boss).toBeGreaterThanOrEqual(100);
  }, 30_000);
});
