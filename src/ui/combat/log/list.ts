// Log panel logic without DOM: filters, the virtual row window, the current line and the keys
// that step through lines (ui.md "Performance budgets": at most MAX_ROWS rows in the DOM).
import type { CombatEvent, EventKind } from '../../../sim/events.ts';

export type LogFilter = 'all' | 'damage' | 'context' | 'enemies';
export const FILTERS: readonly LogFilter[] = ['all', 'damage', 'context', 'enemies'];

const DAMAGE = new Set<EventKind>(['damage', 'guard', 'heal', 'armorBroken', 'resolved']);
const CONTEXT = new Set<EventKind>(['tokens', 'zoneChanged', 'compaction']);

/** Damage: hits, Guardrails, heals, armor, resolves. Context: the bar. Enemies: what they do. */
export function inFilter(filter: LogFilter, e: CombatEvent): boolean {
  if (filter === 'damage') return DAMAGE.has(e.kind);
  if (filter === 'context') return CONTEXT.has(e.kind);
  if (filter === 'enemies') return e.kind === 'spawn' || e.src?.startsWith('e') === true;
  return true;
}

/** Fixed row height in px; theme/log.css uses the same value. */
export const ROW_PX = 22;
export const MAX_ROWS = 200;
/** Rows rendered above and below the visible ones. */
export const OVERSCAN = 12;

/** Rows `[start, end)` to render for a scroll offset and box height; never more than MAX_ROWS. */
export function rowWindow(count: number, top: number, height: number) {
  const rows = Math.min(MAX_ROWS, Math.ceil(height / ROW_PX) + 2 * OVERSCAN);
  const first = Math.floor(top / ROW_PX) - OVERSCAN;
  const start = Math.max(0, Math.min(first, count - rows));
  return { start, end: Math.min(count, start + rows) };
}

/** Position in `indices` (ascending event indices) of the last event applied before `cursor`. */
export function currentPos(indices: readonly number[], cursor: number): number {
  let lo = 0;
  let hi = indices.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((indices[mid] ?? 0) < cursor) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}

const PAGE = 10;
const STEPS: Readonly<Record<string, number>> = {
  ArrowUp: -1,
  ArrowDown: 1,
  PageUp: -PAGE,
  PageDown: PAGE,
  Home: Number.NEGATIVE_INFINITY,
  End: Number.POSITIVE_INFINITY,
  Enter: 0,
};

/** The line a key moves to from `pos` among `count` lines; undefined for other keys. */
export function keyTarget(key: string, pos: number, count: number): number | undefined {
  const step = STEPS[key];
  if (step === undefined || count === 0) return undefined;
  return Math.max(0, Math.min(count - 1, pos + step));
}
