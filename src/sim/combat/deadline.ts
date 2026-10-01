// Deadline overtime, tick step 7 (docs/game/systems/combat.md "Deadline and fight end").
import { computeAmount, dealDamage } from './damage.ts';
import { emit, type Sim } from './state.ts';
import { hpOf, type Unit } from './targeting.ts';

/** Hard cap after the Deadline: the fight is lost by timeout. */
export const OVERTIME_CAP_MS = 30_000;

/** `k` when `t` is the k-th full second after the Deadline, else 0. */
export function overtimeSecond(sim: Sim): number {
  const over = sim.t - sim.deadlineMs;
  return over > 0 && over % 1000 === 0 ? over / 1000 : 0;
}

/** Deals `k` to every living enemy, front to back, then to the agent; bypasses Guardrails. */
export function deadlineDamage(sim: Sim): void {
  const k = overtimeSecond(sim);
  if (k === 0) return;
  emit(sim, { kind: 'deadline', src: 'sys', v: k, d: {} });
  const units: Unit[] = [...sim.enemies, sim.agent];
  for (const unit of units) {
    if (hpOf(unit) > 0) dealDamage(sim, 'sys', unit, { ...computeAmount(k), bypass: true });
  }
}
