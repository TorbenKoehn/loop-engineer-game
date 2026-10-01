// Map screen (screens.md "Map"): the phase DAG bottom to top with box-drawing links, the
// current node red, reachable nodes pulsing; hover or focus previews a node, click or Enter
// travels. One tab stop for the whole map (roving tabindex); arrow keys move between nodes.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { MapState, NodeId } from '../../../run/state.ts';
import { t } from '../../i18n.ts';
import { dispatch, run } from '../../store/run.ts';
import { busRow, type LinkRow, linkRow, neighbour, nodeStates } from './layout.ts';
import { gridRow, Legend, MapNodeButton, NodePreview } from './node.tsx';

/** Rows 1-7 plus the boss row (run-map.md "Phases"). */
const LAST_ROW = 7;
/** Horizontal run beyond a junction; clipped to the cell, so font widths never leave gaps. */
const RUN = '──────';
const DIAGONAL = ['╱', '╲'];

function Links({ cells, row }: { cells: LinkRow; row: number }) {
  return (
    <>
      {cells.map((l, i) =>
        l ? (
          <span
            key={i}
            class={`link link--${l.tone}${DIAGONAL.includes(l.glyph) ? ' link--diag' : ''}`}
            style={{ gridRow: gridRow(row) - 1, gridColumn: i + 2 }}
          >
            <i>{l.left && RUN}</i>
            {l.glyph}
            <i>{l.right && RUN}</i>
          </span>
        ) : null,
      )}
    </>
  );
}

function focusNode(grid: HTMLElement | null, id: NodeId | undefined): void {
  if (id) grid?.querySelector<HTMLElement>(`[data-node="${id}"]`)?.focus();
}

function MapView({ map }: { map: MapState }) {
  const states = nodeStates(map);
  const nodes = [...map.nodes].sort((a, b) => a.row - b.row || a.col - b.col);
  const first = nodes.find((n) => states.get(n.id) === 'next') ?? nodes[0];
  const [focused, setFocused] = useState<NodeId | null>(null);
  const [hovered, setHovered] = useState<NodeId | null>(null);
  const grid = useRef<HTMLFieldSetElement>(null);
  // Each arrival on the map focuses the first reachable node (initial focus, ui.md "Input").
  useEffect(() => focusNode(grid.current, first?.id), [first?.id]);

  const tabStop = nodes.some((n) => n.id === focused) ? focused : first?.id;
  const shown = nodes.find((n) => n.id === (hovered ?? tabStop));
  const here = nodes.find((n) => n.id === map.current);
  const onKeyDown = (e: KeyboardEvent) => {
    const at = nodes.find((n) => n.id === document.activeElement?.getAttribute('data-node'));
    const to = at && neighbour(nodes, at, e.key);
    if (!to) return;
    e.preventDefault();
    focusNode(grid.current, to.id);
  };
  const inspect = (id: NodeId | null, by: 'focus' | 'hover') =>
    by === 'focus' ? setFocused(id) : setHovered(id);

  return (
    <>
      <fieldset ref={grid} class="map__grid" aria-label={t('ui.map.nodes')} onKeyDown={onKeyDown}>
        {Array.from({ length: LAST_ROW }, (_, i) => i + 1).map((row) => (
          <span
            key={row}
            class={`map__gutter${here?.row === row ? ' map__gutter--here' : ''}`}
            style={{ gridRow: gridRow(row) }}
            aria-hidden="true"
          >
            {row}
          </span>
        ))}
        {Array.from({ length: LAST_ROW - 1 }, (_, i) => i + 1).map((row) => (
          <Links key={row} cells={linkRow(map, row)} row={row} />
        ))}
        <Links cells={busRow(map)} row={LAST_ROW} />
        {nodes.map((n) => (
          <MapNodeButton
            key={n.id}
            node={n}
            state={states.get(n.id) ?? 'gone'}
            tabbable={n.id === tabStop}
            onInspect={inspect}
          />
        ))}
      </fieldset>
      <aside class="map__side">
        {shown && <NodePreview node={shown} state={states.get(shown.id) ?? 'gone'} />}
        <Legend />
        <button type="button" class="btn map__abandon" onClick={() => dispatch({ t: 'abandon' })}>
          {t('ui.action.abandon')}
        </button>
      </aside>
    </>
  );
}

export function MapScreen() {
  const r = run.value;
  return (
    <section class="screen map" aria-labelledby="map-title">
      <header class="screen__head map__head">
        <h2 id="map-title">
          <span aria-hidden="true">$ </span>
          {t('ui.map.title')}
        </h2>
        <p class="screen__hint">{t('ui.map.hint')}</p>
      </header>
      {r && <MapView map={r.map} />}
    </section>
  );
}
