// Fight end: tick step 8 and the timeout cap (docs/game/systems/combat.md "Tick order").
// Ties favour the player: enemies are checked before Trust.

import { type EnemyRt, emit, enemyRef, type Sim } from '../state.ts';
import { splitChildren } from '../traits/traits.ts';
import type { EndReason, Outcome } from '../types.ts';
import { OVERTIME_CAP_MS } from './deadline.ts';

export interface End {
  readonly outcome: Outcome;
  readonly reason: EndReason;
}

export const WIN: End = { outcome: 'win', reason: 'resolved' };
const LOSS_TRUST: End = { outcome: 'loss', reason: 'trust' };
const TIMEOUT: End = { outcome: 'loss', reason: 'timeout' };

/** Resolves enemies at Severity <= 0, front to back; Split children take the dead one's index. */
export function resolveDead(sim: Sim): void {
  let alive = sim.enemies.filter((e) => e.sev > 0).length;
  const line: EnemyRt[] = [];
  for (const enemy of sim.enemies) {
    if (enemy.sev > 0) {
      line.push(enemy);
      continue;
    }
    emit(sim, { kind: 'resolved', src: enemyRef(enemy), d: { by: enemy.killedBy } });
    const children = splitChildren(sim, enemy, { index: line.length, alive });
    alive += children.length;
    line.push(...children);
  }
  sim.enemies = line;
}

/** Step 8: win if no enemy is left, else loss at Trust <= 0, else timeout at the hard cap. */
export function checkEnd(sim: Sim): End | undefined {
  resolveDead(sim);
  if (sim.enemies.length === 0) return WIN;
  if (sim.agent.trust <= 0) return LOSS_TRUST;
  return sim.t >= sim.deadlineMs + OVERTIME_CAP_MS ? TIMEOUT : undefined;
}
