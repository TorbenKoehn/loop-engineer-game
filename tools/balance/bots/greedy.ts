// Greedy bot: the reference bot for win-rate targets. A fixed heuristic, no lookahead:
// the lightest prompt, tool upgrades first, then items that equip within the context budget
// ranked by damage per weight, heal below 50% Trust, elites only when nothing else is
// reachable, and shop buys weighed against the interest they cost. Deterministic; ties
// break by legal order. Heuristic table: docs/architecture/testing.md (Balance sim).
import { content } from '../../../src/content/index.ts';
import type { Action } from '../../../src/run/actions.ts';
import { newItem } from '../../../src/run/gain.ts';
import { interest } from '../../../src/run/nodes/rewards.ts';
import type { ItemKind, ItemRef, NodeType, OwnedItem, RunState } from '../../../src/run/state.ts';
import type { Bot } from './bot.ts';
import { choiceScore } from './event-score.ts';
import { fitsLoadout, isUpgrade, itemScore, toolScore } from './score.ts';

/** Heal (rest, map routing, events) while Trust is below this share of max Trust. */
export const LOW_TRUST_PCT = 50;
/** Score cost of one credit of interest lost per payout by a shop buy. */
export const INTEREST_WEIGHT = 15;
const UPGRADE = 100;
const NEW_TOOL = 50;
const NEW_OTHER = 40;

type Best<T> = { value: T; score: number };
/** Highest score wins; the first one on ties. */
function best<T>(options: readonly T[], score: (o: T) => number): Best<T> | null {
  let top: Best<T> | null = null;
  for (const value of options) {
    const s = score(value);
    if (top === null || s > top.score) top = { value, score: s };
  }
  return top;
}

const lowTrust = (s: RunState): boolean => s.agent.trust * 100 < s.agent.maxTrust * LOW_TRUST_PCT;

/** Worth of gaining item `id`: upgrades first, then items that equip; 0 = stash only. */
function gainScore(state: RunState, kind: ItemKind, id: string): number {
  if (isUpgrade(state, kind, id)) return UPGRADE + toolScore(id, 1);
  const item = newItem(kind, id);
  if (!fitsLoadout(state, item)) return 0;
  return (kind === 'tool' ? NEW_TOOL : NEW_OTHER) + itemScore(item);
}

function reward(state: RunState, legal: readonly Action[]): Action {
  const cards = state.pending?.kind === 'reward' ? state.pending.cards : [];
  const top = best(legal, (a) => {
    const card = a.t === 'pickReward' ? cards[a.ix] : undefined;
    return card ? gainScore(state, card.kind, card.id) : 0;
  });
  return top && top.score > 0 ? top.value : { t: 'skipReward' };
}

/** Buys the best item whose score beats the interest it costs; never rerolls or sells. */
function shop(state: RunState, legal: readonly Action[]): Action {
  const offers = state.pending?.kind === 'shop' ? state.pending.offers : [];
  const held = state.agent.credits;
  const top = best(legal, (a) => {
    const o = a.t === 'buy' ? offers[a.ix] : undefined;
    if (!o) return 0;
    const lost = interest(held) - interest(held - o.price);
    return gainScore(state, o.kind, o.id) - INTEREST_WEIGHT * lost;
  });
  return top && top.score > 0 ? top.value : { t: 'leaveShop' };
}

const ROUTE: Readonly<Record<'healthy' | 'low', Readonly<Record<NodeType, number>>>> = {
  healthy: {
    task: 5,
    freeTier: 5,
    registry: 3,
    idleCycle: 2,
    standup: 2,
    criticalBug: 1,
    release: 5,
  },
  low: { idleCycle: 5, freeTier: 4, registry: 3, standup: 2, task: 1, criticalBug: 0, release: 5 },
};

/** Next node by type; low Trust routes to rest. Never abandons while a node is reachable. */
function travel(state: RunState, legal: readonly Action[]): Action {
  const table = ROUTE[lowTrust(state) ? 'low' : 'healthy'];
  const top = best(
    legal.filter((a) => a.t === 'travel'),
    (a) => {
      const node = a.t === 'travel' ? state.map.nodes.find((n) => n.id === a.node) : undefined;
      return node ? table[node.type] : 0;
    },
  );
  return top?.value ?? { t: 'abandon' };
}

/** Heal below 50% Trust, else upgrade the tool that gains the most damage per weight. */
function rest(state: RunState, legal: readonly Action[]): Action {
  const tools = state.agent.tools;
  const top = best(
    legal.filter((a) => a.t === 'restUpgrade'),
    (a) => {
      const t = a.t === 'restUpgrade' ? tools[a.slot] : undefined;
      return t ? toolScore(t.id, (t.version + 1) as 2 | 3) - toolScore(t.id, t.version) : 0;
    },
  );
  return lowTrust(state) || !top ? { t: 'restHeal' } : top.value;
}

/** The open event's best-scored choice. */
function event(state: RunState, legal: readonly Action[]): Action {
  const p = state.pending;
  const def = p?.kind === 'event' ? content.events.find((e) => e.id === p.event) : undefined;
  const top = best(legal, (a) => {
    const choice = a.t === 'chooseEvent' ? def?.choices[a.ix] : undefined;
    return choice ? choiceScore(choice, lowTrust(state)) : Number.NEGATIVE_INFINITY;
  });
  return top?.value ?? (legal[0] as Action);
}

/** The item a discard ref names; stash refs give null (dropping one only moves the gain there). */
function discarded(state: RunState, ref: ItemRef): OwnedItem | null {
  const p = state.pending;
  if (ref.at === 'gained') return p?.kind === 'discard' ? p.item : null;
  if (ref.at === 'stash') return null;
  const { tools, skills, memories } = state.agent;
  if (ref.at === 'tool') {
    const tool = tools[ref.ix];
    return tool ? { kind: 'tool', tool } : null;
  }
  const id = (ref.at === 'skill' ? skills : memories)[ref.ix];
  return id === undefined ? null : newItem(ref.at, id);
}

/** Drops the lowest-scored of the gained item and the equipped items of its kind. */
function discard(state: RunState, legal: readonly Action[]): Action {
  const top = best(legal, (a) => {
    const item = a.t === 'discardItem' ? discarded(state, a.item) : null;
    return item ? -itemScore(item) : Number.NEGATIVE_INFINITY;
  });
  return top?.value ?? (legal[0] as Action);
}

/** The lightest system prompt: the most context room for tools. */
function prompt(legal: readonly Action[]): Action {
  const weight = (a: Action) =>
    a.t === 'pickPrompt' ? (content.prompts.find((p) => p.id === a.prompt)?.weight ?? 0) : 0;
  return best(legal, (a) => -weight(a))?.value ?? (legal[0] as Action);
}

export const greedyBot: Bot = (state, legal) => {
  if (state.mode === 'promptPick') return prompt(legal);
  if (state.mode === 'map') return travel(state, legal);
  if (state.mode === 'reward') return reward(state, legal);
  if (state.mode === 'shop') return shop(state, legal);
  if (state.mode === 'rest') return rest(state, legal);
  if (state.mode === 'event') return event(state, legal);
  if (state.mode === 'discard') return discard(state, legal);
  return legal[0] as Action;
};
