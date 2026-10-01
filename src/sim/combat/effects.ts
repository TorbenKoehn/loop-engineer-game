// Tool effects on activation: dmg on the selected targets, guard and heal on the agent.
// All three go through the damage formula (docs/game/systems/combat.md "Damage formula").
import type { Effect, Value } from '../../content/types/index.ts';
import type { Ref } from '../events.ts';
import { type Amount, computeAmount, dealDamage, type Mod } from './damage.ts';
import { emit, type Sim, type ToolRt, toolRef } from './state.ts';
import { hpOf, isAgent, maxHpOf, selectTargets, setHp, type Unit, unitRef } from './targeting.ts';
import type { Version } from './types.ts';

const VERSION_IX = { 1: 0, 2: 1, 3: 2 } as const;
/** Item mods (T033) and zone (T025) join here. */
const NO_MODS: readonly Mod[] = [];

export function valueAt(v: Value, version: Version): number {
  return typeof v === 'number' ? v : v[VERSION_IX[version]];
}

export function applyEffects(sim: Sim, tool: ToolRt): void {
  for (const effect of tool.def.effects) applyEffect(sim, tool, effect);
}

// Other kinds belong to their owners: status and charge (T020), prime (T022), context (E003).
function applyEffect(sim: Sim, tool: ToolRt, effect: Effect): void {
  const src = toolRef(tool);
  if (effect.do === 'dmg') {
    for (const unit of selectTargets(sim, effect.target ?? tool.def.target)) {
      const dealt = dealDamage(sim, src, unit, amountOf(tool, effect.v));
      if (!isAgent(unit)) tool.dealt += dealt;
    }
  } else if (effect.do === 'guard') gainGuard(sim, src, sim.agent, amountOf(tool, effect.v));
  else if (effect.do === 'heal') heal(sim, src, sim.agent, amountOf(tool, effect.v));
}

const amountOf = (tool: ToolRt, v: Value): Amount =>
  computeAmount(valueAt(v, tool.version), NO_MODS);

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
