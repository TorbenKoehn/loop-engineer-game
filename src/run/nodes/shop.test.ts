import { describe, expect, it } from 'vitest';
import { content } from '../../content/index.ts';
import { fork } from '../../sim/rng.ts';
import type { Action } from '../actions.ts';
import { apply, legalActions } from '../apply.ts';
import { reachable } from '../map/graph.ts';
import { newRun } from '../new-run.ts';
import { replay } from '../replay.ts';
import type { OwnedItem, RunState, ShopOffer, ShopPending } from '../state.ts';
import { basePrice, rollShop, sellPrice } from './shop.ts';

const META = { unlocked: [], lessons: [], lintCap: 0 };
const SEEDS = Array.from({ length: 300 }, (_, i) => `S${i}`);
const PRICES = {
  tool: { common: 12, uncommon: 18, rare: 26 },
  skill: { common: 14, uncommon: 20, rare: 28 },
  memory: { common: 18, uncommon: 26, rare: 34 },
} as const;

function step(state: RunState, action: Action): RunState {
  const r = apply(state, action);
  if (!r.ok) throw new Error(`rejected ${JSON.stringify(action)}: ${r.error}`);
  return r.state;
}

function onMap(seed = 'K7Q2-M9XA'): RunState {
  const start = newRun({ seed, harness: 'terminal_purist', lint: [], tutorial: false }, META);
  return step(start, { t: 'pickPrompt', prompt: 'senior' });
}

/** `base` with its first reachable node retyped to a registry. */
function withRegistry(base: RunState): RunState {
  const id = reachable(base.map)[0] as string;
  const nodes = base.map.nodes.map((n) =>
    n.id === id ? { ...n, type: 'registry' as const, encounter: null } : n,
  );
  return { ...base, map: { ...base.map, nodes } };
}

const enter = (base: RunState) =>
  step(withRegistry(base), { t: 'travel', node: reachable(base.map)[0] as string });
const shopOf = (s: RunState): ShopPending => {
  if (s.pending?.kind !== 'shop') throw new Error('no shop pending');
  return s.pending;
};
const withAgent = (s: RunState, agent: Partial<RunState['agent']>): RunState => ({
  ...s,
  agent: { ...s.agent, ...agent },
});
const offer = (o: Partial<ShopOffer>): ShopOffer => ({
  kind: 'tool',
  id: 'grep',
  rarity: 'common',
  price: 12,
  sale: false,
  sold: false,
  ...o,
});
const withOffers = (s: RunState, offers: ShopOffer[]): RunState => ({
  ...s,
  pending: { ...shopOf(s), offers },
});
const rarityOf = (o: ShopOffer) =>
  ({ tool: content.tools, skill: content.skills, memory: content.memories })[o.kind].find(
    (d) => d.id === o.id,
  )?.rarity;

/** Wins the first fight, skips its reward and enters a row-2 registry; null if impossible. */
function registryRun(seed: string): { s: RunState; actions: Action[] } | null {
  const start = newRun({ seed, harness: 'terminal_purist', lint: [], tutorial: false }, META);
  const actions: Action[] = [{ t: 'pickPrompt', prompt: 'senior' }];
  let s = step(start, actions[0] as Action);
  actions.push({ t: 'travel', node: reachable(s.map)[0] as string });
  s = step(s, actions[1] as Action);
  if (s.combat?.outcome.outcome !== 'win') return null;
  for (const a of [{ t: 'continue' }, { t: 'skipReward' }] as const) {
    actions.push(a);
    s = step(s, a);
  }
  const next = reachable(s.map);
  const reg = s.map.nodes.find((n) => n.type === 'registry' && next.includes(n.id));
  if (!reg) return null;
  actions.push({ t: 'travel', node: reg.id });
  return { s: step(s, { t: 'travel', node: reg.id }), actions };
}

