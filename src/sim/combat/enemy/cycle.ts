// Intent order: opening intents run once, then the cycle repeats. `intentIx` indexes the
// list opening ++ cycle (docs/game/systems/combat.md "Enemy intents and phase scaling").
import type { Intent } from '../../../content/types/index.ts';
import { type EnemyRt, emit, enemyRef, type Sim } from '../state.ts';

export function currentIntent(enemy: EnemyRt): Intent | undefined {
  const opening = enemy.def.opening ?? [];
  const ix = enemy.intentIx;
  return ix < opening.length ? opening[ix] : enemy.def.cycle[ix - opening.length];
}

/** Moves to the next intent; after the last cycle entry it wraps to the cycle start. */
export function advanceIntent(enemy: EnemyRt): void {
  const opening = enemy.def.opening?.length ?? 0;
  const next = enemy.intentIx + 1;
  enemy.intentIx = next < opening + enemy.def.cycle.length ? next : opening;
}

/** Emits `intentSet` (v: windupMs, ix: index in opening ++ cycle) for the current intent. */
export function announceIntent(sim: Sim, enemy: EnemyRt): void {
  const intent = currentIntent(enemy);
  if (!intent) return;
  const d = { intent: intent.id, ix: enemy.intentIx };
  emit(sim, { kind: 'intentSet', src: enemyRef(enemy), v: intent.windupMs, d });
}
