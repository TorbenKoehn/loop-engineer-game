// Tick step 6: enemies act front to back, then advance to their next intent and reset progress.
import { emit, enemyRef, PROGRESS_PER_MS, type Sim } from '../state.ts';
import { advanceIntent, announceIntent, currentIntent } from './cycle.ts';
import { CONTEXT, type ContextHooks, runVerb } from './verbs.ts';

export function enemiesAct(sim: Sim, ctx: ContextHooks = CONTEXT): void {
  // A snapshot of the line: spawned enemies enter it but do not act in this step.
  for (const enemy of [...sim.enemies]) {
    const intent = currentIntent(enemy);
    if (!intent || enemy.sev <= 0 || enemy.progress < intent.windupMs * PROGRESS_PER_MS) continue;
    const verbs = intent.verbs.map((v) => v.verb);
    const d = { intent: intent.id, verbs };
    emit(sim, { kind: 'enemyActed', src: enemyRef(enemy), dst: 'a', d });
    for (const verb of intent.verbs) runVerb({ sim, enemy, intent: intent.id, ctx }, verb);
    enemy.progress = 0;
    advanceIntent(enemy);
    announceIntent(sim, enemy);
  }
}
