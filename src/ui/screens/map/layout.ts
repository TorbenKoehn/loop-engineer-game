// Map geometry (screens.md "Map"): node states, box-drawing link rows and arrow-key moves on a
// grid of 5 node columns with one link column between neighbours. Pure, so tests need no DOM.
import { childrenOf, reachable } from '../../../run/map/graph.ts';
import type { MapNode, MapState, NodeId, NodeType } from '../../../run/state.ts';

/** Map columns (run-map.md "Map generation") and grid cells per line: nodes plus links. */
export const COLS = 5;
export const CELLS = COLS * 2 - 1;

/** run-map.md "Node types": ASCII, so every font and screen reader copes. */
export const ICON: Readonly<Record<NodeType, string>> = {
  task: '>_',
  criticalBug: '!!',
  registry: '$',
  standup: '?',
  idleCycle: 'zz',
  freeTier: '[]',
  release: '##',
};

/** `next` = reachable now, `ahead` = reachable later, `gone` = off every remaining route. */
export type NodeState = 'current' | 'visited' | 'next' | 'ahead' | 'gone';

/** `path` = travelled, `next` = leaves the current node, `idle` = anything else. */
export type Tone = 'path' | 'next' | 'idle';

/** One link cell: a box-drawing glyph, optional horizontal runs to the cell edges, a tone. */
export interface Link {
  glyph: string;
  left: boolean;
  right: boolean;
  tone: Tone;
}

export type LinkRow = readonly (Link | null)[];

function descendants(map: MapState, from: readonly NodeId[]): Set<NodeId> {
  const seen = new Set<NodeId>();
  const queue = [...from];
  for (let id = queue.pop(); id !== undefined; id = queue.pop()) {
    if (seen.has(id)) continue;
    seen.add(id);
    queue.push(...childrenOf(map.edges, id));
  }
  return seen;
}

export function nodeStates(map: MapState): ReadonlyMap<NodeId, NodeState> {
  const next = reachable(map);
  const ahead = descendants(map, next);
  const stateOf = (id: NodeId): NodeState => {
    if (id === map.current) return 'current';
    if (map.visited.includes(id)) return 'visited';
    if (next.includes(id)) return 'next';
    return ahead.has(id) ? 'ahead' : 'gone';
  };
  return new Map(map.nodes.map((n) => [n.id, stateOf(n.id)]));
}

function toneOf(map: MapState, from: NodeId, to: NodeId): Tone {
  if (map.visited.includes(from) && map.visited.includes(to)) return 'path';
  return from === map.current ? 'next' : 'idle';
}

const STEP: Readonly<Record<number, string>> = { [-1]: '╲', 0: '│', 1: '╱' };

/** Links from `row` to `row + 1` (rows 1-6): one cell per edge, no two edges share a cell. */
export function linkRow(map: MapState, row: number): LinkRow {
  const at = new Map(map.nodes.map((n) => [n.id, n]));
  const cells: (Link | null)[] = Array(CELLS).fill(null);
  for (const [a, b] of map.edges) {
    const from = at.get(a);
    const to = at.get(b);
    if (from?.row !== row || !to) continue;
    const step = to.col - from.col;
    const glyph = STEP[step] ?? '│';
    cells[2 * from.col + step] = { glyph, left: false, right: false, tone: toneOf(map, a, b) };
  }
  return cells;
}

/** Keyed `up down left right` as 0/1: up joins the boss, down a row-7 node. */
const JUNCTION: Readonly<Record<string, string>> = {
  '1100': '│',
  '1111': '┼',
  '1101': '├',
  '1110': '┤',
  '1011': '┴',
  '0111': '┬',
  '1001': '└',
  '1010': '┘',
  '0101': '┌',
  '0110': '┐',
  '0011': '─',
};

/** Columns of the travelled or next boss link, from the row-7 node on the route. */
function bossSpan(map: MapState, boss: MapNode, last: readonly MapNode[]) {
  const from = last.find((n) => map.visited.includes(n.id));
  if (!from) return null;
  const tone: Tone = map.visited.includes(boss.id) ? 'path' : 'next';
  return { lo: Math.min(from.col, boss.col), hi: Math.max(from.col, boss.col), tone };
}

/** The bus joining every row-7 node to the boss: `┌──┴──┐` style junctions. */
export function busRow(map: MapState): LinkRow {
  const boss = map.nodes.find((n) => n.type === 'release');
  if (!boss) return Array(CELLS).fill(null);
  const last = map.nodes.filter((n) => n.row === boss.row - 1);
  const cols = last.map((n) => n.col);
  const lo = Math.min(boss.col, ...cols);
  const hi = Math.max(boss.col, ...cols);
  const lit = bossSpan(map, boss, last);
  return Array.from({ length: CELLS }, (_, i): Link | null => {
    const c = i / 2;
    if (c < lo || c > hi) return null;
    const bits = [c === boss.col, cols.includes(c), c > lo, c < hi];
    const glyph = JUNCTION[bits.map(Number).join('')] ?? '│';
    const tone = lit && c >= lit.lo && c <= lit.hi ? lit.tone : 'idle';
    return { glyph, left: c > lo, right: c < hi, tone };
  });
}

const MOVES: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [1, 0],
  ArrowDown: [-1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/** The node an arrow key moves to: same row sideways, else the nearest column a row up/down. */
export function neighbour(
  nodes: readonly MapNode[],
  from: MapNode,
  key: string,
): MapNode | undefined {
  const move = MOVES[key];
  if (!move) return undefined;
  const [dRow, dCol] = move;
  const fits = (n: MapNode) =>
    dCol === 0
      ? n.row === from.row + dRow
      : n.row === from.row && Math.sign(n.col - from.col) === dCol;
  const dist = (n: MapNode) => Math.abs(n.col - from.col);
  return nodes.filter(fits).sort((a, b) => dist(a) - dist(b) || a.col - b.col)[0];
}
