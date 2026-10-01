// Boss stage switch on armor breaks (docs/game/content/phase-1-implement.md "Boss: Legacy
// Monolith"): at its next intent the boss enters the stage whose layer range holds its armor
// layers left, starting that stage's cycle from the top.
import { type EnemyRt, emit, enemyRef, type Sim, stageAt } from '../combat/state.ts';

/** Runs after the boss advanced its intent; emits `trait` (v: layers left, what: stage id). */
export function switchStage(sim: Sim, enemy: EnemyRt): void {
  const ix = stageAt(enemy.def, enemy.armor.layers);
  const stage = enemy.def.stages?.[ix];
  if (!stage || ix === enemy.stage) return;
  enemy.stage = ix;
  enemy.intentIx = enemy.def.opening?.length ?? 0; // the cycle index resets
  const d = { trait: 'stage', what: stage.id };
  emit(sim, { kind: 'trait', src: enemyRef(enemy), v: enemy.armor.layers, d });
}
