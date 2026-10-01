// Tick step 6: enemies act front to back, then advance to the next intent of their cycle.
import { damageData } from './fire.ts';
import { type EnemyRt, emit, enemyRef, PROGRESS_PER_MS, type Sim } from './state.ts';

/** Emits `intentSet` for the enemy's current intent. */
export function announceIntent(sim: Sim, enemy: EnemyRt): void {
  const intent = enemy.def.cycle[enemy.intentIx];
  if (!intent) return;
  const d = { intent: intent.id, ix: enemy.intentIx };
  emit(sim, { kind: 'intentSet', src: enemyRef(enemy), v: intent.windupMs, d });
}

// TODO(T021): opening intents, every action verb and phase scaling; the skeleton handles hit.
export function enemiesAct(sim: Sim): void {
  for (const enemy of sim.enemies) {
    const intent = enemy.def.cycle[enemy.intentIx];
    if (!intent || enemy.sev <= 0 || enemy.progress < intent.windupMs * PROGRESS_PER_MS) continue;
    const verbs = intent.verbs.map((v) => v.verb);
    emit(sim, {
      kind: 'enemyActed',
      src: enemyRef(enemy),
      dst: 'a',
      d: { intent: intent.id, verbs },
    });
    for (const verb of intent.verbs) if (verb.verb === 'hit') hitAgent(sim, enemy, verb.n);
    enemy.progress = 0;
    enemy.intentIx = (enemy.intentIx + 1) % enemy.def.cycle.length;
    announceIntent(sim, enemy);
  }
}

function hitAgent(sim: Sim, enemy: EnemyRt, base: number): void {
  const { agent } = sim;
  const dealt = Math.min(base, agent.trust);
  agent.trust -= dealt;
  agent.taken += dealt;
  const d = damageData(base, agent.trust);
  emit(sim, { kind: 'damage', src: enemyRef(enemy), dst: 'a', v: dealt, d });
}
