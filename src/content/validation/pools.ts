// Rule 4: every encounter has 1-5 enemies; every phase of the milestone has >= 5 easy,
// >= 5 hard, >= 2 elite (M1: 1) encounters and exactly 1 boss.
import type { Content } from '../index.ts';
import type { EncounterDef } from '../types/enemy.ts';
import type { Milestone } from '../types/items.ts';

export const MAX_ENEMIES = 5;

type Pool = EncounterDef['pool'];
type Phase = EncounterDef['phase'];

/** Phases played and minimum encounters per pool, per milestone (M1 is Phase 1 only). */
export const POOL_RULES: Readonly<
  Record<Milestone, { readonly phases: readonly Phase[]; readonly min: Record<Pool, number> }>
> = {
  1: { phases: [1], min: { easy: 5, hard: 5, elite: 1, boss: 1 } },
  2: { phases: [1, 2, 3], min: { easy: 5, hard: 5, elite: 2, boss: 1 } },
};

const err = (msg: string) => `[rule 4] ${msg}`;

function sizes(c: Content): string[] {
  return c.encounters.flatMap((e) =>
    e.enemies.length >= 1 && e.enemies.length <= MAX_ENEMIES
      ? []
      : [err(`encounter ${e.id}: ${e.enemies.length} enemies (1-${MAX_ENEMIES})`)],
  );
}

function pools(c: Content, milestone: Milestone): string[] {
  const { phases, min } = POOL_RULES[milestone];
  return phases.flatMap((phase) =>
    (Object.keys(min) as Pool[]).flatMap((pool) => {
      const n = c.encounters.filter((e) => e.phase === phase && e.pool === pool).length;
      const ok = pool === 'boss' ? n === min.boss : n >= min[pool];
      const want = pool === 'boss' ? `exactly ${min.boss}` : `>= ${min[pool]}`;
      return ok ? [] : [err(`phase ${phase} has ${n} ${pool} encounters, needs ${want}`)];
    }),
  );
}

export function checkPools(c: Content, milestone: Milestone): string[] {
  return [...sizes(c), ...pools(c, milestone)];
}
