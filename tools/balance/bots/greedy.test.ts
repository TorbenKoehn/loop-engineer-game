import { describe, expect, it } from 'vitest';
import { legalActions } from '../../../src/run/apply.ts';
import { newRun } from '../../../src/run/new-run.ts';
import type { MapNode, RunState, ShopOffer } from '../../../src/run/state.ts';
import { FRESH_META } from '../run.ts';
import { greedyBot } from './greedy.ts';

/** Terminal Purist (grep, cat, sed; W 60, Trust 80) with the Concise prompt. */
function base(patch: Partial<RunState> = {}): RunState {
  const setup = { seed: 'greedy-unit', harness: 'terminal_purist', lint: [], tutorial: false };
  const s = newRun(setup, FRESH_META);
  return { ...s, setup: { ...s.setup, prompt: 'concise' }, pending: null, ...patch };
}

const decide = (s: RunState) => greedyBot(s, legalActions(s));
const withTrust = (s: RunState, trust: number): RunState => ({
  ...s,
  agent: { ...s.agent, trust },
});

describe('greedy bot heuristic', () => {
  it('picks the lightest system prompt', () => {
    const s = newRun(
      { seed: 'g', harness: 'terminal_purist', lint: [], tutorial: false },
      FRESH_META,
    );
    expect(decide(s)).toEqual({ t: 'pickPrompt', prompt: 'concise' });
  });

  it('rests to heal below 50% Trust and upgrades a tool otherwise', () => {
    const rest = base({ mode: 'rest' });
    expect(decide(withTrust(rest, 39))).toEqual({ t: 'restHeal' });
    expect(decide(withTrust(rest, 40))).toMatchObject({ t: 'restUpgrade' });
  });

  it('routes to an Idle Cycle when Trust is low and to a Task when healthy, never abandons', () => {
    const node = (col: number, type: MapNode['type']): MapNode => ({
      id: `p1-r1-c${col}`,
      row: 1,
      col,
      type,
      encounter: null,
    });
    const nodes = [node(0, 'criticalBug'), node(1, 'idleCycle'), node(2, 'task')];
    const s = base({ mode: 'map', map: { nodes, edges: [], visited: [], current: null } });
    expect(decide(withTrust(s, 20))).toEqual({ t: 'travel', node: 'p1-r1-c1' });
    expect(decide(s)).toEqual({ t: 'travel', node: 'p1-r1-c2' });
  });

  it('takes a tool upgrade before a new item', () => {
    const cards = [
      { kind: 'skill', id: 'lockfile', rarity: 'common' },
      { kind: 'tool', id: 'cat', rarity: 'common' },
    ] as const;
    const s = base({
      mode: 'reward',
      pending: { kind: 'reward', credits: 10, interest: 0, cards: [...cards] },
    });
    expect(decide(s)).toEqual({ t: 'pickReward', ix: 1 });
  });

  it('skips a reward that would only land in the stash', () => {
    const s0 = base();
    const cards = [{ kind: 'tool', id: 'read_file', rarity: 'common' }] as const;
    const s = base({
      mode: 'reward',
      agent: { ...s0.agent, slots: { ...s0.agent.slots, tools: 3 } },
      pending: { kind: 'reward', credits: 10, interest: 0, cards: [...cards] },
    });
    expect(decide(s)).toEqual({ t: 'skipReward' });
  });

  it('is interest-aware: keeps the interest over a skill, still buys an upgrade', () => {
    const offer = (kind: ShopOffer['kind'], id: string): ShopOffer => ({
      kind,
      id,
      rarity: 'common',
      price: 28,
      sale: false,
      sold: false,
    });
    const s0 = base();
    const shop = (offers: ShopOffer[]): RunState =>
      base({
        mode: 'shop',
        agent: { ...s0.agent, credits: 30 },
        pending: { kind: 'shop', node: 'p1-r2-c0', rerolls: 0, offers },
      });
    expect(decide(shop([offer('skill', 'lockfile')]))).toEqual({ t: 'leaveShop' });
    expect(decide(shop([offer('skill', 'lockfile'), offer('tool', 'grep')]))).toEqual({
      t: 'buy',
      ix: 1,
    });
  });
});
