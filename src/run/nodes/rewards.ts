// Post-fight rewards: credits with interest, 1-of-3 cards with pity and fallbacks, skip.
// Odds and amounts: docs/game/systems/economy.md#income and #reward-picks-1-of-3.
import { content } from '../../content/index.ts';
import type { Rarity } from '../../content/types/basics.ts';
import { fork, int, nextInt, pick, type Rng, weighted } from '../../sim/rng.ts';
import { type Action, type ApplyResult, fail, ok } from '../actions.ts';
import { gain, newItem, ownedTool, ownsUnique } from '../gain.ts';
import { isUnlocked } from '../new-run.ts';
import type { NodeType, RewardCard, RunState } from '../state.ts';

export const SKIP_CREDITS = 6;
const INTEREST_STEP = 10;
const INTEREST_CAP = 3;
const PITY_PICKS = 6;
const CARDS = 3;

type Source = Extract<NodeType, 'task' | 'criticalBug' | 'release'>;
type Kind = RewardCard['kind'];

/** Credits roll range, tool weight out of 100 (the rest is skill), rarity weights. */
type SourceTable = { credits: [number, number]; tool: number; rarity: Record<Rarity, number> };

const SOURCES: Readonly<Record<Source, SourceTable>> = {
  task: { credits: [10, 14], tool: 70, rarity: { common: 60, uncommon: 35, rare: 5 } },
  criticalBug: { credits: [22, 28], tool: 70, rarity: { common: 0, uncommon: 70, rare: 30 } },
  release: { credits: [40, 40], tool: 50, rarity: { common: 0, uncommon: 0, rare: 100 } },
};

export const RARITIES: readonly Rarity[] = ['common', 'uncommon', 'rare'];
/** Buckets to try when the rolled one is empty: the next lower, then higher. */
export const FALLBACK: Readonly<Record<Rarity, readonly Rarity[]>> = {
  common: ['common', 'uncommon', 'rare'],
  uncommon: ['uncommon', 'common', 'rare'],
  rare: ['rare', 'uncommon', 'common'],
};

/** Interest on the credits held before a payout. */
export const interest = (held: number): number =>
  Math.min(INTEREST_CAP, Math.floor(held / INTEREST_STEP));

type Roll = { rng: Rng; state: RunState; table: SourceTable };

/** Offerable defs of `kind`: unlocked, not in this pick, no owned unique, no v3 tool. */
function pool(roll: Roll, kind: Kind, taken: readonly RewardCard[]) {
  const { agent, setup } = roll.state;
  const defs = kind === 'tool' ? content.tools : content.skills;
  const owned = (id: string) =>
    kind === 'tool' ? ownedTool(agent, id)?.version === 3 : ownsUnique(agent, kind, id);
  return defs.filter(
    (d) =>
      isUnlocked(d.unlock, setup.unlocked) &&
      !taken.some((c) => c.kind === kind && c.id === d.id) &&
      !owned(d.id),
  );
}

/** Kind then rarity; a forced rare (pity) tries rare in both kinds before falling back. */
function rollCard(roll: Roll, taken: readonly RewardCard[], forceRare: boolean) {
  const { rng, table } = roll;
  const kinds: Kind[] = nextInt(rng, 100) < table.tool ? ['tool', 'skill'] : ['skill', 'tool'];
  const odds = RARITIES.map((value) => ({ value, weight: table.rarity[value] }));
  const rarities = FALLBACK[forceRare ? 'rare' : weighted(rng, odds)];
  const order = forceRare
    ? rarities.flatMap((r) => kinds.map((k) => [k, r] as const))
    : kinds.flatMap((k) => rarities.map((r) => [k, r] as const));
  for (const [k, r] of order) {
    const bucket = pool(roll, k, taken).filter((d) => d.rarity === r);
    if (bucket.length > 0) return { kind: k, id: pick(rng, bucket).id, rarity: r };
  }
  return null;
}

function sourceOf(state: RunState): Source {
  const node = state.map.nodes.find((n) => n.id === state.combat?.nodeId);
  const type = node?.type;
  if (type === 'task' || type === 'criticalBug' || type === 'release') return type;
  throw new RangeError(`rewards: node '${node?.id}' is not a fight node`);
}

/** Pays the won fight (interest first) and rolls its cards; all from `reward/<nodeId>`. */
export function enterReward(state: RunState): RunState {
  const source = sourceOf(state);
  const rng = fork(state.setup.seed, `reward/${state.combat?.nodeId}`);
  const roll: Roll = { rng, state, table: SOURCES[source] };
  const credits = int(rng, ...roll.table.credits);
  const gained = interest(state.agent.credits);
  const pity = source === 'task' && state.stats.taskPicksNoRare >= PITY_PICKS;
  const cards: RewardCard[] = [];
  for (let i = 0; i < CARDS; i++) {
    const card = rollCard(roll, cards, pity && i === 0);
    if (card) cards.push(card);
  }
  const rare = cards.some((c) => c.rarity === 'rare');
  const streak = state.stats.taskPicksNoRare;
  const taskPicksNoRare = source !== 'task' ? streak : rare ? 0 : streak + 1;
  return {
    ...state,
    mode: 'reward',
    agent: { ...state.agent, credits: state.agent.credits + gained + credits },
    pending: { kind: 'reward', credits, interest: gained, cards },
    stats: { ...state.stats, taskPicksNoRare },
  };
}

export function pickReward(state: RunState, ix: number): ApplyResult {
  if (state.mode !== 'reward' || state.pending?.kind !== 'reward') return fail('wrongMode');
  const card = state.pending.cards[ix];
  if (!card) return fail('notOffered');
  return ok(gain(state, newItem(card.kind, card.id), 'map'));
}

export function skipReward(state: RunState): ApplyResult {
  if (state.mode !== 'reward' || state.pending?.kind !== 'reward') return fail('wrongMode');
  const agent = { ...state.agent, credits: state.agent.credits + SKIP_CREDITS };
  return ok({ ...state, agent, mode: 'map', pending: null });
}

/** pickReward per card, then skipReward. */
export function rewardActions(state: RunState): Action[] {
  if (state.pending?.kind !== 'reward') return [];
  const ixs = state.pending.cards.map((_, ix) => ix as 0 | 1 | 2);
  return [...ixs.map((ix): Action => ({ t: 'pickReward', ix })), { t: 'skipReward' }];
}
