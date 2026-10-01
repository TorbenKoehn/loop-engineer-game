// Tool effects on activation: dmg on the selected targets, guard and heal on the agent.
// All three go through the damage formula (docs/game/systems/combat.md "Damage formula").
import type { Effect, Value } from '../../content/types/index.ts';
import type { Ref } from '../events.ts';
import { compact } from './compaction/compaction.ts';
import { removeTokens } from './context/tokens.ts';
import { type Amount, computeAmount, dealDamage, type Mod } from './damage.ts';
import { addPrimes } from './order/primes.ts';
import { raise } from './rules/state.ts';
import { emit, type Sim, type ToolRt, toolRef, valueAt } from './state.ts';
import {
  type Activation,
  applyStatusEffect,
  isStatusEffect,
  versionOf,
} from './status/status-effects.ts';
import { hpOf, isAgent, maxHpOf, selectTargets, setHp, type Unit, unitRef } from './targeting.ts';

const NO_MODS: readonly Mod[] = [];

/** `mods` (zone, item damage mods, primes) apply to the amounts of this activation. */
export function applyEffects(sim: Sim, tool: ToolRt, mods: readonly Mod[] = NO_MODS): void {
  const act: Activation = { src: toolRef(tool), id: tool.def.id, tool, picks: new Map(), mods };
  for (const effect of tool.def.effects) applyEffect(sim, act, effect);
}

/** One effect of a tool or an item rule. summon, mod, custom: E013, T033, T037. */
export function applyEffect(sim: Sim, act: Activation, effect: Effect): void {
  const { src } = act;
  const version = versionOf(act);
  if (effect.do === 'dmg') hit(sim, act, effect);
  else if (effect.do === 'removeCtx') removeTokens(sim, src, valueAt(effect.v, version));
  else if (effect.do === 'compact') compact(sim, 'tool');
  else if (effect.do === 'guard') gainGuard(sim, src, sim.agent, amountOf(act, effect.v));
  else if (effect.do === 'heal') heal(sim, src, sim.agent, amountOf(act, effect.v));
  else if (isStatusEffect(effect)) applyStatusEffect(sim, act, effect);
  else if (effect.do === 'prime') {
    const spec = { filter: effect.filter, pct: valueAt(effect.pct, version) };
    addPrimes(sim, src, act.id, { ...spec, count: effect.count ?? 1 });
  }
}

function hit(sim: Sim, act: Activation, effect: Extract<Effect, { do: 'dmg' }>): void {
  const { tool } = act;
  for (const unit of selectTargets(sim, effect.target ?? tool?.def.target ?? 'front')) {
    const family = isAgent(unit) ? undefined : unit.def.family;
    const mods = act.mods.filter((m) => !m.family || m.family === family);
    const dealt = dealDamage(sim, act.src, unit, computeAmount(base(act, effect.v), mods));
    if (tool && !isAgent(unit)) tool.dealt += dealt;
  }
}

const base = (act: Activation, v: Value): number => valueAt(v, versionOf(act));

/** Guardrails and healing: zone and primes, no item damage mods. */
const amountOf = (act: Activation, v: Value): Amount =>
  computeAmount(
    base(act, v),
    act.mods.filter((m) => !m.dmgOnly),
  );

/** Adds Guardrails, capped at max Trust or max Severity; emits `guard` with the gain. */
export function gainGuard(sim: Sim, src: Ref, unit: Unit, a: Amount): number {
  const gain = Math.min(a.amount, maxHpOf(unit) - unit.guard);
  unit.guard += gain;
  emit(sim, { kind: 'guard', src, dst: unitRef(unit), v: gain, d: { total: unit.guard } });
  if (isAgent(unit) && gain > 0) {
    const tool = unit.tools.find((t) => toolRef(t) === src);
    raise(sim.rules, { on: 'guardGained', fromTool: !!tool, slot: tool?.slot });
  }
  return gain;
}

/** Restores Trust or Severity up to its max; emits `heal` with the gain. */
export function heal(sim: Sim, src: Ref, unit: Unit, a: Amount): number {
  const gain = Math.min(a.amount, maxHpOf(unit) - hpOf(unit));
  setHp(unit, hpOf(unit) + gain);
  emit(sim, { kind: 'heal', src, dst: unitRef(unit), v: gain, d: { total: hpOf(unit) } });
  return gain;
}
