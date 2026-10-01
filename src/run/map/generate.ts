// Seeded phase map: paths, node types, encounters (docs/game/systems/run-map.md).
// Node ids follow docs/architecture/run-state.md#rng-fork-paths.
import { fork } from '../../sim/rng.ts';
import type { MapNode, MapState, NodeId, RunState } from '../state.ts';
import { assignEncounters } from './encounters.ts';
import type { Edges } from './graph.ts';
import { assignTypes } from './node-types.ts';
import { drawPaths, ROWS } from './paths.ts';

type Phase = RunState['phase'];

const BOSS_COL = 2;

const nodeId = (phase: Phase, row: number, col: number): NodeId => `p${phase}-r${row}-c${col}`;

/** Every cell a path touches, sorted by row, then column; then the boss. */
function buildNodes(phase: Phase, paths: readonly number[][]): MapNode[] {
  const nodes: MapNode[] = [];
  for (let row = 1; row <= ROWS; row++) {
    const cols = [...new Set(paths.map((p) => p[row - 1] as number))].sort((a, b) => a - b);
    for (const col of cols) {
      nodes.push({ id: nodeId(phase, row, col), row, col, type: 'task', encounter: null });
    }
  }
  const boss = `p${phase}-boss`;
  nodes.push({ id: boss, row: ROWS + 1, col: BOSS_COL, type: 'release', encounter: null });
  return nodes;
}

/** Deduplicated path steps, then every row-7 node to the boss. */
function buildEdges(phase: Phase, paths: readonly number[][], nodes: readonly MapNode[]): Edges {
  const edges: Edges = [];
  const add = (from: NodeId, to: NodeId) => {
    if (!edges.some(([a, b]) => a === from && b === to)) edges.push([from, to]);
  };
  for (const p of paths) {
    for (let r = 1; r < ROWS; r++) {
      add(nodeId(phase, r, p[r - 1] as number), nodeId(phase, r + 1, p[r] as number));
    }
  }
  for (const n of nodes) if (n.row === ROWS) add(n.id, `p${phase}-boss`);
  return edges;
}

/** The map of `phase`; `tutorial` makes row 1 a single tutorial fight. */
export function generateMap(seed: string, phase: Phase, tutorial: boolean): MapState {
  const rng = fork(seed, `map/${phase}`);
  const paths = drawPaths(rng, tutorial);
  const nodes = buildNodes(phase, paths);
  const edges = buildEdges(phase, paths, nodes);
  assignTypes(rng, { nodes, edges });
  assignEncounters({ seed, phase, tutorial }, nodes, edges);
  return { nodes, edges, visited: [], current: null };
}
