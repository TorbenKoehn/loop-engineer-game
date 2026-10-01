// Package Registry: 5 offers with one sale, buy (duplicate tools merge), reroll, sell.
// Odds and prices: docs/game/systems/economy.md#package-registry-shop. No Prune in M1.
import { content } from '../content/index.ts';
import type { Rarity } from '../content/types/basics.ts';
import type { UnlockRef } from '../content/types/refs.ts';
import { fork, nextInt, pick, type Rng, weighted } from '../sim/rng.ts';
import { type Action, type ApplyResult, fail, ok } from './actions.ts';
import { gain, newItem, ownedTool, ownsUnique, remove } from './gain.ts';
import { isUnlocked } from './new-run.ts';
import { FALLBACK, RARITIES } from './rewards.ts';
import type { ItemKind, ItemRef, OwnedItem, RunState, ShopOffer, ShopPending } from './state.ts';

type Odds = Readonly<Record<Rarity, number>>;

const PRICES: Readonly<Record<ItemKind, Odds>> = {
  tool: { common: 12, uncommon: 18, rare: 26 },
  skill: { common: 14, uncommon: 20, rare: 28 },
  memory: { common: 18, uncommon: 26, rare: 34 },
};
const TOOL_ODDS: Odds = { common: 55, uncommon: 35, rare: 10 };
/** Offer slots 1-5: kind and rarity weights. */
const SLOTS: readonly (readonly [ItemKind, Odds])[] = [
  ['tool', TOOL_ODDS],
  ['tool', TOOL_ODDS],
  ['tool', TOOL_ODDS],
  ['skill', { common: 60, uncommon: 30, rare: 10 }],
  ['memory', { common: 50, uncommon: 35, rare: 15 }],
];
const SALE_PCT = 70;
const REROLL_BASE = 2;
const REROLL_STEP = 1;

type Def = { readonly id: string; readonly rarity: Rarity; readonly unlock: UnlockRef };
const DEFS: Readonly<Record<ItemKind, readonly Def[]>> = {
  tool: content.tools,
  skill: content.skills,
  memory: content.memories,
};

/** Owned skills and memories are unique; owned tools are offered until v3. */
const excluded = (agent: RunState['agent'], kind: ItemKind, id: string): boolean =>
  kind === 'tool' ? ownedTool(agent, id)?.version === 3 : ownsUnique(agent, kind, id);

/** One offer for `slot`: rarity by its odds, an empty bucket falls back lower, then higher. */
function rollOffer(state: RunState, rng: Rng, slot: (typeof SLOTS)[number], taken: ShopOffer[]) {
  const [kind, odds] = slot;
  const pool = DEFS[kind].filter(
    (d) =>
      isUnlocked(d.unlock, state.setup.unlocked) &&
      !taken.some((o) => o.kind === kind && o.id === d.id) &&
      !excluded(state.agent, kind, d.id),
  );
  const rolled = weighted(
    rng,
    RARITIES.map((value) => ({ value, weight: odds[value] })),
  );
  for (const rarity of FALLBACK[rolled]) {
    const bucket = pool.filter((d) => d.rarity === rarity);
    if (bucket.length === 0) continue;
    const price = PRICES[kind][rarity];
    return { kind, id: pick(rng, bucket).id, rarity, price, sale: false, sold: false };
  }
  return null;
}

/** Rolls all offers and the one sale from `rng`. */
export function rollShop(state: RunState, node: string, rng: Rng, rerolls: number): ShopPending {
  const offers: ShopOffer[] = [];
  for (const slot of SLOTS) {
    const offer = rollOffer(state, rng, slot, offers);
    if (offer) offers.push(offer);
  }
  const sale = offers.length > 0 ? nextInt(rng, offers.length) : -1;
  const priced = offers.map((o, ix) =>
    ix === sale ? { ...o, sale: true, price: Math.floor((o.price * SALE_PCT) / 100) } : o,
  );
  return { kind: 'shop', node, rerolls, offers: priced };
}

/** Travel to a registry node: roll its offers from `shop/<nodeId>`. */
export function enterShop(state: RunState, node: string): RunState {
  const rng = fork(state.setup.seed, `shop/${node}`);
  return { ...state, mode: 'shop', pending: rollShop(state, node, rng, 0) };
}

const shopOf = (state: RunState): ShopPending | null =>
  state.mode === 'shop' && state.pending?.kind === 'shop' ? state.pending : null;

const pay = (state: RunState, cost: number): RunState => ({
  ...state,
  agent: { ...state.agent, credits: state.agent.credits - cost },
});

