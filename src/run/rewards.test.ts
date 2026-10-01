import { describe, expect, it } from 'vitest';
import { content } from '../content/index.ts';
import { fork, int } from '../sim/rng.ts';
import type { Action } from './actions.ts';
import { apply, legalActions } from './apply.ts';
import { reachable } from './map/graph.ts';
import { newRun } from './new-run.ts';
import { replay } from './replay.ts';
import type { NodeType, OwnedItem, Pending, RewardCard, RunState } from './state.ts';

const META = { unlocked: [], lessons: [], lintCap: 0 };
const SEEDS = Array.from({ length: 40 }, (_, i) => `R${i}`);

function step(state: RunState, action: Action): RunState {
  const r = apply(state, action);
  if (!r.ok) throw new Error(`rejected ${JSON.stringify(action)}: ${r.error}`);
  return r.state;
}

function onMap(seed = 'K7Q2-M9XA'): RunState {
  const start = newRun({ seed, harness: 'terminal_purist', lint: [], tutorial: false }, META);
  return step(start, { t: 'pickPrompt', prompt: 'senior' });
}

/** A won fight on `nodeId` (default: the first reachable), its node retyped to `type`. */
function wonAt(base: RunState, type: NodeType, nodeId?: string): RunState {
  const fought = step(base, { t: 'travel', node: reachable(base.map)[0] as string });
  if (fought.combat?.outcome.outcome !== 'win') throw new Error('expected a win');
  const id = nodeId ?? fought.combat.nodeId;
  const nodes = fought.map.nodes.map((n) => (n.id === id ? { ...n, type } : n));
  return { ...fought, map: { ...fought.map, nodes }, combat: { ...fought.combat, nodeId: id } };
}

const withAgent = (s: RunState, agent: Partial<RunState['agent']>): RunState => ({
  ...s,
  agent: { ...s.agent, ...agent },
});
const reward = (s: RunState) => step(s, { t: 'continue' });
const pending = <K extends Pending['kind']>(s: RunState, kind: K) => {
  if (s.pending?.kind !== kind) throw new Error(`no ${kind} pending`);
  return s.pending as Extract<Pending, { kind: K }>;
};
const cardsOf = (s: RunState) => pending(s, 'reward').cards;
const offer = (s: RunState, cards: RewardCard[]): RunState => ({
  ...s,
  mode: 'reward',
  pending: { kind: 'reward', credits: 0, interest: 0, cards },
});
const rarityOf = (kind: RewardCard['kind'], id: string) =>
  (kind === 'tool' ? content.tools : content.skills).find((d) => d.id === id)?.rarity;

describe('payout and interest', () => {
  it('Task pays 10 + roll(0..4) via reward/<nodeId> plus interest on the credits held', () => {
    const won = wonAt(onMap(), 'task');
    const id = won.combat?.nodeId as string;
    const roll = int(fork('K7Q2-M9XA', `reward/${id}`), 10, 14);
    for (const [held, interest] of [
      [0, 0],
      [9, 0],
      [10, 1],
      [25, 2],
      [30, 3],
      [99, 3],
    ]) {
      const s = reward(withAgent(won, { credits: held as number }));
      expect(s.mode).toBe('reward');
      expect(pending(s, 'reward')).toMatchObject({ credits: roll, interest });
      expect(s.agent.credits).toBe((held as number) + (interest as number) + roll);
    }
  });

  it('Critical Bug pays 22..28 and Release pays 40', () => {
    const rolls = SEEDS.map((seed) => pending(reward(wonAt(onMap(seed), 'criticalBug')), 'reward'));
    expect(rolls.every((p) => p.credits >= 22 && p.credits <= 28)).toBe(true);
    expect(new Set(rolls.map((p) => p.credits)).size).toBeGreaterThan(1);
    expect(pending(reward(wonAt(onMap(), 'release')), 'reward').credits).toBe(40);
  });
});

