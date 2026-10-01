// Run end and run stats. Stats come from each fight's event log, no extra sim tracking
// (docs/game/ux/onboarding.md#why-did-i-lose-run-end-summary, run-state.md#modes).
import type { CombatEvent, Ref } from '../sim/events.ts';
import type { FightStats, RunResult, RunState, RunStats } from './state.ts';

/** Source name of the Deadline's overtime damage (src `sys`). */
export const DEADLINE = 'deadline';
/** Event zone indexes: cold, focused, rot, overflow. */
const ZONE_COUNT = 4;

export const emptyStats = (): RunStats => ({
  nodesVisited: 0,
  taskPicksNoRare: 0,
  nodesCleared: 0,
  cause: null,
  damageBySource: {},
  compactions: 0,
  lastFight: { zoneMs: Array<number>(ZONE_COUNT).fill(0), compactions: 0 },
});

/** One fight folded from its log; `units` maps enemy refs to their def ids. */
interface Fold extends FightStats {
  units: Record<string, string>;
  damage: Record<string, number>;
  cause: string | null;
  zone: number;
  since: number;
}

const sourceOf = (f: Fold, src: Ref | undefined): string =>
  src === 'sys' ? DEADLINE : (f.units[src ?? ''] ?? String(src));

/** Closes the open zone interval at `t`. */
function enterZone(f: Fold, t: number, zone: number): void {
  f.zoneMs[f.zone] = (f.zoneMs[f.zone] ?? 0) + t - f.since;
  f.zone = zone;
  f.since = t;
}

function hit(f: Fold, e: Extract<CombatEvent, { kind: 'damage' }>): void {
  if (e.dst !== 'a' || !e.v) return;
  const src = sourceOf(f, e.src);
  f.cause = src;
  f.damage[src] = (f.damage[src] ?? 0) + e.v;
}

function step(f: Fold, e: CombatEvent): void {
  if (e.kind === 'fightStart') f.zone = e.d.zone;
  else if (e.kind === 'spawn' && e.dst) f.units[e.dst] = e.d.def;
  else if (e.kind === 'damage') hit(f, e);
  else if (e.kind === 'zoneChanged') enterZone(f, e.t, e.d.to);
  else if (e.kind === 'compaction') f.compactions++;
  else if (e.kind === 'fightEnd') enterZone(f, e.t, f.zone);
}

/** Damage the agent took by source, the source of its last hit, ms per zone, compactions. */
export function fightStats(events: readonly CombatEvent[]) {
  const f: Fold = {
    ...emptyStats().lastFight,
    units: {},
    damage: {},
    cause: null,
    zone: 0,
    since: 0,
  };
  for (const e of events) step(f, e);
  const { zoneMs, compactions, damage, cause } = f;
  return { lastFight: { zoneMs, compactions }, damage, cause };
}

/** `stats` after a fight with `events`; a win clears the node. */
export function addFight(stats: RunStats, events: readonly CombatEvent[], won: boolean): RunStats {
  const { lastFight, damage, cause } = fightStats(events);
  const damageBySource = { ...stats.damageBySource };
  for (const [src, v] of Object.entries(damage)) {
    damageBySource[src] = (damageBySource[src] ?? 0) + v;
  }
  return {
    ...stats,
    nodesCleared: stats.nodesCleared + (won ? 1 : 0),
    cause: cause ?? stats.cause,
    damageBySource,
    compactions: stats.compactions + lastFight.compactions,
    lastFight,
  };
}

/** Ends the run: no pending choice; the lesson offer (T049) skips abandoned runs. */
export const endRun = (state: RunState, outcome: RunResult['outcome']): RunState => ({
  ...state,
  mode: 'runEnd',
  pending: null,
  result: { outcome, td: 0 },
});
