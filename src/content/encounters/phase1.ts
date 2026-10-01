// Phase-1 encounter pools (docs/game/content/phase-1-implement.md "Encounter pools"),
// enemies front to back, Deadlines from docs/game/systems/combat.md. p1x2 joins with M2.
import { defineEncounter } from '../dsl/define.ts';
import type { DefinedEnemyId } from '../enemies/index.ts';
import type { EncounterDef } from '../types/enemy.ts';

type Pool = EncounterDef['pool'];

const DEADLINE_MS: Readonly<Record<Pool, number>> = {
  easy: 45000,
  hard: 45000,
  elite: 50000,
  boss: 75000,
};

const encounter = <const Id extends string>(
  id: Id,
  pool: Pool,
  enemies: readonly DefinedEnemyId[],
) => defineEncounter({ id, phase: 1, pool, enemies, deadlineMs: DEADLINE_MS[pool] });

export const phase1Encounters = [
  encounter('p1e1', 'easy', ['typo', 'typo', 'typo']),
  encounter('p1e2', 'easy', ['typo', 'context_drift']),
  encounter('p1e3', 'easy', ['typo', 'rate_limit']),
  encounter('p1e4', 'easy', ['typo', 'typo', 'scope_creep']),
  encounter('p1e5', 'easy', ['typo', 'unreachable_service']),
  encounter('p1h1', 'hard', ['context_drift', 'dependency_hell']),
  encounter('p1h2', 'hard', ['scope_creep', 'rate_limit']),
  encounter('p1h3', 'hard', ['typo', 'context_drift', 'unreachable_service']),
  encounter('p1h4', 'hard', ['rate_limit', 'dependency_hell']),
  encounter('p1h5', 'hard', ['typo', 'scope_creep', 'context_drift']),
  encounter('p1x1', 'elite', [
    'install_dependency',
    'update_toolchain',
    'fix_unrelated_bug',
    'yak_shave',
  ]),
  encounter('p1b', 'boss', ['legacy_monolith']),
] as const;

/** Literal union of every phase-1 encounter id. */
export type Phase1EncounterId = (typeof phase1Encounters)[number]['id'];
