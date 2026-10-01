// The spawn verb: its caps, insertion into the line and the 5-enemy cap
// (docs/game/systems/combat.md "Readability rules" 1). Spawns enter at the encounter phase.
import type { EnemyDef, Verb } from '../../../content/types/index.ts';
import { createEnemy, type EnemyRt, emit, enemyRef, type Sim } from '../state.ts';
import { announceIntent } from './cycle.ts';

export type SpawnVerb = Extract<Verb, { verb: 'spawn' }>;

/** At most this many living enemies; further spawns are dropped. */
export const MAX_ENEMIES = 5;

/** Spawn origin: the acting enemy and the intent that carries the verb. */
export interface Spawner {
  readonly enemy: EnemyRt;
  readonly intent: string;
}

/**
 * Inserts a new `v.enemy` at the front or (default) the back and emits `spawn`, or logs a
 * dropped spawn as `spawn` without dst, v 0 and index -1 when any cap blocks it.
 */
export function spawnEnemy(sim: Sim, from: Spawner, v: SpawnVerb): void {
  const def = defOf(sim, v.enemy);
  const src = enemyRef(from.enemy);
  const alive = sim.enemies.filter((e) => e.sev > 0);
  if (blocked(from, v, alive)) {
    const d = { def: def.id, index: -1, reason: 'intent' } as const;
    emit(sim, { kind: 'spawn', src, v: 0, d });
    return;
  }
  const enemy = createEnemy(def, sim.nextUid++, sim.phase);
  const front = v.at === 'front';
  if (front) sim.enemies.unshift(enemy);
  else sim.enemies.push(enemy);
  from.enemy.spawned[from.intent] = spawnCount(from) + 1;
  const d = { def: def.id, index: front ? 0 : alive.length, reason: 'intent' } as const;
  emit(sim, { kind: 'spawn', src, dst: enemyRef(enemy), v: enemy.sev, d });
  announceIntent(sim, enemy);
}

/** The encounter def `id` may enter the fight as (starting line or spawnDefs). */
export function defOf(sim: Sim, id: string): EnemyDef {
  const def = sim.defs.find((d) => d.id === id);
  if (!def) throw new Error(`spawn: enemy '${id}' is not in the encounter defs`);
  return def;
}

const spawnCount = (from: Spawner): number => from.enemy.spawned[from.intent] ?? 0;

/** Living copies >= max, spawns by this intent >= perFight, others >= maxOthers, line full. */
function blocked(from: Spawner, v: SpawnVerb, alive: readonly EnemyRt[]): boolean {
  const copies = alive.filter((e) => e.def.id === v.enemy).length;
  const others = alive.filter((e) => e !== from.enemy).length;
  if (copies >= v.max || alive.length >= MAX_ENEMIES) return true;
  if (v.perFight !== undefined && spawnCount(from) >= v.perFight) return true;
  return v.maxOthers !== undefined && others >= v.maxOthers;
}
