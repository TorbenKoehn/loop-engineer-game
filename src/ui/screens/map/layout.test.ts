import { describe, expect, it } from 'vitest';
import { generateMap } from '../../../run/map/generate.ts';
import type { MapNode, MapState, NodeType } from '../../../run/state.ts';
import { busRow, CELLS, ICON, type LinkRow, linkRow, neighbour, nodeStates } from './layout.ts';

const node = (row: number, col: number, type: NodeType = 'task'): MapNode => ({
  id: type === 'release' ? 'boss' : `r${row}c${col}`,
  row,
  col,
  type,
  encounter: null,
});

/** A short map: r1 c1, c3; r2 c0, c2, c4; r3 (the last row) c0, c4; the boss on c2. */
const NODES = [
  node(1, 1),
  node(1, 3),
  node(2, 0),
  node(2, 2),
  node(2, 4),
  node(3, 0, 'idleCycle'),
  node(3, 4, 'idleCycle'),
  node(4, 2, 'release'),
];
const MAP: MapState = {
  nodes: NODES,
  edges: [
    ['r1c1', 'r2c0'],
    ['r1c1', 'r2c2'],
    ['r1c3', 'r2c4'],
    ['r2c0', 'r3c0'],
    ['r2c4', 'r3c4'],
    ['r3c0', 'boss'],
    ['r3c4', 'boss'],
  ],
  visited: [],
  current: null,
};

const glyphs = (row: LinkRow) => row.map((l) => l?.glyph ?? ' ').join('');
const tones = (row: LinkRow) => row.map((l) => l?.tone[0] ?? '.').join('');

describe('map layout', () => {
  it('gives every node type an ASCII icon (run-map.md "Node types")', () => {
    expect(ICON).toEqual({
      task: '>_',
      criticalBug: '!!',
      registry: '$',
      standup: '?',
      idleCycle: 'zz',
      freeTier: '[]',
      release: '##',
    });
    for (const icon of Object.values(ICON)) expect(icon).toMatch(/^[\x20-\x7e]+$/);
  });

  it('draws one box-drawing glyph per edge, diagonals in the link columns', () => {
    const row = linkRow(MAP, 1);
    expect(row).toHaveLength(CELLS);
    expect(glyphs(row)).toBe(' ╲ ╱   ╱ ');
    expect(glyphs(linkRow(MAP, 2))).toBe('│       │');
    expect(glyphs(linkRow(MAP, 5))).toBe('         ');
  });

  it('joins the last row to the boss with a bus of junctions', () => {
    expect(glyphs(busRow(MAP))).toBe('┌───┴───┐');
    const bus = busRow(MAP);
    expect(bus.map((l) => (l ? `${+l.left}${+l.right}` : '..')).join(' ')).toBe(
      '01 11 11 11 11 11 11 11 10',
    );
    const one: MapState = { ...MAP, nodes: [node(3, 2, 'idleCycle'), node(4, 2, 'release')] };
    expect(glyphs(busRow(one)).trim()).toBe('│');
    const right: MapState = { ...MAP, nodes: [node(3, 2), node(3, 3), node(4, 2, 'release')] };
    expect(glyphs(busRow(right)).trim()).toBe('├─┐');
  });

  it('marks the current, visited, next, ahead and gone nodes', () => {
    expect([...nodeStates(MAP).values()]).toEqual([
      'next',
      'next',
      'ahead',
      'ahead',
      'ahead',
      'ahead',
      'ahead',
      'ahead',
    ]);
    const moved = { ...MAP, visited: ['r1c1'], current: 'r1c1' };
    const states = nodeStates(moved);
    expect(states.get('r1c1')).toBe('current');
    expect(states.get('r1c3')).toBe('gone');
    expect(states.get('r2c0')).toBe('next');
    expect(states.get('r2c4')).toBe('gone');
    const later = nodeStates({ ...moved, visited: ['r1c1', 'r2c2'], current: 'r2c2' });
    expect(later.get('r1c1')).toBe('visited');
  });

  it('tones travelled links as path and links out of the current node as next', () => {
    const moved = { ...MAP, visited: ['r1c1'], current: 'r1c1' };
    expect(tones(linkRow(moved, 1))).toBe('.n.n...i.');
    const walked = { ...moved, visited: ['r1c1', 'r2c0'], current: 'r2c0' };
    expect(tones(linkRow(walked, 1))).toBe('.p.i...i.');
    const atLast = { ...MAP, visited: ['r3c4'], current: 'r3c4' };
    expect(tones(busRow(atLast))).toBe('iiiinnnnn');
    const boss = { ...MAP, visited: ['r3c0', 'boss'], current: 'boss' };
    expect(tones(busRow(boss))).toBe('pppppiiii');
  });

  it('moves focus sideways in a row and to the nearest column one row up or down', () => {
    const at = (id: string) => NODES.find((n) => n.id === id) as MapNode;
    expect(neighbour(NODES, at('r1c1'), 'ArrowRight')?.id).toBe('r1c3');
    expect(neighbour(NODES, at('r1c1'), 'ArrowLeft')).toBeUndefined();
    expect(neighbour(NODES, at('r1c3'), 'ArrowUp')?.id).toBe('r2c2');
    expect(neighbour(NODES, at('r2c4'), 'ArrowDown')?.id).toBe('r1c3');
    expect(neighbour(NODES, at('r3c0'), 'ArrowUp')?.id).toBe('boss');
    expect(neighbour(NODES, at('r1c1'), 'Enter')).toBeUndefined();
  });

  it('lays out a generated map without overlapping link cells', () => {
    const map = generateMap('K7Q2-M9XA', 1, false);
    const rowOf = new Map(map.nodes.map((n) => [n.id, n.row]));
    for (let row = 1; row < 7; row++) {
      const count = map.edges.filter(([a]) => rowOf.get(a) === row).length;
      expect(linkRow(map, row).filter(Boolean)).toHaveLength(count);
    }
    expect(glyphs(busRow(map))).toMatch(/[┴┼├┤└┘│]/);
  });
});
