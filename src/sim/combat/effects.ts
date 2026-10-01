// Tool effects on activation: dmg on the selected targets, guard and heal on the agent.
// All three go through the damage formula (docs/game/systems/combat.md "Damage formula").
import type { Effect, Value } from '../../content/types/index.ts';
import type { Ref } from '../events.ts';
import { type Amount, computeAmount, dealDamage, type Mod } from './damage.ts';
import { addPrimes } from './order/primes.ts';
import { emit, type Sim, type ToolRt, toolRef, valueAt } from './state.ts';
import { type Activation, applyStatusEffect, isStatusEffect } from './status/status-effects.ts';
import { hpOf, isAgent, maxHpOf, selectTargets, setHp, type Unit, unitRef } from './targeting.ts';

const NO_MODS: readonly Mod[] = [];

/** `mods` (primes now; item mods T033, zone T025) apply to every amount of this activation. */
export function applyEffects(sim: Sim, tool: ToolRt, mods: readonly Mod[] = NO_MODS): void {
  const act: Activation = { tool, picks: new Map(), mods };
  for (const effect of tool.def.effects) applyEffect(sim, act, effect);
}

// Other kinds belong to their owners: context (E003).
function applyEffect(sim: Sim, act: Activation, effect: Effect): void {
  const { tool } = act;
  const src = toolRef(tool);
  if (effect.do === 'dmg') hit(sim, act, effect);
  else if (effect.do === 'guard') gainGuard(sim, src, sim.agent, amountOf(act, effect.v));
  else if (effect.do === 'heal') heal(sim, src, sim.agent, amountOf(act, effect.v));
  else if (isStatusEffect(effect)) applyStatusEffect(sim, act, effect);
  else if (effect.do === 'prime') {
    const spec = { filter: effect.filter, pct: valueAt(effect.pct, tool.version) };
    addPrimes(sim, src, tool.def.id, { ...spec, count: effect.count ?? 1 });
  }
}

function hit(sim: Sim, act: Activation, effect: Extract<Effect, { do: 'dmg' }>): void {
  const { tool } = act;
  for (const unit of selectTargets(sim, effect.target ?? tool.def.target)) {
    const dealt = dealDamage(sim, toolRef(tool), unit, amountOf(act, effect.v));
    if (!isAgent(unit)) tool.dealt += dealt;
  }
}

const amountOf = (act: Activation, v: Value): Amount =>
  computeAmount(valueAt(v, act.tool.version), act.mods);

/** Adds Guardrails, capped at max Trust or max Severity; emits `guard` with the gain. */
export function gainGuard(sim: Sim, src: Ref, unit: Unit, a: Amount): number {
  const gain = Math.min(a.amount, maxHpOf(unit) - unit.guard);
  unit.guard += gain;
  emit(sim, { kind: 'guard', src, dst: unitRef(unit), v: gain, d: { total: unit.guard } });
  return gain;
}

/** Restores Trust or Severity up to its max; emits `heal` with the gain. */
export function heal(sim: Sim, src: Ref, unit: Unit, a: Amount): number {
  const gain = Math.min(a.amount, maxHpOf(unit) - hpOf(unit));
  setHp(unit, hpOf(unit) + gain);
  emit(sim, { kind: 'heal', src, dst: unitRef(unit), v: gain, d: { total: hpOf(unit) } });
  return gain;
}
