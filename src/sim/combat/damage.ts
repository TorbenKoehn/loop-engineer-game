// The one visible damage formula (docs/game/systems/combat.md "Damage formula") and how a hit
// lands: Guardrails absorb first, then Trust or Severity; overkill is discarded.
import type { Family } from '../../content/types/index.ts';
import type { Ref } from '../events.ts';
import { pct as scale } from '../int.ts';
import { zoneIx } from './context/ctx.ts';
import { isBlocked } from './enemy/traits.ts';
import { raise } from './rules/state.ts';
import { emit, type Sim } from './state.ts';
import { hpOf, isAgent, setHp, type Unit, unitRef } from './targeting.ts';

/** Floor of the summed percent mods. */
export const MIN_PCT = -90;

/** A named modifier; `id` goes into the why list, e.g. `skill:unix_philosophy`. */
export interface Mod {
  readonly id: string;
  readonly flat?: number;
  readonly pct?: number;
  /** Item damage mods: not on Guardrails or healing; `family` only against that family. */
  readonly dmgOnly?: boolean;
  readonly family?: Family;
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
  readonly bypass?: boolean; // Deadline damage: skips Guardrails and armor (E007).
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

/** Enemy damage checks (Elusive: E012): a Blocked enemy takes 0 unless the hit bypasses. */
const gate = (sim: Sim, unit: Unit, a: Amount): Amount =>
  !(a.bypass || isAgent(unit)) && isBlocked(sim, unit) ? { ...a, amount: 0 } : a;

/** Lands an amount on a unit and emits `damage`; returns the Trust or Severity lost. */
export function dealDamage(sim: Sim, src: Ref, unit: Unit, raw: Amount): number {
  const a = gate(sim, unit, raw);
  const guard = a.bypass ? 0 : Math.min(unit.guard, a.amount);
  const dealt = Math.min(hpOf(unit), a.amount - guard);
  unit.guard -= guard;
  setHp(unit, hpOf(unit) - dealt);
  if (isAgent(unit)) {
    unit.taken += dealt;
    // Rule triggers: an enemy hit before Guardrails; Trust after any hit that cost Trust.
    if (src.startsWith('e')) raise(sim.rules, { on: 'damaged', n: a.amount });
    if (dealt > 0) raise(sim.rules, { on: 'trustBelow', n: unit.trust });
  } else if (unit.sev === 0) unit.killedBy = src;
  // Armor and damage-taken mods arrive with E007. `zone`: the bar's zone index at the hit.
  const zone = zoneIx(sim.agent.ctx.zone);
  const d = { base: a.base, flat: a.flat, pct: a.pct, armor: 0, guard, sev: hpOf(unit), zone };
  emit(sim, { kind: 'damage', src, dst: unitRef(unit), v: dealt, d: { ...d, why: a.why } });
  return dealt;
}
