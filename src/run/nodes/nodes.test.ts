import { describe, expect, it } from 'vitest';
import { content } from '../../content/index.ts';
import { fork, pick } from '../../sim/rng.ts';
import type { Action } from '../actions.ts';
import { apply, legalActions } from '../apply.ts';
import { reachable } from '../map/graph.ts';
import { newRun } from '../new-run.ts';
import { replay } from '../replay.ts';
import type { NodeType, OwnedItem, RunState } from '../state.ts';

const META = { unlocked: [], lessons: [], lintCap: 0 };
const SEED = 'K7Q2-M9XA';

function step(state: RunState, action: Action): RunState {
  const r = apply(state, action);
  if (!r.ok) throw new Error(`rejected ${JSON.stringify(action)}: ${r.error}`);
  return r.state;
}

function onMap(seed = SEED): RunState {
  const start = newRun({ seed, harness: 'terminal_purist', lint: [], tutorial: false }, META);
  return step(start, { t: 'pickPrompt', prompt: 'senior' });
}

/** The first reachable node retyped to `type` (no encounter), then travelled to. */
function arriveAt(base: RunState, type: NodeType): RunState {
  const id = reachable(base.map)[0] as string;
  const nodes = base.map.nodes.map((n) => (n.id === id ? { ...n, type, encounter: null } : n));
  return step({ ...base, map: { ...base.map, nodes } }, { t: 'travel', node: id });
}

const withAgent = (s: RunState, agent: Partial<RunState['agent']>): RunState => ({
  ...s,
  agent: { ...s.agent, ...agent },
});
const memory = (id: string): OwnedItem => ({ kind: 'memory', id });
const IDS = content.memories.map((m) => m.id);

describe('Idle Cycle', () => {
  const rest = arriveAt(onMap(), 'idleCycle');

  it('enters rest mode offering heal and an upgrade per tool below v3', () => {
    expect(rest.mode).toBe('rest');
    const actions = legalActions(rest);
    expect(actions[0]).toEqual({ t: 'restHeal' });
    expect(actions).toHaveLength(1 + rest.agent.tools.length);
  });

  it('restHeal heals ceil(30% of max Trust), capped at max', () => {
    const hurt = withAgent(rest, { trust: 10, maxTrust: 33 });
    const healed = step(hurt, { t: 'restHeal' });
    expect(healed.agent.trust).toBe(10 + 10);
    expect(healed.mode).toBe('map');
    const near = step(withAgent(rest, { trust: 32, maxTrust: 33 }), { t: 'restHeal' });
    expect(near.agent.trust).toBe(33);
  });

  it('restUpgrade gives +1 version to a chosen tool below v3, nothing healed', () => {
    const hurt = withAgent(rest, { trust: 10 });
    const up = step(hurt, { t: 'restUpgrade', slot: 1 });
    expect(up.agent.tools[1]?.version).toBe((rest.agent.tools[1]?.version ?? 0) + 1);
    expect(up.agent.tools[0]).toEqual(rest.agent.tools[0]);
    expect(up.agent.trust).toBe(10);
    expect(up.mode).toBe('map');
  });

  it('rejects upgrading a v3 or missing tool and rest actions outside rest', () => {
    const tools = rest.agent.tools.map((t, i) => (i === 0 ? { ...t, version: 3 as const } : t));
    const maxed = withAgent(rest, { tools });
    expect(apply(maxed, { t: 'restUpgrade', slot: 0 })).toEqual({ ok: false, error: 'notOffered' });
    expect(legalActions(maxed)).not.toContainEqual({ t: 'restUpgrade', slot: 0 });
    expect(apply(maxed, { t: 'restUpgrade', slot: 99 })).toEqual({
      ok: false,
      error: 'notOffered',
    });
    expect(apply(onMap(), { t: 'restHeal' })).toEqual({ ok: false, error: 'wrongMode' });
  });
});

