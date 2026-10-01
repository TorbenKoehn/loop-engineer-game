// Placeholder phase-1 map: one seeded column per row, a single path to the boss.
// Replaced by the real generator (T041); only the MapState shape is shared.
import { fork, int } from '../sim/rng.ts';
import type { MapNode, MapState, NodeId } from './state.ts';

const ROWS = 7;
const COLS = 5;

export function stubMap(seed: string): MapState {
  const rng = fork(seed, 'map/1');
  const nodes: MapNode[] = [];
  for (let row = 1; row <= ROWS; row++) {
    const col = int(rng, 0, COLS - 1);
    nodes.push({ id: `p1-r${row}-c${col}`, row, col });
  }
  nodes.push({ id: 'p1-boss', row: ROWS + 1, col: 2 });
  const edges: [NodeId, NodeId][] = [];
  for (let i = 1; i < nodes.length; i++) {
    edges.push([(nodes[i - 1] as MapNode).id, (nodes[i] as MapNode).id]);
  }
  return { nodes, edges, visited: [], current: null };
}

/** Node ids the agent can travel to next. */
export function reachable(map: MapState): NodeId[] {
  if (map.current === null) return map.nodes.filter((n) => n.row === 1).map((n) => n.id);
  return map.edges.filter(([from]) => from === map.current).map(([, to]) => to);
}