describe('reward cards', () => {
  it('offers 3 distinct unlocked cards, never owned skills or v3 tools', () => {
    for (const seed of SEEDS) {
      const base = onMap(seed);
      const tools = base.agent.tools.map((t, i) => (i === 0 ? { ...t, version: 3 as const } : t));
      const stash: OwnedItem[] = [{ kind: 'skill', id: 'rubber_duck' }];
      const s = reward(withAgent(wonAt(base, 'task'), { tools, stash }));
      const cards = cardsOf(s);
      expect(cards).toHaveLength(3);
      expect(new Set(cards.map((c) => c.id)).size).toBe(3);
      const ids = cards.map((c) => c.id);
      for (const banned of [
        'grep',
        'unix_philosophy',
        'rubber_duck',
        'brute_force',
        'feedback_loop',
      ])
        expect(ids).not.toContain(banned);
      for (const c of cards) expect(c.rarity).toBe(rarityOf(c.kind, c.id));
    }
  });

  it('Release cards are rare where possible, falling back to the next lower rarity', () => {
    const cards = SEEDS.flatMap((seed) => cardsOf(reward(wonAt(onMap(seed), 'release'))));
    // No rare tool is unlocked in the base pool: tools fall back to uncommon, never common.
    expect(cards.filter((c) => c.kind === 'tool').every((c) => c.rarity === 'uncommon')).toBe(true);
    expect(cards.some((c) => c.id === 'long_context_training')).toBe(true);
    expect(cards.every((c) => c.rarity !== 'common')).toBe(true);
  });

  it('an empty common bucket falls back higher (Task, all commons owned)', () => {
    const commons = (list: readonly { id: string; rarity: string }[]) =>
      list.filter((d) => d.rarity === 'common').map((d) => d.id);
    const tools = commons(content.tools).map((id) => ({ id, version: 3 as const, weightMod: 0 }));
    const cards = SEEDS.flatMap((seed) => {
      const s = withAgent(wonAt(onMap(seed), 'task'), { tools, skills: commons(content.skills) });
      return cardsOf(reward(s));
    });
    expect(cards.every((c) => c.rarity !== 'common')).toBe(true);
  });

  it('an empty uncommon bucket falls back lower before higher (Critical Bug)', () => {
    const uncommon = (list: readonly { id: string; rarity: string }[]) =>
      list.filter((d) => d.rarity === 'uncommon').map((d) => d.id);
    const tools = uncommon(content.tools).map((id) => ({ id, version: 3 as const, weightMod: 0 }));
    const cards = SEEDS.flatMap((seed) => {
      const base = wonAt(onMap(seed), 'criticalBug');
      return cardsOf(reward(withAgent(base, { tools, skills: uncommon(content.skills) })));
    });
    expect(cards.every((c) => c.rarity !== 'uncommon')).toBe(true);
    expect(cards.some((c) => c.rarity === 'common')).toBe(true);
  });
});

describe('pity', () => {
  it('after 6 Task picks without a rare the next Task pick has one', () => {
    for (const seed of SEEDS) {
      const base = wonAt(onMap(seed), 'task');
      const s = reward({ ...base, stats: { ...base.stats, taskPicksNoRare: 6 } });
      expect(cardsOf(s).some((c) => c.rarity === 'rare')).toBe(true);
      expect(s.stats.taskPicksNoRare).toBe(0);
    }
  });

  it('counts Task offers without a rare in sequence and only Task offers', () => {
    let state = onMap('PITY');
    const fights = state.map.nodes.filter((n) => n.encounter !== null).map((n) => n.id);
    let streak = 0;
    let pity = 0;
    for (const id of fights) {
      const s = reward({ ...wonAt(state, 'task', id), stats: state.stats });
      const rare = cardsOf(s).some((c) => c.rarity === 'rare');
      if (streak >= 6) {
        expect(rare).toBe(true);
        pity++;
      }
      streak = rare ? 0 : streak + 1;
      expect(s.stats.taskPicksNoRare).toBe(streak);
      state = { ...onMap('PITY'), stats: s.stats };
    }
    expect(pity).toBeGreaterThan(0);
    const elite = reward({ ...wonAt(state, 'criticalBug'), stats: state.stats });
    expect(elite.stats.taskPicksNoRare).toBe(streak);
  });
});

