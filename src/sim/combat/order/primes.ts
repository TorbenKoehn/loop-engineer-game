// One-shot primes (docs/game/systems/statuses.md "Primed"): `prime(filter, pct)` adds +pct% to
// the next activation of a matching tool; all primes on a tool add up and are consumed together.
import type { Filter, ToolDef } from '../../../content/types/index.ts';
import type { Ref } from '../../events.ts';
import { ceilDiv } from '../../int.ts';
import type { Mod } from '../damage.ts';
import { emit, PROGRESS_PER_MS, type Sim, TICK_MS, type ToolRt, toolRef } from '../state.ts';
import { toolRate } from '../status/charge.ts';

export interface PrimeSpec {
  readonly filter: Filter;
  readonly pct: number;
  /** Number of tools primed, one prime each. */
  readonly count: number;
}

/** Tool fields of a filter must all match; `family` is about enemies and never excludes a tool. */
export function matchesTool(def: ToolDef, f: Filter): boolean {
  return (
    (f.tag === undefined || def.tags.includes(f.tag)) &&
    (f.tool === undefined || def.id === f.tool) &&
    (f.maxWeight === undefined || def.weight <= f.maxWeight) &&
    (f.maxCooldownMs === undefined || def.cooldownMs <= f.maxCooldownMs)
  );
}

const FILTER_KEYS = ['tag', 'tool', 'maxWeight', 'maxCooldownMs', 'family'] as const;

/** The filter as logged in `prime` events, e.g. `tag:Edit`; `any` when empty. */
export function filterKey(f: Filter): string {
  const parts = FILTER_KEYS.filter((k) => f[k] !== undefined).map((k) => `${k}:${f[k]}`);
  return parts.length > 0 ? parts.join(',') : 'any';
}

/** Ticks until the tool fires at its current rate; a halted tool never does. */
function ticksToFire(sim: Sim, tool: ToolRt): number {
  const rate = toolRate(sim.agent, tool);
  if (rate === 0) return Number.MAX_SAFE_INTEGER;
  const left = tool.def.cooldownMs * PROGRESS_PER_MS - tool.progress;
  return left <= 0 ? 0 : ceilDiv(left, TICK_MS * rate);
}

/**
 * Primes the `count` matching tools whose next activation comes first (ties: leftmost, as
 * tools fire left to right); emits `prime` per tool. `srcId` names the mod `prime:<srcId>`.
 */
export function addPrimes(sim: Sim, src: Ref, srcId: string, spec: PrimeSpec): void {
  const filter = filterKey(spec.filter);
  const next = sim.agent.tools
    .filter((tool) => matchesTool(tool.def, spec.filter))
    .map((tool) => ({ tool, ticks: ticksToFire(sim, tool) }))
    .sort((a, b) => a.ticks - b.ticks || a.tool.slot - b.tool.slot)
    .slice(0, spec.count);
  for (const { tool } of next) {
    tool.primes.push({ src, id: `prime:${srcId}`, pct: spec.pct, filter, seq: sim.seq });
    emit(sim, { kind: 'prime', src, dst: toolRef(tool), v: spec.pct, d: { filter } });
  }
}

/** Takes every prime off the tool for this activation; emits `primeUsed` each, returns the mods. */
export function consumePrimes(sim: Sim, tool: ToolRt): Mod[] {
  const used = tool.primes;
  tool.primes = [];
  for (const p of used) {
    const d = { filter: p.filter };
    emit(sim, { kind: 'primeUsed', src: p.src, dst: toolRef(tool), v: p.pct, d });
  }
  return used.map((p) => ({ id: p.id, pct: p.pct }));
}
