// Timed statuses Haste, Slow, Throttle, Stun: stacking, caps, duration mods and timers
// (docs/game/systems/statuses.md "The six statuses"). Guardrails live on the unit's `guard`.
import type { Status } from '../../../content/types/index.ts';
import type { Ref } from '../../events.ts';
import { mulDiv } from '../../int.ts';
import { activeSum } from '../mods/mods.ts';
import {
  type AgentRt,
  type EnemyRt,
  emit,
  enemyRef,
  type Sim,
  TICK_MS,
  type ToolRt,
  toolRef,
} from '../state.ts';

/** Anything that carries timed statuses. */
export type Holder = AgentRt | ToolRt | EnemyRt;

/** Duration caps in ms. */
export const STATUS_CAP_MS: Readonly<Record<Status, number>> = {
  haste: 10_000,
  slow: 10_000,
  throttle: 10_000,
  stun: 5000,
};
/** Shortest duration after a duration modifier. */
export const MIN_STATUS_MS = 50;

export interface StatusApp {
  readonly status: Status;
  readonly ms: number;
  /** Extra duration cut in percent, on top of the item mods (durationCut). */
  readonly mod?: number;
}

const isTool = (h: Holder): h is ToolRt => 'slot' in h;
const isAgentHolder = (h: Holder): h is AgentRt => 'trust' in h;

export function holderRef(h: Holder): Ref {
  if (isTool(h)) return toolRef(h);
  return isAgentHolder(h) ? 'a' : enemyRef(h);
}

export const hasStatus = (h: Holder, status: Status): boolean =>
  h.statuses.some((s) => s.status === status);

/** `d' = floor(d × (100 − mod) / 100)`, min 50 ms. */
export const modDuration = (ms: number, mod = 0): number =>
  Math.max(MIN_STATUS_MS, mulDiv(ms, 100 - mod, 100));

/** throttleDurPct cuts Throttle and Slow on tools, stunDurPct Stun on the agent (v -50: 50). */
function durationCut(sim: Sim, h: Holder, status: Status): number {
  if (isTool(h) && (status === 'throttle' || status === 'slow')) {
    return -activeSum(sim, 'throttleDurPct', h);
  }
  return isAgentHolder(h) && status === 'stun' ? -activeSum(sim, 'stunDurPct') : 0;
}

/**
 * Applies a status and emits `statusOn` (v: applied ms, remaining after stacking).
 * Haste and Slow add up; Throttle and Stun keep the longer remaining; both capped.
 * Haste, Slow and Throttle on the agent go to every tool individually.
 */
export function applyStatus(sim: Sim, src: Ref, h: Holder, app: StatusApp): void {
  if (isAgentHolder(h) && app.status !== 'stun') {
    for (const tool of h.tools) applyStatus(sim, src, tool, app);
    return;
  }
  const ms = modDuration(app.ms, (app.mod ?? 0) + durationCut(sim, h, app.status));
  const cap = STATUS_CAP_MS[app.status];
  const adds = app.status === 'haste' || app.status === 'slow';
  let entry = h.statuses.find((s) => s.status === app.status);
  if (!entry) {
    entry = { status: app.status, remaining: 0, seq: sim.seq };
    h.statuses.push(entry);
  }
  entry.remaining = Math.min(cap, adds ? entry.remaining + ms : Math.max(entry.remaining, ms));
  entry.seq = sim.seq; // the statusOn below
  const d = { status: app.status, remaining: entry.remaining };
  emit(sim, { kind: 'statusOn', src, dst: holderRef(h), v: ms, d });
}

/** Removes a status early; emits `statusOff` with the ms cut short as v. */
export function clearStatus(sim: Sim, src: Ref, h: Holder, status: Status): void {
  const entry = h.statuses.find((s) => s.status === status);
  if (!entry) return;
  h.statuses = h.statuses.filter((s) => s !== entry);
  const d = { status, remaining: 0 };
  emit(sim, { kind: 'statusOff', src, dst: holderRef(h), v: entry.remaining, d });
}

/** Tick step 1: every timer loses 50 ms; those at <= 0 expire (agent, tools, enemies). */
export function tickStatuses(sim: Sim): void {
  const holders: Holder[] = [sim.agent, ...sim.agent.tools, ...sim.enemies];
  for (const h of holders) {
    if (h.statuses.length === 0) continue;
    for (const s of h.statuses) s.remaining -= TICK_MS;
    for (const s of h.statuses.filter((e) => e.remaining <= 0)) {
      const d = { status: s.status, remaining: 0 };
      emit(sim, { kind: 'statusOff', src: 'sys', dst: holderRef(h), v: 0, d });
    }
    h.statuses = h.statuses.filter((s) => s.remaining > 0);
  }
}
