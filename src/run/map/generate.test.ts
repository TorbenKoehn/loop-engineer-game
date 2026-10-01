import { describe, expect, it } from 'vitest';
import { content } from '../../content/index.ts';
import { fork } from '../../sim/rng.ts';
import type { MapNode, MapState, NodeId, NodeType } from '../state.ts';
import { generateMap } from './generate.ts';
import { parentsOf } from './graph.ts';
import { drawPaths } from './paths.ts';

const SEEDS = Array.from({ length: 500 }, (_, i) => `seed-${i}`);
const MAPS = SEEDS.map((seed) => generateMap(seed, 1, false));
const NODES = MAPS.flatMap((map) => map.nodes.map((n) => ({ map, n })));
const SPACED: readonly NodeType[] = ['criticalBug', 'registry', 'idleCycle'];
/** Rows each type may appear on: fixed rows 1/4/7, the weighted-row table, the boss. */
const ALLOWED: Record<NodeType, readonly number[]> = {
  task: [1, 2, 3, 5, 6],
  standup: [2, 3, 5, 6],
  registry: [2, 3, 5, 6],
  criticalBug: [3, 5, 6],
  idleCycle: [5, 7],
  freeTier: [4],
  release: [8],
};
const FIXED: Record<number, NodeType> = { 1: 'task', 4: 'freeTier', 7: 'idleCycle' };
const pool = (p: string) =>
  content.encounters.filter((e) => e.phase === 1 && e.pool === p).map((e) => e.id);
const EASY = pool('easy');

function node(map: MapState, id: NodeId): MapNode {
  const n = map.nodes.find((m) => m.id === id);
  if (!n) throw new Error(`missing node ${id}`);
  return n;
}

/** Ids of every node with a path to `id`. */
function ancestors(map: MapState, id: NodeId): NodeId[] {
  const out = new Set<NodeId>();
  const todo = [id];
  for (let cur = todo.pop(); cur !== undefined; cur = todo.pop()) {
    for (const p of parentsOf(map.edges, cur)) {
      if (!out.has(p)) todo.push(p);
      out.add(p);
    }
  }
  return [...out];
}

/** The encounters `n` may get by type and row (docs/game/systems/run-map.md). */
function expectedPool(n: MapNode): readonly (string | null)[] {
  if (n.type === 'release') return ['p1b'];
  if (n.type === 'criticalBug') return pool('elite');
  if (n.type !== 'task') return [null];
  if (n.row === 1) return EASY.slice(0, 2);
  return n.row <= 3 ? EASY : pool('hard');
}

const isUnitStep = (path: number[]) =>
  path.every((c, r) => r === 0 || Math.abs(c - (path[r - 1] as number)) <= 1);

describe('paths', () => {
  it('500 seeds: 4 paths over 7 rows, unit steps, first two start apart', () => {
    for (const seed of SEEDS) {
      const paths = drawPaths(fork(seed, 'map/1'), false);
      expect(paths.map((p) => p.length)).toEqual([7, 7, 7, 7]);
      expect(paths.every(isUnitStep)).toBe(true);
      expect(paths[0]?.[0]).not.toBe(paths[1]?.[0]);
    }
  });
});

describe('generateMap', () => {
  it('500 seeds: 7x5 grid with p<phase>-r<row>-c<col> ids and p1-boss', () => {
    for (const { n } of NODES) {
      const id = n.row === 8 ? 'p1-boss' : `p1-r${n.row}-c${n.col}`;
      expect([n.id, n.row >= 1 && n.row <= 8, n.col >= 0 && n.col <= 4]).toEqual([id, true, true]);
    }
    for (const map of MAPS) {
      expect([...new Set(map.nodes.map((n) => n.row))].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    }
  });

  it('500 seeds: edges go one row down, never cross, row 7 links to the boss', () => {
    for (const map of MAPS) {
      const steps = map.edges.map(([a, b]) => [node(map, a), node(map, b)] as const);
      for (const [a, b] of steps) {
        expect(b.row).toBe(a.row + 1);
        const crossing = steps.filter(
          ([c, d]) => a.row === c.row && (a.col - c.col) * (b.col - d.col) < 0,
        );
        expect(crossing, `${a.id}->${b.id}`).toEqual([]);
      }
      const row7 = map.nodes.filter((n) => n.row === 7).map((n) => n.id);
      expect(parentsOf(map.edges, 'p1-boss').sort()).toEqual(row7.sort());
      expect(new Set(map.edges.map((e) => e.join())).size).toBe(map.edges.length);
    }
  });

  it('500 seeds: fixed rows 1/4/7 and weighted types only on allowed rows', () => {
    for (const { n } of NODES) {
      expect(ALLOWED[n.type], `${n.id} ${n.type}`).toContain(n.row);
      expect(n.type).toBe(FIXED[n.row] ?? n.type);
    }
  });

  it('500 seeds: no same-type spaced edge, a Registry in rows 2-6, a Critical Bug in rows 3-6', () => {
    for (const map of MAPS) {
      const same = map.edges.filter(([a, b]) => {
        const t = node(map, a).type;
        return SPACED.includes(t) && t === node(map, b).type;
      });
      expect(same).toEqual([]);
      const types = map.nodes.filter((n) => n.row >= 2 && n.row <= 6).map((n) => n.type);
      expect(types).toContain('registry');
      expect(types).toContain('criticalBug'); // Critical Bug is only allowed on rows 3-6
    }
  });

  it('500 seeds: encounters come from the pool of the node type and row', () => {
    for (const { n } of NODES) expect(expectedPool(n), n.id).toContain(n.encounter);
  });

  it('500 seeds: an encounter repeats an ancestor only once its pool is exhausted', () => {
    const earlier = (map: MapState, n: MapNode) =>
      ancestors(map, n.id).map((a) => node(map, a).encounter);
    const repeats = NODES.filter(
      ({ map, n }) => n.encounter !== null && earlier(map, n).includes(n.encounter),
    );
    for (const { map, n } of repeats) {
      const seen = earlier(map, n);
      expect(
        expectedPool(n).every((id) => seen.includes(id)),
        n.id,
      ).toBe(true);
    }
    expect(repeats.length).toBeGreaterThan(0); // the single phase-1 elite repeats
  });

  it('the first Task draws both of the first two easy entries across seeds', () => {
    const row1 = NODES.filter(({ n }) => n.row === 1).map(({ n }) => n.encounter);
    expect(new Set(row1)).toEqual(new Set(['p1e1', 'p1e2']));
  });

  it('tutorial: row 1 is a single p1e1 node', () => {
    for (const seed of SEEDS.slice(0, 100)) {
      const row1 = generateMap(seed, 1, true).nodes.filter((n) => n.row === 1);
      expect(row1).toEqual([{ id: 'p1-r1-c2', row: 1, col: 2, type: 'task', encounter: 'p1e1' }]);
    }
  });

  it('is deterministic and JSON-plain', () => {
    const map = generateMap('K7Q2-M9XA', 1, false);
    expect(generateMap('K7Q2-M9XA', 1, false)).toEqual(map);
    expect(JSON.parse(JSON.stringify(map))).toStrictEqual(map);
    expect([map.visited, map.current]).toEqual([[], null]);
  });
});
