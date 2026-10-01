// Batch runner: plays runs with a bot and records what the balance report needs, observed
// from the states the bot sees (docs/architecture/testing.md#balance-sim-toolsbalance).
import { content } from '../../src/content/index.ts';
import type { HarnessId } from '../../src/content/types/ids.ts';
import type { Action } from '../../src/run/actions.ts';
import type { RunState } from '../../src/run/state.ts';
import type { Bot } from './bots/bot.ts';
import { BOTS, type BotName, playRun, reachedBoss } from './run.ts';

/** Exit criterion 5 groups easy and hard pools as normal fights. */
export type FightClass = 'normal' | 'elite' | 'boss';

export interface FightRecord {
  cls: FightClass;
  /** Fight length in sim ms (`endT`). */
  ms: number;
  trustLost: number;
  compactions: number;
}

export interface RunRecord {
  seed: string;
  harness: HarnessId;
  prompt: string;
  won: boolean;
  outcome: string;
  phase: number;
  boss: boolean;
  fights: FightRecord[];
  /** Item keys `kind:id`, once per offer (reward card or shop offer on entry). */
  offered: string[];
  /** Item keys taken from a reward or bought, in order. */
  picked: string[];
  /** Equipped tool ids at run end. */
  tools: string[];
  /** Credits on each map decision, indexed by nodes visited. */
  credits: number[];
}

/** The part of a record observed during the run. */
type Trail = Pick<RunRecord, 'fights' | 'offered' | 'picked' | 'credits'>;

export interface BatchSpec {
  runs: number;
  harnesses: readonly HarnessId[];
  bot: BotName;
  seedFrom: number;
}

const CLASS = { easy: 'normal', hard: 'normal', elite: 'elite', boss: 'boss' } as const;

function fightOf(state: RunState): FightRecord {
  const combat = state.combat;
  if (!combat) throw new Error('combatReview without a combat record');
  const node = state.map.nodes.find((n) => n.id === combat.nodeId);
  const pool = content.encounters.find((e) => e.id === node?.encounter)?.pool ?? 'easy';
  return {
    cls: CLASS[pool],
    ms: combat.outcome.endT,
    trustLost: Math.max(0, combat.input.agent.trust - state.agent.trust),
    compactions: state.stats.lastFight.compactions,
  };
}

const key = (item: { kind: string; id: string }): string => `${item.kind}:${item.id}`;

/** Records offers and picks on reward and shop decisions; shop offers count once per visit. */
function observeOffers(rec: Trail, state: RunState, action: Action, seen: Set<string>): void {
  const p = state.pending;
  if (p?.kind === 'reward') {
    rec.offered.push(...p.cards.map(key));
    if (action.t === 'pickReward')
      rec.picked.push(...p.cards.slice(action.ix, action.ix + 1).map(key));
  } else if (p?.kind === 'shop') {
    if (!seen.has(p.node)) rec.offered.push(...p.offers.map(key));
    seen.add(p.node);
    if (action.t === 'buy') rec.picked.push(...p.offers.slice(action.ix, action.ix + 1).map(key));
  }
}

/** Plays one run and records its fights, offers, picks and credits curve. */
export function recordRun(seed: string, harness: HarnessId, bot: Bot): RunRecord {
  const trail: Trail = { fights: [], offered: [], picked: [], credits: [] };
  const shops = new Set<string>();
  const observer: Bot = (state, legal) => {
    const action = bot(state, legal);
    if (state.mode === 'combatReview') trail.fights.push(fightOf(state));
    if (state.mode === 'map') trail.credits[state.map.visited.length] = state.agent.credits;
    observeOffers(trail, state, action, shops);
    return action;
  };
  const { state } = playRun({ seed, harness }, observer);
  const outcome = state.result?.outcome ?? 'none';
  return {
    ...{ seed, harness, prompt: state.setup.prompt ?? 'none', outcome, won: outcome === 'shipped' },
    ...{ phase: state.phase, boss: reachedBoss(state), tools: state.agent.tools.map((t) => t.id) },
    ...trail,
  };
}

/** Seeds `seedFrom .. seedFrom + runs - 1` for every harness, harness by harness. */
export function runBatch(spec: BatchSpec, onHarness?: (h: HarnessId, ms: number) => void) {
  const records: RunRecord[] = [];
  for (const harness of spec.harnesses) {
    const start = performance.now();
    for (let i = 0; i < spec.runs; i++) {
      records.push(recordRun(String(spec.seedFrom + i), harness, BOTS[spec.bot]));
    }
    onHarness?.(harness, performance.now() - start);
  }
  return records;
}