describe('offers', () => {
  it('rolls 3 tools, 1 skill and 1 memory from shop/<nodeId> with one sale at 70% (floor)', () => {
    for (const seed of SEEDS.slice(0, 40)) {
      const base = withRegistry(onMap(seed));
      const node = reachable(base.map)[0] as string;
      const s = step(base, { t: 'travel', node });
      expect(s.mode).toBe('shop');
      expect(s.pending).toEqual(rollShop(base, node, fork(seed, `shop/${node}`), 0));
      const { offers, rerolls } = shopOf(s);
      expect(rerolls).toBe(0);
      expect(offers.map((o) => o.kind)).toEqual(['tool', 'tool', 'tool', 'skill', 'memory']);
      expect(new Set(offers.map((o) => o.id)).size).toBe(5);
      expect(offers.filter((o) => o.sale)).toHaveLength(1);
      for (const o of offers) {
        expect(o.rarity).toBe(rarityOf(o));
        const full = PRICES[o.kind][o.rarity];
        expect(o.price).toBe(o.sale ? Math.floor((full * 70) / 100) : full);
        expect(o.sold).toBe(false);
      }
      // The roll depends only on the run seed and node id, not on credits.
      expect(enter(withAgent(onMap(seed), { credits: 99 })).pending).toEqual(s.pending);
    }
  });

  it('follows the rarity tables (rare tools fall back to uncommon in the base pool)', () => {
    const offers = SEEDS.flatMap((seed) => shopOf(enter(onMap(seed))).offers);
    const share = (kind: ShopOffer['kind'], rarity: ShopOffer['rarity']) => {
      const ofKind = offers.filter((o) => o.kind === kind);
      return ofKind.filter((o) => o.rarity === rarity).length / ofKind.length;
    };
    expect(share('tool', 'common')).toBeGreaterThan(0.45);
    expect(share('tool', 'common')).toBeLessThan(0.65);
    expect(share('tool', 'rare')).toBe(0);
    expect(share('skill', 'common')).toBeGreaterThan(0.5);
    expect(share('skill', 'rare')).toBeGreaterThan(0.04);
    expect(share('skill', 'rare')).toBeLessThan(0.18);
    expect(share('memory', 'rare')).toBeGreaterThan(0.08);
    expect(share('memory', 'rare')).toBeLessThan(0.24);
    expect(share('memory', 'uncommon')).toBeGreaterThan(0.25);
  });

  it('offers owned tools below v3 but never v3 tools, owned skills or memories', () => {
    const offers = SEEDS.slice(0, 100).flatMap((seed) => {
      const base = onMap(seed);
      const tools = [
        { id: 'grep', version: 3 as const, weightMod: 0 },
        ...base.agent.tools.slice(1),
      ];
      const stash: OwnedItem[] = [{ kind: 'memory', id: 'cache' }];
      return shopOf(enter(withAgent(base, { tools, stash, memories: ['gitignore'] }))).offers;
    });
    const ids = offers.map((o) => o.id);
    for (const banned of ['grep', 'unix_philosophy', 'cache', 'gitignore', 'brute_force'])
      expect(ids).not.toContain(banned);
    expect(ids).toContain('cat');
  });
});

