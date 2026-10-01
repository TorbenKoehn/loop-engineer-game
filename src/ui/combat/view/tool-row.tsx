// The tool row in slot order: version, cooldown bar (charge read from the log's fire times),
// next effect value and output per card; pipes render as `|` between cards.
import { Fragment } from 'preact';
import { t } from '../../i18n.ts';
import type { Replay } from '../fight.ts';
import type { ToolView } from '../fold.ts';
import { toolFlavour, toolName } from '../names.ts';
import { chargeAt } from '../timeline.ts';
import { nextValue } from './art.ts';
import { Bar, Chips, FLASH_MS, isRecent } from './bits.tsx';

function ToolCard(props: { tool: ToolView; r: Replay }) {
  const { tool, r } = props;
  const { input, fires } = r.fight;
  const time = r.pb.simT.value;
  const def = input.agent.tools[tool.slot]?.def;
  const fallbackMs = def ? (def.cooldownMs * 100) / input.agent.model.speed : 3000;
  const charge = chargeAt(fires[tool.slot] ?? [], time, fallbackMs);
  const fired = isRecent(tool.firedAt, time, FLASH_MS, r.pb.speed.value);
  return (
    <article
      class={`tool${fired ? ' is-fired' : ''}`}
      title={toolFlavour(tool.def)}
      data-testid={`tool-${tool.slot}`}
    >
      <header class="tool__head">
        <span class="tool__name">{toolName(tool.def)}</span>
        <span class="tool__version">{t('ui.combat.version', { n: tool.version })}</span>
      </header>
      <Bar value={charge} max={1} tone="charge" />
      <div class="tool__stats">
        <span class="tool__next">{def && nextValue(def, tool.version)}</span>
        <span>{t('ui.combat.output', { n: def?.output ?? 0 })}</span>
      </div>
      <Chips statuses={tool.statuses} time={time} />
    </article>
  );
}

export function ToolRow(props: { r: Replay }) {
  const { tools } = props.r.pb.view.value;
  return (
    <div class="tools">
      {tools.map((tool, i) => (
        <Fragment key={tool.ref}>
          {i > 0 && (
            <span class="pipe" aria-hidden="true">
              |
            </span>
          )}
          <ToolCard tool={tool} r={props.r} />
        </Fragment>
      ))}
    </div>
  );
}
