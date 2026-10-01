// The tool row: one card per slot with its charge bar, read from the event log's fire times.
import { Fragment } from 'preact';
import type { ToolView } from '../../combat/fold.ts';
import { toolFlavour, toolName } from '../names.ts';
import type { Player } from '../player.ts';
import { chargeAt } from '../timeline.ts';
import { Bar, Chips, FLASH_MS, isRecent } from './bits.tsx';

function ToolCard(props: { tool: ToolView; player: Player }) {
  const { tool, player } = props;
  const { fight } = player;
  const t = player.time.value;
  const def = fight.input.agent.tools[tool.slot]?.def;
  const fallbackMs = def ? (def.cooldownMs * 100) / fight.input.agent.model.speed : 3000;
  const charge = chargeAt(fight.fires[tool.slot] ?? [], t, fallbackMs);
  const fired = isRecent(tool.firedAt, t, FLASH_MS, player.speed.value);
  return (
    <article
      class={`tool${fired ? ' is-fired' : ''}`}
      title={toolFlavour(tool.def)}
      data-testid={`tool-${tool.slot}`}
    >
      <header class="tool__head">
        <span class="tool__name">{toolName(tool.def)}</span>
        <span class="tool__version">v{tool.version}</span>
      </header>
      <div class="tool__tags">
        {def?.tags.join(' · ')} · {def ? (def.cooldownMs / 1000).toFixed(1) : '?'} s
      </div>
      <Bar value={charge} max={1} tone="charge" />
      <div class="tool__stats">
        <span>×{tool.fired}</span>
        <span>{tool.dealt} dmg</span>
      </div>
      <Chips statuses={tool.statuses} time={t} />
    </article>
  );
}

export function ToolRow(props: { player: Player }) {
  const { tools } = props.player.view.value;
  return (
    <div class="tools">
      {tools.map((tool, i) => (
        <Fragment key={tool.ref}>
          {i > 0 && (
            <span class="pipe" aria-hidden="true">
              │
            </span>
          )}
          <ToolCard tool={tool} player={props.player} />
        </Fragment>
      ))}
    </div>
  );
}
