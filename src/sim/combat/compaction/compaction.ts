// Auto-compaction on overflow, planned compaction by policy and the `compact` effect
// (docs/game/systems/context.md "Auto-compaction (Overflow)", "Planned compaction (policy)").
import type { CombatEvent } from '../../events.ts';
import { mulDiv } from '../../int.ts';
import type { Ctx } from '../context/ctx.ts';
import { updateZone } from '../context/zone.ts';
import { raise } from '../rules/state.ts';
import { emit, type Sim, toolRef } from '../state.ts';
import { applyStatus, clearStatus } from '../status/statuses.ts';

export const COMPACT_RESET_PCT = 10;
export const AUTO_COMPACT_STUN_MS = 2000;
export const PLANNED_COMPACT_STUN_MS = 1000;
export const PLANNED_COMPACT_LOCKOUT_MS = 3000;

type CompactData = Extract<CombatEvent, { kind: 'compaction' }>['d'];

/** The compaction check after an addition, then the zone once. True if it auto-compacted. */
export function checkOverflow(sim: Sim, added = true): boolean {
  const overflow = compactIfDue(sim, added);
  updateZone(sim);
  return overflow;
}

/** F >= W auto-compacts, else an addition may compact planned. The caller updates the zone. */
export function compactIfDue(sim: Sim, added: boolean): boolean {
  const { ctx } = sim.agent;
  const overflow = ctx.S + ctx.N >= ctx.W;
  if (overflow) autoCompact(sim);
  else if (added && plannedDue(ctx, sim.t)) compact(sim, 'planned');
  return overflow;
}

/** B + 10% of W: S after a compaction, before the cap at W - 1. */
const resetBase = (ctx: Ctx): number => ctx.B + mulDiv(ctx.W, COMPACT_RESET_PCT, 100);

/** The policy would loop: the reset already reaches its threshold (UI warning). */
export function policyOff(ctx: Ctx): boolean {
  return ctx.policy > 0 && resetBase(ctx) * 100 >= ctx.W * ctx.policy;
}

/** F at or above the policy, the policy on, and 3000 ms since the last compaction. */
function plannedDue(ctx: Ctx, t: number): boolean {
  if (ctx.policy === 0 || policyOff(ctx)) return false;
  if ((ctx.S + ctx.N) * 100 < ctx.W * ctx.policy) return false;
  return ctx.lastCompactT === undefined || t - ctx.lastCompactT >= PLANNED_COMPACT_LOCKOUT_MS;
}

/** N = 0, S reset, t recorded for the lockout; logs it and Stuns the agent for `ms`. */
function reset(sim: Sim, d: Omit<CompactData, 'S'>, ms: number): void {
  const { agent } = sim;
  const { ctx } = agent;
  ctx.N = 0;
  ctx.S = Math.min(resetBase(ctx), ctx.W - 1);
  ctx.lastCompactT = sim.t;
  emit(sim, { kind: 'compaction', src: 'ctx', v: ms, d: { ...d, S: ctx.S } });
  applyStatus(sim, 'ctx', agent, { status: 'stun', ms });
}

/** Planned, or the `compact` effect (no policy, no lockout). The caller updates the zone. */
export function compact(sim: Sim, kind: 'planned' | 'tool'): void {
  reset(sim, { kind }, PLANNED_COMPACT_STUN_MS);
  raise(sim.rules, { on: 'compaction' });
}

/** Stun 2000 ms and lose the latest positive temporary buff. */
function autoCompact(sim: Sim): void {
  const lost = latestBuff(sim);
  reset(sim, { kind: 'auto', ...(lost && { lostBuff: lost.name }) }, AUTO_COMPACT_STUN_MS);
  lost?.drop();
  raise(sim.rules, { on: 'compaction' });
}

interface Buff {
  /** seq of the event that applied it. */
  readonly seq: number;
  /** `lostBuff`: `<tool ref>:haste` or `<tool ref>:<prime id>`, e.g. `t2:prime:read_file`. */
  readonly name: string;
  readonly drop: () => void;
}

/** Haste and positive primes on the agent's tools (agent-wide Haste sits on each tool). */
function latestBuff(sim: Sim): Buff | undefined {
  const buffs = sim.agent.tools.flatMap((tool): Buff[] => {
    const ref = toolRef(tool);
    const haste = tool.statuses.filter((s) => s.status === 'haste');
    const primes = tool.primes.filter((p) => p.pct > 0);
    return [
      ...haste.map((s) => ({
        seq: s.seq,
        name: `${ref}:haste`,
        drop: () => clearStatus(sim, 'ctx', tool, 'haste'),
      })),
      ...primes.map((p) => ({
        seq: p.seq,
        name: `${ref}:${p.id}`,
        drop: () => {
          tool.primes = tool.primes.filter((q) => q !== p);
        },
      })),
    ];
  });
  return buffs.reduce<Buff | undefined>((a, b) => (a && a.seq > b.seq ? a : b), undefined);
}
