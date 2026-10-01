// The IDE shell around every screen: top bar, explorer, editor, terminal, status bar (screens.md).
import type { ComponentChildren } from 'preact';
import type { StringKey } from '../../content/strings/en.ts';
import type { RunState } from '../../run/state.ts';
import { CombatLog } from '../combat/log/log.tsx';
import { fmtNumber, t } from '../i18n.ts';
import { ctxLive, replayLive, speed } from '../store/playback.ts';
import { ctxWindow, lastError, run } from '../store/run.ts';

/** `phase-1/implement › row 3` (screens.md "Shell layout"); the row of the current node. */
function Breadcrumb({ r }: { r: RunState }) {
  const node = r.map.nodes.find((n) => n.id === r.map.current);
  const name = t(`ui.phase.${r.phase}` as StringKey);
  return (
    <nav class="crumbs" aria-label={t('ui.shell.location')}>
      <span>{t('ui.shell.breadcrumb', { phase: r.phase, name })}</span>
      {node && (
        <>
          <span class="crumbs__sep" aria-hidden="true">
            {' › '}
          </span>
          <span class="crumbs__row">
            {node.type === 'release' ? t('ui.shell.boss') : t('ui.shell.row', { row: node.row })}
          </span>
        </>
      )}
    </nav>
  );
}

function TopBar() {
  const r = run.value;
  return (
    <header class="shell-top">
      {r ? <Breadcrumb r={r} /> : <nav />}
      <span>{r && t('ui.shell.seed', { seed: r.setup.seed })}</span>
    </header>
  );
}

function Explorer() {
  const tools = run.value?.agent.tools ?? [];
  return (
    <aside class="shell-explorer" aria-label={t('ui.shell.explorer')}>
      <h2>{t('ui.shell.explorer')}</h2>
      <ul>
        {tools.map((tool) => (
          <li key={tool.id}>{t(`tool.${tool.id}.name` as StringKey)}</li>
        ))}
      </ul>
    </aside>
  );
}

/** Errors, and the combat log while a fight is open (screens.md "Shell layout"). */
function Terminal() {
  const code = lastError.value;
  const r = replayLive.value;
  return (
    <section
      class={`shell-terminal${r ? ' shell-terminal--log' : ''}`}
      aria-label={t('ui.shell.terminal')}
    >
      {code && <p role="alert">{t('ui.shell.error', { code })}</p>}
      {r && <CombatLog r={r} />}
    </section>
  );
}

function StatusBar() {
  const r = run.value;
  return (
    <footer class="shell-status" data-testid="status-bar">
      {r && (
        <>
          <span>
            ♥ {t('ui.status.trust')} {fmtNumber(r.agent.trust)}/{fmtNumber(r.agent.maxTrust)}
          </span>
          <span title={t('ui.status.credits')}>$ {fmtNumber(r.agent.credits)}</span>
          <span>
            {t('ui.status.ctx')}{' '}
            {ctxLive.value ? fmtNumber(ctxLive.value.S + ctxLive.value.N) : '–'}/
            {fmtNumber(ctxLive.value?.W ?? ctxWindow.value)}
          </span>
          <span>{t('ui.status.phase', { phase: r.phase })}</span>
        </>
      )}
      <span class="shell-status__end" data-testid="speed">
        {speed.value === 'skip'
          ? `⏭ ${t('ui.combat.skip')}`
          : t('ui.status.speed', { speed: speed.value })}
      </span>
    </footer>
  );
}

export function Shell(props: { children: ComponentChildren }) {
  return (
    <div class="shell">
      <TopBar />
      <Explorer />
      <main class="shell-editor">{props.children}</main>
      {run.value && <Terminal />}
      <StatusBar />
    </div>
  );
}
