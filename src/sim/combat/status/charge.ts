// The charge-rate formula (docs/game/systems/combat.md "Charge rate") and tick step 3.
import type { Status } from '../../../content/types/index.ts';
import { clamp } from '../../int.ts';
import { type AgentRt, type EnemyRt, type Sim, TICK_MS, type ToolRt } from '../state.ts';
import { hasStatus } from './statuses.ts';

export const MIN_RATE = 10;
export const MAX_RATE = 400;
/** Enemies: the same formula with base 100. */
export const ENEMY_RATE = 100;

export type HasStatus = (status: Status) => boolean;

/** clamp(add, 10, 400), Haste x2, Slow /2 floor, Throttle or Stun 0. TODO(T025): Rot zone. */
export function chargeRate(add: number, has: HasStatus): number {
  if (has('throttle') || has('stun')) return 0;
  let rate = clamp(add, MIN_RATE, MAX_RATE);
  if (has('haste')) rate *= 2;
  if (has('slow')) rate = Math.floor(rate / 2);
  return rate;
}

/** A tool's own statuses plus a Stun on the agent, which stops all of its tools. */
export const toolRate = (agent: AgentRt, tool: ToolRt): number =>
  chargeRate(agent.speed, (s) => hasStatus(tool, s) || (s === 'stun' && hasStatus(agent, s)));

export const enemyRate = (enemy: EnemyRt): number =>
  chargeRate(ENEMY_RATE, (s) => hasStatus(enemy, s));

/** Tick step 3: every tool and enemy intent gains `50 × rate` progress; rate 0 keeps it. */
export function chargeAll(sim: Sim): void {
  for (const tool of sim.agent.tools) tool.progress += TICK_MS * toolRate(sim.agent, tool);
  for (const enemy of sim.enemies) enemy.progress += TICK_MS * enemyRate(enemy);
}
