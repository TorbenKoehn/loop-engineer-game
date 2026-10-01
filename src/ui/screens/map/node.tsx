// A map node and its preview (screens.md "Map", run-map.md "Encounter selection"): an ASCII
// icon labelled with type, encounter, row and state. Elites never reveal their encounter.
import { content } from '../../../content/index.ts';
import type { StringKey } from '../../../content/strings/en.ts';
import type { MapNode, NodeId, NodeType } from '../../../run/state.ts';
import { enemyName } from '../../combat/names.ts';
import { t } from '../../i18n.ts';
import { dispatch } from '../../store/run.ts';
import { ICON, type NodeState } from './layout.ts';

const typeKey = (type: NodeType) =>
  `ui.node.${type.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}`;
const typeText = (type: NodeType, part: 'name' | 'line') =>
  t(`${typeKey(type)}.${part}` as StringKey);

/** "Task: Context Drift + Typo" (enemies front to back); an elite shows only "Critical Bug". */
export function previewText(node: MapNode): string {
  const encounter = content.encounters.find((e) => e.id === node.encounter);
  const name = typeText(node.type, 'name');
  if (!encounter || node.type === 'criticalBug') return name;
  return t('ui.map.preview', { type: name, enemies: encounter.enemies.map(enemyName).join(' + ') });
}

/** "row 3", or "release" for the boss row. */
export const whereText = (node: MapNode): string =>
  node.type === 'release' ? t('ui.shell.boss') : t('ui.shell.row', { row: node.row });

const stateText = (state: NodeState) => t(`ui.map.state.${state}` as StringKey);

export interface NodeProps {
  node: MapNode;
  state: NodeState;
  tabbable: boolean;
  onInspect: (id: NodeId | null, by: 'focus' | 'hover') => void;
}

/** Bottom to top: the boss (row 8) on grid line 1, row 1 on line 15; column 1 is the gutter. */
export const gridRow = (row: number) => (8 - row) * 2 + 1;

export function MapNodeButton({ node, state, tabbable, onInspect }: NodeProps) {
  return (
    <button
      type="button"
      class={`node node--${state} node--${node.type}`}
      style={{ gridRow: gridRow(node.row), gridColumn: node.col * 2 + 2 }}
      data-node={node.id}
      data-testid={`node-${node.id}`}
      tabIndex={tabbable ? 0 : -1}
      aria-label={t('ui.map.node', {
        preview: previewText(node),
        where: whereText(node),
        state: stateText(state),
      })}
      aria-current={state === 'current' ? 'location' : undefined}
      aria-disabled={state !== 'next'}
      onClick={() => state === 'next' && dispatch({ t: 'travel', node: node.id })}
      onFocus={() => onInspect(node.id, 'focus')}
      onMouseEnter={() => onInspect(node.id, 'hover')}
      onMouseLeave={() => onInspect(null, 'hover')}
    >
      {ICON[node.type]}
    </button>
  );
}

/** The inspected node: icon, encounter, what the node does, row and state. */
export function NodePreview({ node, state }: { node: MapNode; state: NodeState }) {
  return (
    <section class={`preview preview--${state}`} data-testid="map-preview">
      <span class="preview__icon" aria-hidden="true">
        {ICON[node.type]}
      </span>
      <h3 class="preview__title">{previewText(node)}</h3>
      <p class="preview__line">{typeText(node.type, 'line')}</p>
      <p class="preview__meta">
        {whereText(node)} · {stateText(state)}
      </p>
      {state === 'next' && <p class="preview__go">{t('ui.map.travel')}</p>}
    </section>
  );
}

export function Legend() {
  return (
    <ul class="legend" aria-label={t('ui.map.legend')}>
      {(Object.keys(ICON) as NodeType[]).map((type) => (
        <li key={type}>
          <b aria-hidden="true">{ICON[type]}</b> {typeText(type, 'name')}
        </li>
      ))}
    </ul>
  );
}
