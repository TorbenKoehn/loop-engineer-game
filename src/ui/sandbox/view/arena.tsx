// The fight itself: the agent card on the left, the enemy line on the right (front first).
import type { EnemyView } from '../fold.ts';
import { enemyName, harnessName, intentName } from '../names.ts';
import type { Player } from '../player.ts';
import { formatSeconds, windupLeft } from '../timeline.ts';
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

function AgentCard(props: { player: Player }) {
  const { fight, view, time, speed } = props.player;
  const t = time.value;
  const { agent, pops } = view.value;
  const hit = isRecent(agent.hitAt, t, FLASH_MS, speed.value);
  const harness = fight.setup.harness;
  return (
    <article class={`card card--agent${hit ? ' is-hit' : ''}`} data-testid="agent-card">
      <header class="card__head">
        <span class="card__title">{harnessName(harness)}</span>
        <span class="card__kind">agent</span>
      </header>
      <Portrait harness={harness} />
      <div class="stat stat--trust">
        <span>♥ Trust</span>
        <span class="stat__num" data-testid="trust">
          {agent.trust}
          <small>/{agent.maxTrust}</small>
        </span>
      </div>
      <Bar value={agent.trust} max={agent.maxTrust} tone="trust" />
      <div class="stat stat--guard">
        <span>⛨ Guardrails</span>
        <span class="stat__num stat__num--small">{agent.guard}</span>
      </div>
      <Bar value={agent.guard} max={agent.maxTrust} tone="guard" />
      <Chips statuses={agent.statuses} time={t} />
      <Pops pops={pops} unit="a" time={t} speed={speed.value} />
    </article>
  );
}

function Intent(props: { enemy: EnemyView; time: number }) {
  const { intent, def } = props.enemy;
  if (!intent || props.enemy.resolvedAt !== undefined) return null;
  const left = windupLeft(intent, props.time);
  return (
    <div class="intent" title="Next action and its windup">
      <div class="intent__row">
        <span class="intent__badge">{intentBadge(def, intent.id)}</span>
        <span class="intent__name">{intentName(def, intent.id)}</span>
        <span class="intent__left">{formatSeconds(left)}</span>
      </div>
      <Bar value={intent.windupMs - left} max={intent.windupMs} tone="intent" />
    </div>
  );
}

function EnemyCard(props: { enemy: EnemyView; player: Player; front: boolean }) {
  const { enemy, player } = props;
  const t = player.time.value;
  const speed = player.speed.value;
  const resolved = enemy.resolvedAt !== undefined;
  const cls = [
    'card card--enemy',
    resolved && 'is-resolved',
    props.front && !resolved && 'is-front',
    isRecent(enemy.hitAt, t, FLASH_MS, speed) && 'is-hit',
  ];
  return (
    <article class={cls.filter(Boolean).join(' ')} data-testid={`enemy-${enemy.ref}`}>
      <header class="card__head">
        <span class="card__title">
          {player.fight.labels.get(enemy.ref) ?? enemyName(enemy.def)}
        </span>
        <span class="card__kind">{resolved ? 'resolved' : props.front ? 'front' : ''}</span>
      </header>
      <pre class="enemy-art" aria-hidden="true">
        {enemyArt(enemy.def)}
      </pre>
      <div class="stat stat--sev">
        <span>Severity</span>
        <span class="stat__num">
          {enemy.sev}
          <small>/{enemy.maxSev}</small>
        </span>
      </div>
      <Bar value={enemy.sev} max={enemy.maxSev} tone="sev" />
      {enemy.guard > 0 && <div class="stat stat--guard">⛨ {enemy.guard}</div>}
      {resolved ? <div class="resolved-tag">✓ resolved</div> : <Intent enemy={enemy} time={t} />}
      <Chips statuses={enemy.statuses} time={t} />
      <Pops pops={player.view.value.pops} unit={enemy.ref} time={t} speed={speed} />
    </article>
  );
}

export function Arena(props: { player: Player }) {
  const { enemies } = props.player.view.value;
  const front = enemies.find((e) => e.resolvedAt === undefined)?.ref;
  return (
    <div class="field">
      <AgentCard player={props.player} />
      <div class="versus" aria-hidden="true">
        vs
      </div>
      <div class="enemies">
        {enemies.map((e) => (
          <EnemyCard key={e.ref} enemy={e} player={props.player} front={e.ref === front} />
        ))}
      </div>
    </div>
  );
}
