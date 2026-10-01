// Scrolling combat log: the pre-built plain-English line of every event played so far.
import { useLayoutEffect, useRef } from 'preact/hooks';
import type { Player } from '../player.ts';
import { formatClock } from '../timeline.ts';

/** DOM rows kept (ui.md "Performance budgets": the log stays at most 200 rows). */
const MAX_ROWS = 200;
/** Auto-scroll only while the reader is this close to the bottom. */
const STICK_PX = 48;

export function CombatLog(props: { player: Player }) {
  const { log } = props.player.fight;
  const cursor = props.player.view.value.cursor;
  const rows = log.slice(Math.max(0, cursor - MAX_ROWS), cursor);
  const list = useRef<HTMLOListElement>(null);
  const stick = useRef(true);

  useLayoutEffect(() => {
    const el = list.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [cursor, log]);

  const onScroll = (): void => {
    const el = list.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_PX;
  };

  return (
    <aside class="panel log" aria-label="Combat log">
      <header class="panel__head">
        <span>
          <span class="prompt">$</span> tail -f combat.log
        </span>
        <span class="panel__meta">
          {cursor}/{log.length}
        </span>
      </header>
      <ol class="log__list" ref={list} onScroll={onScroll} aria-live="off">
        {rows.map((line) => (
          <li key={line.seq} class={`log__row tone-${line.tone}`}>
            <time class="log__time">{formatClock(line.t)}</time>
            <span class="log__actor">{line.actor}</span>
            <span class="log__text">{line.text}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
