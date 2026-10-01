// Node type assignment: fixed rows, weighted rows and placement constraints
// (docs/game/systems/run-map.md#map-generation-seeded).
import { pick, type Rng, type Weighted, weighted } from '../../sim/rng.ts';
import type { MapNode, MapState, NodeType } from '../state.ts';
import { childrenOf, parentsOf } from './graph.ts';

type Rule = Weighted<NodeType> & { rows: readonly number[] };

/** Weights are tuning knobs; `rows` are the allowed weighted rows. */
const WEIGHTED: readonly Rule[] = [
  { value: 'task', weight: 50, rows: [2, 3, 5, 6] },
  { value: 'standup', weight: 22, rows: [2, 3, 5, 6] },
  { value: 'registry', weight: 12, rows: [2, 3, 5, 6] },
  { value: 'criticalBug', weight: 12, rows: [3, 5, 6] },
  { value: 'idleCycle', weight: 4, rows: [5] },
];
/** Row 8 is the boss. */
const FIXED: Record<number, NodeType> = { 1: 'task', 4: 'freeTier', 7: 'idleCycle', 8: 'release' };
/** No edge may join two nodes of the same one of these types. */
const SPACED: readonly NodeType[] = ['criticalBug', 'registry', 'idleCycle'];
/** Each run needs at least one of these on its allowed rows. */
const REQUIRED: readonly NodeType[] = ['registry', 'criticalBug'];
/** Types a missing required type may replace, in order of preference. */
const CONVERTIBLE: readonly NodeType[] = ['task', 'standup'];
const REROLLS = 20;
/** Rolls that also enforce the soft rule (siblings differ in type). */
const SOFT_ROLLS = 10;

type Graph = Pick<MapState, 'nodes' | 'edges'>;

function hasSameTypeEdge(g: Graph, node: MapNode, type: NodeType): boolean {
  if (!SPACED.includes(type)) return false;
  const ids = [...parentsOf(g.edges, node.id), ...childrenOf(g.edges, node.id)];
  return g.nodes.some((m) => ids.includes(m.id) && m.type === type);
}

/** Only siblings to the left are assigned yet (row order, then column order). */
function hasSameTypeSibling(g: Graph, node: MapNode, type: NodeType): boolean {
  const parents = parentsOf(g.edges, node.id);
  const ids = g.edges.filter(([from]) => parents.includes(from)).map(([, to]) => to);
  return g.nodes.some((m) => ids.includes(m.id) && m.col < node.col && m.type === type);
}

function rollType(rng: Rng, g: Graph, node: MapNode): NodeType {
  const options = WEIGHTED.filter((w) => w.rows.includes(node.row));
  for (let i = 0; i <= REROLLS; i++) {
    const type = weighted(rng, options);
    if (hasSameTypeEdge(g, node, type)) continue;
    if (i < SOFT_ROLLS && hasSameTypeSibling(g, node, type)) continue;
    return type;
  }
  return 'task';
}

/** Converts a random Task (else Standup) on an allowed row if `type` is missing there. */
function ensureType(rng: Rng, nodes: readonly MapNode[], type: NodeType): void {
  const rows = WEIGHTED.find((w) => w.value === type)?.rows ?? [];
  const onRows = nodes.filter((n) => rows.includes(n.row));
  if (onRows.some((n) => n.type === type)) return;
  const candidates = CONVERTIBLE.map((t) => onRows.filter((n) => n.type === t)).find(
    (c) => c.length > 0,
  );
  // No node of `type` exists yet, so the conversion cannot create a same-type edge.
  if (candidates) pick(rng, candidates).type = type;
}

/** Sets `type` on every node in place; `nodes` are sorted by row, then column. */
export function assignTypes(rng: Rng, g: Graph): void {
  for (const n of g.nodes) n.type = FIXED[n.row] ?? 'task';
  for (const n of g.nodes) {
    if (FIXED[n.row] === undefined) n.type = rollType(rng, g, n);
  }
  for (const type of REQUIRED) ensureType(rng, g.nodes, type);
}
