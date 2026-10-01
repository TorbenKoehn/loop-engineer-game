// The combat log panel (screens.md "Tooltips and the combat log"): one line per event up to the
// furthest point played, filterable and virtualised. A click or a key (arrows, Page, Home, End,
// Enter) seeks the replay to a line, pauses it and highlights the units involved.
import { computed } from '@preact/signals';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { t, tPlural } from '../../i18n.ts';
import type { Replay } from '../fight.ts';
import { type LogLine, lineText, logLines } from './format.ts';
import {
  currentPos,
  FILTERS,
  inFilter,
  keyTarget,
  type LogFilter,
  ROW_PX,
  rowWindow,
} from './list.ts';

function Row(props: { line: LogLine; at: number; current: boolean; future: boolean }) {
  const { line } = props;
  const cls = `log__row log__row--${line.tone}${line.hurt ? ' is-hurt' : ''}`;
  const state = `${props.current ? ' is-current' : ''}${props.future ? ' is-future' : ''}`;
  return (
    <div
      id={`log-${line.index}`}
      role="option"
      aria-selected={props.current}
      class={cls + state}
      title={lineText(line)}
      tabIndex={-1}
      data-at={props.at}
    >
      <span class="log__t">[{line.time}]</span> <span class="log__src">{line.src}</span>
      {line.dst && (
        <>
          <span class="log__arrow">{' -> '}</span>
          <span class="log__dst">{line.dst}</span>
        </>
      )}
      <span class="log__arrow">{': '}</span>
      <span class="log__verb">{line.verb}</span>
      {line.why && <span class="log__why"> ({line.why})</span>}
    </div>
  );
}

interface RowsProps {
  readonly shown: readonly LogLine[];
  /** Position of the current line in `shown`; -1 for none. */
  readonly pos: number;
  readonly cursor: number;
  /** Scroll offset and height of the list box in px. */
  readonly top: number;
  readonly height: number;
}

/** The virtual list: a full-height spacer with only the rows of `rowWindow` inside. */
export function Rows({ shown, pos, cursor, top, height }: RowsProps) {
  const { start, end } = rowWindow(shown.length, top, height);
  return (
    <div class="log__rows" style={{ height: `${shown.length * ROW_PX}px` }}>
      <div style={{ transform: `translateY(${start * ROW_PX}px)` }}>
        {shown.slice(start, end).map((l, i) => (
          <Row
            key={l.index}
            line={l}
            at={start + i}
            current={start + i === pos}
            future={l.index >= cursor}
          />
        ))}
      </div>
    </div>
  );
}

/** Scroll offset and height of the list box, kept current on scroll and resize. */
function useBox() {
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ top: 0, height: 0 });
  const measure = () => {
    const el = box.current;
    if (el) setView({ top: el.scrollTop, height: el.clientHeight });
  };
  useEffect(() => {
    const observer = new ResizeObserver(measure);
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, []);
  return { box, view, measure };
}

/** Scrolls the least amount that shows row `pos`. */
function reveal(el: HTMLElement | null, pos: number): void {
  if (!el || pos < 0) return;
  const y = pos * ROW_PX;
  if (y < el.scrollTop) el.scrollTop = y;
  else if (y + ROW_PX > el.scrollTop + el.clientHeight) el.scrollTop = y + ROW_PX - el.clientHeight;
}

function Filters(props: { filter: LogFilter; set: (f: LogFilter) => void }) {
  return (
    <fieldset class="log__filters" aria-label={t('ui.log.filters')}>
      {FILTERS.map((f) => (
        <button
          key={f}
          type="button"
          class="log__filter"
          aria-pressed={props.filter === f}
          onClick={() => props.set(f)}
        >
          {t(`ui.log.filter.${f}`)}
        </button>
      ))}
    </fieldset>
  );
}

/** The lines played so far under `filter`, and the position of the current one. */
function useLines(r: Replay, filter: LogFilter) {
  const lines = useMemo(() => logLines(r.fight), [r.fight]);
  // The furthest point played: lines stay listed after seeking back.
  const played = useMemo(() => {
    let most = 0;
    return computed(() => (most = Math.max(most, r.pb.cursor.value)));
  }, [r]);
  const upTo = played.value;
  const shown = useMemo(
    () => lines.filter((l) => l.index < upTo && inFilter(filter, l.event)),
    [lines, filter, upTo],
  );
  const cursor = r.pb.cursor.value;
  const pos = currentPos(
    shown.map((l) => l.index),
    cursor,
  );
  return { shown, cursor, pos };
}

export function CombatLog({ r }: { r: Replay }) {
  const [filter, setFilter] = useState<LogFilter>('all');
  const { shown, cursor, pos } = useLines(r, filter);
  const { box, view, measure } = useBox();
  useLayoutEffect(() => reveal(box.current, pos), [box, pos]);
  const pick = (l: LogLine | undefined) => {
    if (!l) return;
    r.picked.value = l.index;
    r.pb.seek(l.index + 1);
    box.current?.focus({ preventScroll: true });
  };
  const onKey = (ev: KeyboardEvent) => {
    const to = keyTarget(ev.key, pos, shown.length);
    if (to === undefined) return;
    ev.preventDefault();
    pick(shown[to]);
  };
  const onClick = (ev: MouseEvent) => {
    const row = (ev.target as Element).closest<HTMLElement>('[data-at]');
    if (row) pick(shown[Number(row.dataset.at)]);
  };
  const current = shown[pos];
  return (
    <section class="log" aria-label={t('ui.log.region')} data-testid="combat-log">
      <header class="log__head">
        <span class="log__title">{t('ui.log.title')}</span>
        <Filters filter={filter} set={setFilter} />
        <span class="log__count">{tPlural('ui.log.count', shown.length)}</span>
        <span class="log__hint">{t('ui.log.hint')}</span>
      </header>
      <div
        ref={box}
        class="log__box"
        role="listbox"
        tabIndex={0}
        aria-label={t('ui.log.lines')}
        aria-activedescendant={current && `log-${current.index}`}
        onKeyDown={onKey}
        onClick={onClick}
        onScroll={measure}
      >
        {shown.length === 0 && <p class="log__empty">{t('ui.log.empty')}</p>}
        <Rows shown={shown} pos={pos} cursor={cursor} top={view.top} height={view.height} />
      </div>
    </section>
  );
}