describe('buy', () => {
  const shop = enter(onMap());

  it('deducts the price, marks the offer sold and stays in the shop', () => {
    const s = withOffers(withAgent(shop, { credits: 20 }), [
      offer({ id: 'lint', price: 12 }),
      offer({ kind: 'memory', id: 'cache', rarity: 'uncommon', price: 18, sale: true }),
    ]);
    const a = step(s, { t: 'buy', ix: 1 });
    expect(a.mode).toBe('shop');
    expect(a.agent.credits).toBe(2);
    expect(a.agent.memories).toEqual(['cache']);
    expect(shopOf(a).offers.map((o) => o.sold)).toEqual([false, true]);
    expect(apply(a, { t: 'buy', ix: 1 })).toEqual({ ok: false, error: 'notOffered' });
    expect(legalActions(a)).not.toContainEqual({ t: 'buy', ix: 0 });
  });

  it('fails with insufficientCredits when short and changes nothing', () => {
    const s = withOffers(withAgent(shop, { credits: 11 }), [offer({ price: 12 })]);
    expect(apply(s, { t: 'buy', ix: 0 })).toEqual({ ok: false, error: 'insufficientCredits' });
    expect(legalActions(s)).not.toContainEqual({ t: 'buy', ix: 0 });
    expect(apply(s, { t: 'buy', ix: 5 })).toEqual({ ok: false, error: 'notOffered' });
    expect(apply(onMap(), { t: 'buy', ix: 0 })).toEqual({ ok: false, error: 'wrongMode' });
  });

  it('merges a duplicate tool +1 version', () => {
    const s = withOffers(withAgent(shop, { credits: 30 }), [offer({ id: 'cat' })]);
    const a = step(s, { t: 'buy', ix: 0 });
    expect(a.agent.tools.map((t) => [t.id, t.version])).toEqual([
      ['grep', 1],
      ['cat', 2],
      ['sed', 1],
    ]);
    expect(a.agent.credits).toBe(18);
  });

  it('a buy without space enters discard and returns to the shop', () => {
    const stash: OwnedItem[] = ['a', 'b', 'c', 'd'].map((id) => ({ kind: 'skill', id }));
    const full = withAgent(shop, {
      credits: 30,
      skills: ['unix_philosophy', 'grep_first', 'rubber_duck'],
      stash,
    });
    const s = withOffers(full, [offer({ kind: 'skill', id: 'lockfile', price: 14 })]);
    const d = step(s, { t: 'buy', ix: 0 });
    expect(d.mode).toBe('discard');
    const dropped = step(d, { t: 'discardItem', item: { at: 'gained' } });
    expect(dropped.mode).toBe('shop');
    expect(dropped.agent.credits).toBe(16);
    expect(shopOf(dropped).offers[0]?.sold).toBe(true);
    const kept = step(d, { t: 'discardItem', item: { at: 'skill', ix: 0 } });
    expect([kept.mode, kept.agent.skills]).toEqual([
      'shop',
      ['grep_first', 'rubber_duck', 'lockfile'],
    ]);
  });
});

describe('reroll', () => {
  it('costs 2 + rerolls this visit and rolls from shop/<nodeId>/reroll/<n>', () => {
    let s = withAgent(enter(onMap()), { credits: 20 });
    const node = shopOf(s).node;
    for (const [n, cost] of [
      [1, 2],
      [2, 3],
      [3, 4],
    ] as const) {
      expect(legalActions(s)).toContainEqual({ t: 'reroll' });
      const before = s;
      s = step(s, { t: 'reroll' });
      expect(s.agent.credits).toBe(before.agent.credits - cost);
      const rng = fork('K7Q2-M9XA', `shop/${node}/reroll/${n}`);
      expect(s.pending).toEqual(rollShop(s, node, rng, n));
      expect(s.mode).toBe('shop');
    }
    expect(s.agent.credits).toBe(11);
  });

  it('fails with insufficientCredits when short', () => {
    const s = withAgent(enter(onMap()), { credits: 1 });
    expect(apply(s, { t: 'reroll' })).toEqual({ ok: false, error: 'insufficientCredits' });
    expect(legalActions(s)).not.toContainEqual({ t: 'reroll' });
    expect(apply(onMap(), { t: 'reroll' })).toEqual({ ok: false, error: 'wrongMode' });
  });
});

