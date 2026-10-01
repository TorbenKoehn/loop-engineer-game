// Edge lookups on the phase map. Edges are directed `[from, to]`, one row down.
import type { MapState, NodeId } from '../state.ts';

export type Edges = MapState['edges'];

export const parentsOf = (edges: Edges, id: NodeId): NodeId[] =>
  edges.filter(([, to]) => to === id).map(([from]) => from);

export const childrenOf = (edges: Edges, id: NodeId): NodeId[] =>
  edges.filter(([from]) => from === id).map(([, to]) => to);

/** Node ids the agent can travel to next; row-1 nodes while `current` is null. */
export function reachable(map: MapState): NodeId[] {
  if (map.current === null) return map.nodes.filter((n) => n.row === 1).map((n) => n.id);
  return childrenOf(map.edges, map.current);
}
