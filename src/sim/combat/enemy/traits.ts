// Enemy traits Split, Grow, Outage and Blocked (docs/game/systems/statuses.md "Enemy traits").
// Armor and the M2 traits join with their tasks.
import type { Trait } from '../../../content/types/index.ts';
import { mulDiv } from '../../int.ts';
import { hooks } from '../mods/custom.ts';
import {
  createEnemy,
  type EnemyRt,
  emit,
  enemyRef,
  type Sim,
  TICK_MS,
  type ToolRt,
  toolRef,
} from '../state.ts';
import { announceIntent } from './cycle.ts';
import { defOf, MAX_ENEMIES } from './spawn.ts';

type Kind = Trait['trait'];
type TraitOf<K extends Kind> = Extract<Trait, { trait: K }>;

export function traitOf<K extends Kind>(enemy: EnemyRt, kind: K): TraitOf<K> | undefined {
  return enemy.def.traits.find((t): t is TraitOf<K> => t.trait === kind);
}

/** Tick step 2. Grow: every `ms` in the fight, max and current Severity +sev, attack +dmg. */
export function tickTraits(sim: Sim): void {
  for (const enemy of sim.enemies) {
    const state = enemy.traitState;
    state.ms += TICK_MS;
    const grow = traitOf(enemy, 'grow');
    if (!grow || state.ms % grow.ms !== 0) continue;
    enemy.maxSev += grow.sev;
    enemy.sev += grow.sev;
    state.dmg += grow.dmg;
    const src = enemyRef(enemy);
    emit(sim, { kind: 'trait', src, v: grow.sev, d: { trait: 'grow', what: 'sev' } });
    emit(sim, { kind: 'trait', src, v: grow.dmg, d: { trait: 'grow', what: 'dmg' } });
  }
}

/** Where a resolved enemy stood in the new line and how many enemies live now. */
export interface Slot {
  readonly index: number;
  readonly alive: number;
}

/**
 * Split(n, pct) on resolve: `n` children at `pct`% of the parent's max Severity (floor),
 * inserted at its index. Children beyond the 5-enemy cap are dropped (logged).
 */
export function splitChildren(sim: Sim, parent: EnemyRt, at: Slot): EnemyRt[] {
  const split = traitOf(parent, 'split');
  if (!split) return [];
  const def = defOf(sim, split.child);
  const sev = mulDiv(parent.maxSev, split.pct, 100);
  const src = enemyRef(parent);
  const children: EnemyRt[] = [];
  for (let i = 0; i < split.n; i++) {
    if (at.alive + children.length >= MAX_ENEMIES) {
      emit(sim, { kind: 'spawn', src, v: 0, d: { def: def.id, index: -1, reason: 'split' } });
      continue;
    }
    const child = { ...createEnemy(def, sim.nextUid++, sim.phase), sev, maxSev: sev };
    const d = { def: def.id, index: at.index + children.length, reason: 'split' } as const;
    emit(sim, { kind: 'spawn', src, dst: enemyRef(child), v: sev, d });
    announceIntent(sim, child);
    children.push(child);
  }
  return children;
}

/**
 * Outage(tag): the first living enemy whose outage tag `tool` carries; its effects time out.
 * Cache's `web_ignores_outage` hook exempts Web tools.
 */
export function outageOf(sim: Sim, tool: ToolRt): EnemyRt | undefined {
  const { tags } = tool.def;
  if (tags.includes('Web') && hooks(sim, 'web_ignores_outage').length > 0) return undefined;
  return sim.enemies.find((e) => {
    const outage = traitOf(e, 'outage');
    return e.sev > 0 && outage !== undefined && tags.includes(outage.tag);
  });
}

/** Logs a timed-out activation: `trait` from the outage enemy to the tool. */
export function timedOut(sim: Sim, by: EnemyRt, tool: ToolRt): void {
  const d = { trait: 'outage', what: 'timedOut' };
  emit(sim, { kind: 'trait', src: enemyRef(by), dst: toolRef(tool), v: 0, d });
}

/** Blocked: takes 0 damage while any non-Blocked enemy is alive (Deadline bypasses this). */
export function isBlocked(sim: Sim, enemy: EnemyRt): boolean {
  if (!traitOf(enemy, 'blocked')) return false;
  return sim.enemies.some((e) => e.sev > 0 && !traitOf(e, 'blocked'));
}