describe('sell', () => {
  const shop = withAgent(enter(onMap()), { credits: 0 });

  it('pays floor(basePrice x version / 2), skills and memories as version 1', () => {
    const tool = (id: string, version: 1 | 2 | 3): OwnedItem => ({
      kind: 'tool',
      tool: { id, version, weightMod: 0 },
    });
    expect(sellPrice(shop, tool('web_search', 3))).toBe(27);
    expect(sellPrice(shop, tool('web_search', 1))).toBe(9);
    expect(sellPrice(shop, tool('grep', 2))).toBe(12);
    expect(sellPrice(shop, { kind: 'skill', id: 'grep_first' })).toBe(10);
    expect(sellPrice(shop, { kind: 'memory', id: 'long_context' })).toBe(17);
    const s = withAgent(shop, { stash: [tool('web_search', 3)], memories: ['keyboard_shortcuts'] });
    const sold = step(s, { t: 'sell', item: { at: 'stash', ix: 0 } });
    expect([sold.agent.credits, sold.agent.stash]).toEqual([27, []]);
    const mem = step(sold, { t: 'sell', item: { at: 'memory', ix: 0 } });
    expect([mem.agent.credits, mem.agent.memories, mem.mode]).toEqual([36, [], 'shop']);
  });

  it('counts starter items as common', () => {
    const item: OwnedItem = { kind: 'tool', tool: { id: 'web_search', version: 1, weightMod: 0 } };
    expect(basePrice(item, [])).toBe(18);
    expect(basePrice(item, ['web_search'])).toBe(12);
    expect(basePrice({ kind: 'skill', id: 'grep_first' }, ['grep_first'])).toBe(14);
    expect(() => basePrice({ kind: 'skill', id: 'nope' }, [])).toThrow(RangeError);
  });

  it('refuses the last tool', () => {
    const one = withAgent(shop, { tools: [{ id: 'grep', version: 2, weightMod: 0 }] });
    expect(apply(one, { t: 'sell', item: { at: 'tool', ix: 0 } })).toEqual({
      ok: false,
      error: 'lastTool',
    });
    expect(legalActions(one)).not.toContainEqual({ t: 'sell', item: { at: 'tool', ix: 0 } });
    const two = step(shop, { t: 'sell', item: { at: 'tool', ix: 1 } });
    expect(two.agent.tools.map((t) => t.id)).toEqual(['grep', 'sed']);
  });

  it('is legal only in a shop and only for owned items', () => {
    const item = { at: 'tool', ix: 0 } as const;
    expect(apply(onMap(), { t: 'sell', item })).toEqual({ ok: false, error: 'wrongMode' });
    for (const bad of [{ at: 'gained' }, { at: 'stash', ix: 0 }, { at: 'memory', ix: 0 }] as const)
      expect(apply(shop, { t: 'sell', item: bad })).toEqual({ ok: false, error: 'notOffered' });
    expect(legalActions(shop).filter((a) => a.t === 'sell')).toEqual([
      { t: 'sell', item: { at: 'tool', ix: 0 } },
      { t: 'sell', item: { at: 'tool', ix: 1 } },
      { t: 'sell', item: { at: 'tool', ix: 2 } },
      { t: 'sell', item: { at: 'skill', ix: 0 } },
    ]);
  });
});

describe('shop actions', () => {
  it('lists no prune action and rejects one; leaveShop returns to the map', () => {
    const s = withAgent(enter(onMap()), { credits: 99 });
    const kinds = new Set(legalActions(s).map((a) => a.t));
    expect([...kinds]).toEqual(['buy', 'reroll', 'sell', 'leaveShop']);
    const prune = { t: 'prune', slot: 0 } as unknown as Action;
    expect(apply(s, prune)).toEqual({ ok: false, error: 'unknownAction' });
    const left = step(s, { t: 'leaveShop' });
    expect([left.mode, left.pending]).toEqual(['map', null]);
    expect(apply(left, { t: 'leaveShop' })).toEqual({ ok: false, error: 'wrongMode' });
  });

  it('a real registry visit: every legal action is accepted and the run replays', () => {
    const run = SEEDS.map(registryRun).find((r) => r !== null);
    if (!run) throw new Error('no seed reaches a registry on row 2');
    let s = run.s;
    expect(s.mode).toBe('shop');
    for (let i = 0; i < 8 && s.mode === 'shop'; i++) {
      const legal = legalActions(s);
      for (const a of legal) expect(apply(s, a).ok).toBe(true);
      const a = legal[(i * 5) % Math.max(1, legal.length - 1)] as Action;
      run.actions.push(a);
      s = step(s, a);
    }
    expect(replay(s.setup, run.actions)).toEqual({ ok: true, state: s });
  });
});
