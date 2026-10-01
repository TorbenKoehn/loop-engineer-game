// Target selectors (docs/game/systems/combat.md "Targeting") and the unit view shared by
// damage, guard and heal: the agent's pool is Trust, an enemy's pool is Severity.
import type { TargetSel } from '../../content/types/index.ts';
import type { Ref } from '../events.ts';
import { type AgentRt, type EnemyRt, enemyRef, type Sim } from './state.ts';

export type Unit = AgentRt | EnemyRt;

export const isAgent = (unit: Unit): unit is AgentRt => 'trust' in unit;
export const unitRef = (unit: Unit): Ref => (isAgent(unit) ? 'a' : enemyRef(unit));
/** Trust or Severity; maxHpOf is the cap for heal and Guardrails. */
export const hpOf = (unit: Unit): number => (isAgent(unit) ? unit.trust : unit.sev);
export const maxHpOf = (unit: Unit): number => (isAgent(unit) ? unit.maxTrust : unit.maxSev);

export function setHp(unit: Unit, hp: number): void {
  if (isAgent(unit)) unit.trust = hp;
  else unit.sev = hp;
}

/** Units a selector hits, in hit order. Only living enemies are targets. Decoys: E012. */
export function selectTargets(sim: Sim, sel: TargetSel): Unit[] {
  if (sel === 'self') return [sim.agent];
  const alive = sim.enemies.filter((e) => e.sev > 0);
  if (sel === 'front') return alive.slice(0, 1);
  if (sel === 'back') return alive.slice(-1);
  if (sel === 'all') return alive;
  if (sel === 'lowest') return lowest(alive);
  return []; // rightTool and tools select own tools, never combat targets.
}

/** Lowest current Severity; ties: frontmost. */
function lowest(alive: readonly EnemyRt[]): EnemyRt[] {
  if (alive.length === 0) return [];
  return [alive.reduce((best, e) => (e.sev < best.sev ? e : best))];
}
