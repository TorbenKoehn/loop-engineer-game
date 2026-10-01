// Auto-compaction on overflow (docs/game/systems/context.md "Auto-compaction (Overflow)").
// Planned compaction and the policy: T029.
import { mulDiv } from '../../int.ts';
import { emit, type Sim, toolRef } from '../state.ts';
import { applyStatus, clearStatus } from '../status/statuses.ts';
import { updateZone } from './zone.ts';

export const COMPACT_RESET_PCT = 10;
export const AUTO_COMPACT_STUN_MS = 2000;

/**
 * The overflow check after an addition to F: F >= W compacts first, then the zone is
 * recomputed once (one zoneChanged from the zone before). Returns whether it compacted.
 */
export function checkOverflow(sim: Sim): boolean {
  const { ctx } = sim.agent;
  const overflow = ctx.S + ctx.N >= ctx.W;
  if (overflow) autoCompact(sim);
  updateZone(sim);
  return overflow;
}

/** N = 0, S = min(B + 10% of W, W - 1), Stun the agent, lose the latest positive temporary buff. */
function autoCompact(sim: Sim): void {
  const { agent } = sim;
  const { ctx } = agent;
  const lost = latestBuff(sim);
  ctx.N = 0;
  ctx.S = Math.min(ctx.B + mulDiv(ctx.W, COMPACT_RESET_PCT, 100), ctx.W - 1);
  const d = { kind: 'auto' as const, S: ctx.S, ...(lost && { lostBuff: lost.name }) };
  emit(sim, { kind: 'compaction', src: 'ctx', v: AUTO_COMPACT_STUN_MS, d });
  applyStatus(sim, 'ctx', agent, { status: 'stun', ms: AUTO_COMPACT_STUN_MS });
  lost?.drop();
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
