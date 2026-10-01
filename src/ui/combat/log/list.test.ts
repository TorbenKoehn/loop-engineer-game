// T061: filters, the virtual row window (at most 200 rows for a 600-event fight) and the keys
// that step through lines.
import type { ComponentChild, VNode } from 'preact';
import { describe, expect, it } from 'vitest';
import type { CombatEvent } from '../../../sim/events.ts';
import { type EventSpec, fightOf, hit } from '../testing/log-fight.ts';
import { logLines } from './format.ts';
import { currentPos, FILTERS, inFilter, keyTarget, MAX_ROWS, ROW_PX, rowWindow } from './list.ts';
import { Rows } from './log.tsx';

type Props = Record<string, unknown> & { children?: ComponentChild };

/** Every element vnode below `node`, function components expanded. */
function elements(node: ComponentChild): VNode<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object') return [];
  const v = node as VNode<Props>;
  if (typeof v.type === 'function')
    return [v, ...elements((v.type as (p: Props) => VNode)(v.props))];
  return [v, ...elements(v.props.children)];
}

/** 600 events: 300 activations of grep, each a toolFired and a hit. */
const LONG: EventSpec[] = Array.from({ length: 300 }, (_, i): EventSpec[] => [
  { t: i * 100, kind: 'toolFired', src: 't0', d: { def: 'grep', version: 2 } },
  hit(i * 100, 6, ['zone:focused']),
]).flat();

const ev = (e: object) => ({ seq: 0, t: 0, ...e }) as CombatEvent;

describe('log filters', () => {
  it('All, Damage, Context and Enemies pick their kinds', () => {
    const events = [
      ev({ kind: 'damage', src: 't0', dst: 'e1' }),
      ev({ kind: 'guard', src: 't1', dst: 'a' }),
      ev({ kind: 'tokens', src: 't0', dst: 'ctx' }),
      ev({ kind: 'zoneChanged', src: 'ctx' }),
      ev({ kind: 'enemyActed', src: 'e1', dst: 'a' }),
      ev({ kind: 'spawn', src: 'sys', dst: 'e2' }),
      ev({ kind: 'toolFired', src: 't0' }),
    ];
    const pick = (f: (typeof FILTERS)[number]) =>
      events.filter((e) => inFilter(f, e)).map((e) => e.kind);
    expect(FILTERS).toEqual(['all', 'damage', 'context', 'enemies']);
    expect(pick('all')).toHaveLength(events.length);
    expect(pick('damage')).toEqual(['damage', 'guard']);
    expect(pick('context')).toEqual(['tokens', 'zoneChanged']);
    expect(pick('enemies')).toEqual(['enemyActed', 'spawn']);
  });
});

describe('virtual rows', () => {
  const lines = logLines(fightOf(LONG));

  it.each([
    [0, 300],
    [4000, 200],
    [13200 - 300, 300],
    [0, 100000],
  ])('a 600-event fight at scroll %i, height %i renders at most 200 rows', (top, height) => {
    expect(lines).toHaveLength(600);
    const tree = Rows({ shown: lines, pos: 599, cursor: 600, top, height }) as VNode<Props>;
    const rows = elements(tree).filter((v) => v.props.role === 'option');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(MAX_ROWS);
    const { start, end } = rowWindow(600, top, height);
    expect(rows.map((v) => v.props.id)).toEqual(
      lines.slice(start, end).map((l) => `log-${l.index}`),
    );
    expect(tree.props.style).toEqual({ height: `${600 * ROW_PX}px` });
  });

  it('the window covers the visible rows and reaches both ends', () => {
    expect(rowWindow(600, 0, 300)).toEqual({ start: 0, end: 38 });
    expect(rowWindow(600, 600 * ROW_PX - 300, 300).end).toBe(600);
    expect(rowWindow(10, 0, 300)).toEqual({ start: 0, end: 10 });
  });

  it('marks the current line and the lines after the cursor', () => {
    const tree = Rows({ shown: lines.slice(0, 5), pos: 1, cursor: 2, top: 0, height: 300 });
    const rows = elements(tree as VNode<Props>).filter((v) => v.props.role === 'option');
    expect(rows.map((v) => v.props['aria-selected'])).toEqual([false, true, false, false, false]);
    expect(rows.map((v) => String(v.props.class).includes('is-future'))).toEqual([
      false,
      false,
      true,
      true,
      true,
    ]);
  });
});

describe('current line and keys', () => {
  it('finds the last shown event before the cursor', () => {
    expect(currentPos([2, 5, 9], 0)).toBe(-1);
    expect(currentPos([2, 5, 9], 3)).toBe(0);
    expect(currentPos([2, 5, 9], 6)).toBe(1);
    expect(currentPos([2, 5, 9], 10)).toBe(2);
  });

  it('arrows, Page, Home, End and Enter move within the lines', () => {
    expect(keyTarget('ArrowDown', -1, 30)).toBe(0);
    expect(keyTarget('ArrowUp', 5, 30)).toBe(4);
    expect(keyTarget('ArrowUp', 0, 30)).toBe(0);
    expect(keyTarget('PageDown', 25, 30)).toBe(29);
    expect(keyTarget('PageUp', 25, 30)).toBe(15);
    expect(keyTarget('Home', 25, 30)).toBe(0);
    expect(keyTarget('End', 3, 30)).toBe(29);
    expect(keyTarget('Enter', 3, 30)).toBe(3);
    expect(keyTarget('a', 3, 30)).toBeUndefined();
    expect(keyTarget('ArrowDown', -1, 0)).toBeUndefined();
  });
});
