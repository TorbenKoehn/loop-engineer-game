// The one visible damage formula (docs/game/systems/combat.md "Damage formula") and how a hit
// lands: Guardrails absorb first, then Trust or Severity; overkill is discarded.
import type { Ref } from '../events.ts';
import { pct as scale } from '../int.ts';
import { emit, type Sim } from './state.ts';
import { hpOf, isAgent, setHp, type Unit, unitRef } from './targeting.ts';

/** Floor of the summed percent mods. */
export const MIN_PCT = -90;

/** A named modifier; `id` goes into the why list, e.g. `skill:unix_philosophy`. */
export interface Mod {
  readonly id: string;
  readonly flat?: number;
  readonly pct?: number;
}

/** Formula inputs and result, exactly as the tooltip shows them. */
export interface Amount {
  readonly base: number;
  readonly flat: number;
  /** Sum of % mods, floored at MIN_PCT. */
  readonly pct: number;
  readonly amount: number;
  /** Mod ids in application order: flat adds first, then % mods. */
  readonly why: readonly string[];
}

/** `max(1, floor(((base + flat) * (100 + pct) + 50) / 100))`; also for guard and heal. */
export function computeAmount(base: number, mods: readonly Mod[] = []): Amount {
  let flat = 0;
  let sum = 0;
  for (const mod of mods) {
    flat += mod.flat ?? 0;
    sum += mod.pct ?? 0;
  }
  const pct = Math.max(MIN_PCT, sum);
  const flatIds = mods.filter((m) => m.flat).map((m) => m.id);
  const pctIds = mods.filter((m) => m.pct && !m.flat).map((m) => m.id);
  const amount = Math.max(1, scale(base + flat, pct));
  return { base, flat, pct, amount, why: [...flatIds, ...pctIds] };
}

/** Lands an amount on a unit and emits `damage`; returns the Trust or Severity lost. */
export function dealDamage(sim: Sim, src: Ref, unit: Unit, a: Amount): number {
  const guard = Math.min(unit.guard, a.amount);
  const dealt = Math.min(hpOf(unit), a.amount - guard);
  unit.guard -= guard;
  setHp(unit, hpOf(unit) - dealt);
  if (isAgent(unit)) unit.taken += dealt;
  else if (unit.sev === 0) unit.killedBy = src;
  // TODO(T025): zone pct; armor and damage-taken mods arrive with E007.
  const d = { base: a.base, flat: a.flat, pct: a.pct, armor: 0, guard, sev: hpOf(unit), zone: 0 };
  emit(sim, { kind: 'damage', src, dst: unitRef(unit), v: dealt, d: { ...d, why: a.why } });
  return dealt;
}