describe('pick, merge and skip', () => {
  const base = onMap();

  it('a duplicate tool pick merges +1 version, equipped or stashed', () => {
    const s = step(offer(base, [{ kind: 'tool', id: 'grep', rarity: 'common' }]), {
      t: 'pickReward',
      ix: 0,
    });
    expect(s.mode).toBe('map');
    expect(s.pending).toBeNull();
    expect(s.agent.tools.map((t) => [t.id, t.version])).toEqual([
      ['grep', 2],
      ['cat', 1],
      ['sed', 1],
    ]);
    const stashed = withAgent(base, {
      stash: [{ kind: 'tool', tool: { id: 'lint', version: 2, weightMod: 0 } }],
    });
    const m = step(offer(stashed, [{ kind: 'tool', id: 'lint', rarity: 'common' }]), {
      t: 'pickReward',
      ix: 0,
    });
    expect(m.agent.stash).toEqual([
      { kind: 'tool', tool: { id: 'lint', version: 3, weightMod: 0 } },
    ]);
  });

  it('a new item fills a free slot first, then the stash', () => {
    const cards: RewardCard[] = [
      { kind: 'tool', id: 'lint', rarity: 'common' },
      { kind: 'skill', id: 'rubber_duck', rarity: 'common' },
    ];
    const tool = step(offer(base, cards), { t: 'pickReward', ix: 0 });
    expect(tool.agent.tools.at(-1)).toEqual({ id: 'lint', version: 1, weightMod: 0 });
    expect(step(offer(base, cards), { t: 'pickReward', ix: 1 }).agent.skills).toContain(
      'rubber_duck',
    );
    const full = withAgent(base, { skills: ['a', 'b', 'c'] });
    const stashed = step(offer(full, cards), { t: 'pickReward', ix: 1 });
    expect(stashed.agent.stash).toEqual([{ kind: 'skill', id: 'rubber_duck' }]);
  });

  it('skipReward gives +6 credits and returns to the map', () => {
    const s = step(offer(base, []), { t: 'skipReward' });
    expect(s.agent.credits).toBe(base.agent.credits + 6);
    expect([s.mode, s.pending]).toEqual(['map', null]);
  });

  it('lists one pickReward per card plus skipReward and rejects other picks', () => {
    const s = reward(wonAt(base, 'task'));
    expect(legalActions(s)).toEqual([
      { t: 'pickReward', ix: 0 },
      { t: 'pickReward', ix: 1 },
      { t: 'pickReward', ix: 2 },
      { t: 'skipReward' },
    ]);
    const one = offer(base, [{ kind: 'tool', id: 'lint', rarity: 'common' }]);
    expect(apply(one, { t: 'pickReward', ix: 1 })).toEqual({ ok: false, error: 'notOffered' });
    expect(apply(base, { t: 'pickReward', ix: 0 })).toEqual({ ok: false, error: 'wrongMode' });
    expect(apply(base, { t: 'skipReward' })).toEqual({ ok: false, error: 'wrongMode' });
  });

  it('replays a reward pick to the same state', () => {
    const start = newRun(
      { seed: 'RP', harness: 'terminal_purist', lint: [], tutorial: false },
      META,
    );
    const actions: Action[] = [{ t: 'pickPrompt', prompt: 'senior' }];
    let s = step(start, actions[0] as Action);
    for (const a of [{ t: 'travel', node: reachable(s.map)[0] }, { t: 'continue' }] as Action[]) {
      actions.push(a);
      s = step(s, a);
    }
    actions.push({ t: 'pickReward', ix: 0 });
    s = step(s, { t: 'pickReward', ix: 0 });
    expect(replay(start.setup, actions)).toEqual({ ok: true, state: s });
  });
});

describe('discard', () => {
  const stash: OwnedItem[] = ['a', 'b', 'c', 'd'].map((id) => ({ kind: 'skill', id }));
  const tools = ['grep', 'cat', 'sed', 'read_file', 'edit_file', 'autocomplete'].map((id) => ({
    id,
    version: 1 as const,
    weightMod: 0,
  }));
  const full = withAgent(onMap(), { tools, stash });
  const gained = step(offer(full, [{ kind: 'tool', id: 'lint', rarity: 'common' }]), {
    t: 'pickReward',
    ix: 0,
  });
  const lint: OwnedItem = { kind: 'tool', tool: { id: 'lint', version: 1, weightMod: 0 } };

  it('gaining an item with no free slot or stash enters discard mode', () => {
    expect(gained.mode).toBe('discard');
    expect(gained.pending).toEqual({ kind: 'discard', item: lint, next: 'map' });
    expect(gained.agent).toEqual(full.agent);
    expect(legalActions(gained)).toHaveLength(1 + 6 + 4);
    expect(legalActions(gained)).toContainEqual({ t: 'discardItem', item: { at: 'gained' } });
  });

  it('discardItem drops the gained item, a stash item or an equipped one of the same kind', () => {
    const drop = step(gained, { t: 'discardItem', item: { at: 'gained' } });
    expect([drop.mode, drop.pending, drop.agent]).toEqual(['map', null, full.agent]);
    const fromStash = step(gained, { t: 'discardItem', item: { at: 'stash', ix: 1 } });
    expect(fromStash.agent.stash.map((i) => (i.kind === 'tool' ? i.tool.id : i.id))).toEqual([
      'a',
      'c',
      'd',
      'lint',
    ]);
    const equipped = step(gained, { t: 'discardItem', item: { at: 'tool', ix: 1 } });
    expect(equipped.agent.tools.map((t) => t.id)).toEqual([
      'grep',
      'sed',
      'read_file',
      'edit_file',
      'autocomplete',
      'lint',
    ]);
    expect(equipped.mode).toBe('map');
  });

  it('rejects refs that free no space and discardItem outside discard mode', () => {
    expect(apply(gained, { t: 'discardItem', item: { at: 'skill', ix: 0 } })).toEqual({
      ok: false,
      error: 'notOffered',
    });
    expect(apply(gained, { t: 'discardItem', item: { at: 'stash', ix: 4 } })).toEqual({
      ok: false,
      error: 'notOffered',
    });
    expect(apply(full, { t: 'discardItem', item: { at: 'gained' } })).toEqual({
      ok: false,
      error: 'wrongMode',
    });
  });
});
