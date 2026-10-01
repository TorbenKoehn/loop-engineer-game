// Fight end: tick step 8 and the timeout cap (docs/game/systems/combat.md "Tick order").
// Ties favour the player: enemies are checked before Trust.
import { OVERTIME_CAP_MS } from './deadline.ts';
import { emit, enemyRef, type Sim } from './state.ts';
import type { EndReason, Outcome } from './types.ts';

export interface End {
  readonly outcome: Outcome;
  readonly reason: EndReason;
}

export const WIN: End = { outcome: 'win', reason: 'resolved' };
const LOSS_TRUST: End = { outcome: 'loss', reason: 'trust' };
const TIMEOUT: End = { outcome: 'loss', reason: 'timeout' };

/** Resolves enemies at Severity <= 0, front to back. On-death traits and spawns: E007. */
export function resolveDead(sim: Sim): void {
  for (const enemy of sim.enemies) {
    if (enemy.sev <= 0)
      emit(sim, { kind: 'resolved', src: enemyRef(enemy), d: { by: enemy.killedBy } });
  }
  sim.enemies = sim.enemies.filter((e) => e.sev > 0);
}

/** Step 8: win if no enemy is left, else loss at Trust <= 0, else timeout at the hard cap. */
export function checkEnd(sim: Sim): End | undefined {
  resolveDead(sim);
  if (sim.enemies.length === 0) return WIN;
  if (sim.agent.trust <= 0) return LOSS_TRUST;
  return sim.t >= sim.deadlineMs + OVERTIME_CAP_MS ? TIMEOUT : undefined;
}