describe('Free Tier', () => {
  const tier = arriveAt(onMap(), 'freeTier');
  const node = tier.map.current as string;

  it('enters treasure mode; takeTreasure grants the memory rolled from treasure/<nodeId>', () => {
    expect(tier.mode).toBe('treasure');
    expect(legalActions(tier)).toEqual([{ t: 'takeTreasure' }]);
    const got = step(tier, { t: 'takeTreasure' });
    const expected = pick(fork(SEED, `treasure/${node}`), content.memories).id;
    expect(got.agent.memories).toEqual([expected]);
    expect(got.mode).toBe('map');
  });

  it('with every memory owned it grants nothing and returns to the map', () => {
    const got = step(withAgent(tier, { memories: IDS }), { t: 'takeTreasure' });
    expect(got.agent.memories).toEqual(IDS);
    expect(got.mode).toBe('map');
    expect(got.pending).toBeNull();
  });

  it('never grants an owned memory', () => {
    const first = pick(fork(SEED, `treasure/${node}`), content.memories).id;
    const got = step(withAgent(tier, { memories: [first] }), { t: 'takeTreasure' });
    expect(got.agent.memories).toHaveLength(2);
    expect(new Set(got.agent.memories).size).toBe(2);
  });

  it('with memory slots and stash full it enters discard mode', () => {
    const full = withAgent(tier, {
      memories: [IDS[0] as string, IDS[1] as string],
      stash: [0, 1, 2, 3].map(() => ({ kind: 'skill', id: 'x' }) as OwnedItem),
    });
    const s = step(full, { t: 'takeTreasure' });
    expect(s.mode).toBe('discard');
    expect(s.pending).toMatchObject({ kind: 'discard', next: 'map', item: { kind: 'memory' } });
    const done = step(s, { t: 'discardItem', item: { at: 'gained' } });
    expect(done.mode).toBe('map');
  });

  it('is deterministic under replay', () => {
    const start = newRun(
      { seed: SEED, harness: 'terminal_purist', lint: [], tutorial: false },
      META,
    );
    expect(replay(start.setup, [{ t: 'pickPrompt', prompt: 'senior' }]).ok).toBe(true);
  });
});

describe('Critical Bug memory', () => {
  function elite(base: RunState): RunState {
    const fought = step(base, { t: 'travel', node: reachable(base.map)[0] as string });
    if (fought.combat?.outcome.outcome !== 'win') throw new Error('expected a win');
    const id = fought.combat.nodeId;
    const nodes = fought.map.nodes.map((n) =>
      n.id === id ? { ...n, type: 'criticalBug' as const } : n,
    );
    return { ...fought, map: { ...fought.map, nodes } };
  }

  it('a win adds one memory rolled from elite-memory/<nodeId> next to the reward', () => {
    const won = elite(onMap());
    const s = step(won, { t: 'continue' });
    const id = won.combat?.nodeId as string;
    expect(s.mode).toBe('reward');
    expect(s.pending?.kind).toBe('reward');
    expect(s.agent.memories).toEqual([pick(fork(SEED, `elite-memory/${id}`), content.memories).id]);
  });

  it('with every memory owned the reward opens unchanged', () => {
    const s = step(withAgent(elite(onMap()), { memories: IDS }), { t: 'continue' });
    expect(s.mode).toBe('reward');
    expect(s.pending?.kind).toBe('reward');
    expect(s.agent.memories).toEqual(IDS);
  });

  it('a full loadout discards, then resumes the reward pick', () => {
    const won = withAgent(elite(onMap()), {
      memories: [IDS[0] as string, IDS[1] as string],
      stash: [0, 1, 2, 3].map(() => ({ kind: 'skill', id: 'x' }) as OwnedItem),
    });
    const s = step(won, { t: 'continue' });
    expect(s.mode).toBe('discard');
    const done = step(s, { t: 'discardItem', item: { at: 'gained' } });
    expect(done.mode).toBe('reward');
    expect(done.pending?.kind).toBe('reward');
    expect(legalActions(done)).toContainEqual({ t: 'skipReward' });
  });
});
