// Encounter selection at map generation (docs/game/systems/run-map.md#encounter-selection).
import { content } from '../../content/index.ts';
import type { EncounterDef } from '../../content/types/enemy.ts';
import type { EncounterId } from '../../content/types/ids.ts';
import { fork, pick } from '../../sim/rng.ts';
import type { MapNode, RunState } from '../state.ts';
import { type Edges, parentsOf } from './graph.ts';

/** The tutorial fight on the single row-1 node. */
const TUTORIAL_ENCOUNTER: EncounterId = 'p1e1';
/** The first Task of a run draws from this many leading easy entries. */
const FIRST_TASK_CHOICES = 2;
/** Task rows up to this one use the easy pool, later rows the hard pool. */
const LAST_EASY_ROW = 3;

export interface EncounterContext {
  seed: string;
  phase: RunState['phase'];
  tutorial: boolean;
}

function poolOf(node: MapNode): EncounterDef['pool'] | null {
  if (node.type === 'release') return 'boss';
  if (node.type === 'criticalBug') return 'elite';
  if (node.type !== 'task') return null;
  return node.row <= LAST_EASY_ROW ? 'easy' : 'hard';
}

function eligible(ctx: EncounterContext, node: MapNode, pool: EncounterDef['pool']) {
  const ids = content.encounters
    .filter((e) => e.phase === ctx.phase && e.pool === pool)
    .map((e) => e.id);
  if (ctx.phase !== 1 || node.row !== 1) return ids;
  return ctx.tutorial ? [TUTORIAL_ENCOUNTER] : ids.slice(0, FIRST_TASK_CHOICES);
}

/** Uniform pick skipping encounters of any ancestor node; resets when none is left. */
function choose(ctx: EncounterContext, node: MapNode, before: readonly EncounterId[]) {
  const pool = poolOf(node);
  if (pool === null) return null;
  const ids = eligible(ctx, node, pool);
  const fresh = ids.filter((id) => !before.includes(id));
  return pick(fork(ctx.seed, `encounter/${node.id}`), fresh.length > 0 ? fresh : ids);
}

/** Sets `encounter` on every node in place; `nodes` are sorted by row. */
export function assignEncounters(ctx: EncounterContext, nodes: MapNode[], edges: Edges): void {
  // Encounters on each node and all of its ancestors ("already fought this phase").
  const seen: Record<string, EncounterId[]> = {};
  for (const node of nodes) {
    const before = [...new Set(parentsOf(edges, node.id).flatMap((p) => seen[p] ?? []))];
    node.encounter = choose(ctx, node, before);
    seen[node.id] = node.encounter === null ? before : [...before, node.encounter];
  }
}