export function buy(state: RunState, ix: number): ApplyResult {
  const shop = shopOf(state);
  if (!shop) return fail('wrongMode');
  const offer = shop.offers[ix];
  if (!offer || offer.sold) return fail('notOffered');
  if (state.agent.credits < offer.price) return fail('insufficientCredits');
  const resume = {
    ...shop,
    offers: shop.offers.map((o, i) => ({ ...o, sold: o.sold || i === ix })),
  };
  // Back to the shop afterwards, also via discard mode when there is no space.
  const s = gain(pay(state, offer.price), newItem(offer.kind, offer.id), 'shop');
  return ok({ ...s, pending: s.pending?.kind === 'discard' ? { ...s.pending, resume } : resume });
}

const rerollCost = (shop: ShopPending): number => REROLL_BASE + REROLL_STEP * shop.rerolls;

/** Rerolls all offers and the sale; the n-th reroll this visit uses `shop/<nodeId>/reroll/<n>`. */
export function reroll(state: RunState): ApplyResult {
  const shop = shopOf(state);
  if (!shop) return fail('wrongMode');
  const cost = rerollCost(shop);
  if (state.agent.credits < cost) return fail('insufficientCredits');
  const n = shop.rerolls + 1;
  const paid = pay(state, cost);
  const rng = fork(state.setup.seed, `shop/${shop.node}/reroll/${n}`);
  return ok({ ...paid, pending: rollShop(paid, shop.node, rng, n) });
}

/** The base price an item sells from; `starters` count as common. */
export function basePrice(item: OwnedItem, starters: readonly string[]): number {
  const id = item.kind === 'tool' ? item.tool.id : item.id;
  const def = DEFS[item.kind].find((d) => d.id === id);
  if (!def) throw new RangeError(`shop: unknown ${item.kind} '${id}'`);
  return PRICES[item.kind][starters.includes(id) ? 'common' : def.rarity];
}

/** floor(basePrice x version / 2); skills and memories count as version 1. */
export function sellPrice(state: RunState, item: OwnedItem): number {
  const h = content.harnesses.find((d) => d.id === state.setup.harness);
  const starters = [...(h?.tools ?? []), ...(h?.skills ?? [])];
  const version = item.kind === 'tool' ? item.tool.version : 1;
  return Math.floor((basePrice(item, starters) * version) / 2);
}

function itemAt(agent: RunState['agent'], ref: Exclude<ItemRef, { at: 'gained' }>) {
  if (ref.at === 'stash') return agent.stash[ref.ix];
  if (ref.at === 'tool') {
    const tool = agent.tools[ref.ix];
    return tool && ({ kind: 'tool', tool } as const);
  }
  const id = (ref.at === 'skill' ? agent.skills : agent.memories)[ref.ix];
  return id === undefined ? undefined : newItem(ref.at, id);
}

/** Sells an equipped or stashed item; refused when it would leave no equipped tool. */
export function sell(state: RunState, ref: ItemRef): ApplyResult {
  if (!shopOf(state)) return fail('wrongMode');
  if (ref.at === 'gained') return fail('notOffered');
  const item = itemAt(state.agent, ref);
  if (!item) return fail('notOffered');
  const agent = remove(state.agent, ref);
  if (item.kind === 'tool' && agent.tools.length === 0) return fail('lastTool');
  const credits = agent.credits + sellPrice(state, item);
  return ok({ ...state, agent: { ...agent, credits } });
}

export function leaveShop(state: RunState): ApplyResult {
  if (!shopOf(state)) return fail('wrongMode');
  return ok({ ...state, mode: 'map', pending: null });
}

const refs = (at: ItemKind | 'stash', n: number): ItemRef[] =>
  Array.from({ length: n }, (_, ix) => ({ at, ix }));

/** Affordable buys, reroll, sellable items, leaveShop. Prune is absent in M1. */
export function shopActions(state: RunState): Action[] {
  const shop = shopOf(state);
  if (!shop) return [];
  const { credits, tools, skills, memories, stash } = state.agent;
  const buys = shop.offers.flatMap((o, ix): Action[] =>
    !o.sold && o.price <= credits ? [{ t: 'buy', ix }] : [],
  );
  const rerolls: Action[] = credits >= rerollCost(shop) ? [{ t: 'reroll' }] : [];
  const owned = [
    ...refs('tool', tools.length),
    ...refs('skill', skills.length),
    ...refs('memory', memories.length),
    ...refs('stash', stash.length),
  ];
  const sells = owned
    .filter((item) => sell(state, item).ok)
    .map((item): Action => ({ t: 'sell', item }));
  return [...buys, ...rerolls, ...sells, { t: 'leaveShop' }];
}
