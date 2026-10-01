// The fight itself: the agent card on the left, the enemy line on the right (front first).
import { fmtSeconds, t } from '../../i18n.ts';
import type { Replay } from '../fight.ts';
import type { EnemyView } from '../fold.ts';
import { enemyName, harnessName, intentName } from '../names.ts';
import { windupLeft } from '../timeline.ts';
import { enemyArt, intentBadge, portraitOf } from './art.ts';
import { Bar, Chips, FLASH_MS, isRecent, Pops } from './bits.tsx';

function Portrait(props: { harness: string }) {
  return (
    <pre class="portrait" aria-hidden="true">
      {portraitOf(props.harness).map((line) => {
        const [before, after] = line.split('@');
        return (
          <span key={line} class="portrait__line">
            {before}
            {after !== undefined && <span class="cursor">█</span>}
            {after}
            {'\n'}
          </span>
        );
      })}
    </pre>
  );
}

function AgentCard(props: { r: Replay }) {
  const { fight, pb } = props.r;
  const time = pb.simT.value;
  const { agent, pops } = pb.view.value;
  const hit = isRecent(agent.hitAt, time, FLASH_MS, pb.speed.value);
  return (
    <article class={`card card--agent${hit ? ' is-hit' : ''}`} data-testid="agent-card">
      <header class="card__head">
        <span class="card__title">{harnessName(fight.harness)}</span>
        <span class="card__kind">{t('ui.combat.agent')}</span>
      </header>
      <Portrait harness={fight.harness} />
      <div class="stat stat--trust">
        <span>♥ {t('ui.status.trust')}</span>
        <span class="stat__num" data-testid="trust">
          {agent.trust}
          <small>/{agent.maxTrust}</small>
        </span>
      </div>
      <Bar value={agent.trust} max={agent.maxTrust} tone="trust" />
      <div class="stat stat--guard">
        <span>⛨ {t('ui.combat.guardrails')}</span>
        <span class="stat__num stat__num--small" data-testid="guard">
          {agent.guard}
        </span>
      </div>
      <Bar value={agent.guard} max={agent.maxTrust} tone="guard" />
      <Chips statuses={agent.statuses} time={time} />
      <Pops pops={pops} unit="a" time={time} speed={pb.speed.value} />
    </article>
  );
}

function Intent(props: { enemy: EnemyView; time: number }) {
  const { intent, def } = props.enemy;
  if (!intent) return null;
  const left = windupLeft(intent, props.time);
  return (
    <div class="intent" data-testid="intent">
      <div class="intent__row">
        <span class="intent__badge">{intentBadge(def, intent.id)}</span>
        <span class="intent__name">{intentName(def, intent.id)}</span>
        <span class="intent__left">{fmtSeconds(left)}</span>
      </div>
      <Bar value={intent.windupMs - left} max={intent.windupMs} tone="intent" />
    </div>
  );
}

function EnemyCard(props: { enemy: EnemyView; r: Replay; front: boolean }) {
  const { enemy, r } = props;
  const time = r.pb.simT.value;
  const resolved = enemy.resolvedAt !== undefined;
  const cls = [
    'card card--enemy',
    resolved && 'is-resolved',
    props.front && 'is-front',
    isRecent(enemy.hitAt, time, FLASH_MS, r.pb.speed.value) && 'is-hit',
  ];
  return (
    <article class={cls.filter(Boolean).join(' ')} data-testid={`enemy-${enemy.ref}`}>
      <header class="card__head">
        <span class="card__title">{r.fight.labels.get(enemy.ref) ?? enemyName(enemy.def)}</span>
        <span class="card__kind">
          {resolved ? t('ui.combat.resolved') : props.front && t('ui.combat.front')}
        </span>
      </header>
      <pre class="enemy-art" aria-hidden="true">
        {enemyArt(enemy.def)}
      </pre>
      <div class="stat stat--sev">
        <span>{t('ui.combat.severity')}</span>
        <span class="stat__num">
          {enemy.sev}
          <small>/{enemy.maxSev}</small>
        </span>
      </div>
      <Bar value={enemy.sev} max={enemy.maxSev} tone="sev" />
      {enemy.guard > 0 && <div class="stat stat--guard">⛨ {enemy.guard}</div>}
      {resolved ? <div class="resolved-tag">✓</div> : <Intent enemy={enemy} time={time} />}
      <Chips statuses={enemy.statuses} time={time} />
      <Pops pops={r.pb.view.value.pops} unit={enemy.ref} time={time} speed={r.pb.speed.value} />
    </article>
  );
}

export function Arena(props: { r: Replay }) {
  const { enemies } = props.r.pb.view.value;
  const front = enemies.find((e) => e.resolvedAt === undefined)?.ref;
  return (
    <div class="field">
      <AgentCard r={props.r} />
      <div class="versus" aria-hidden="true">
        »
      </div>
      <div class="enemies">
        {enemies.map((e) => (
          <EnemyCard key={e.ref} enemy={e} r={props.r} front={e.ref === front} />
        ))}
      </div>
    </div>
  );
}
