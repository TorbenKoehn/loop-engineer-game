// The IDE shell around every screen: top bar, explorer, editor, terminal, status bar (screens.md).
import type { ComponentChildren } from 'preact';
import type { StringKey } from '../../content/strings/en.ts';
import { fmtNumber, t } from '../i18n.ts';
import { speed } from '../store/playback.ts';
import { ctxWindow, lastError, mode, run } from '../store/run.ts';

function TopBar() {
  const r = run.value;
  return (
    <header class="shell-top">
      <nav>{r && t('ui.shell.breadcrumb', { phase: r.phase, mode: mode.value })}</nav>
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

function Terminal() {
  const code = lastError.value;
  return (
    <section class="shell-terminal" aria-label={t('ui.shell.terminal')}>
      {code && <p role="alert">{t('ui.shell.error', { code })}</p>}
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
            {t('ui.status.ctx')} –/{fmtNumber(ctxWindow.value)}
          </span>
          <span>{t('ui.status.phase', { phase: r.phase })}</span>
        </>
      )}
      <span class="shell-status__end">{t('ui.status.speed', { speed: speed.value })}</span>
    </footer>
  );
}

export function Shell(props: { children: ComponentChildren }) {
  return (
    <div class="shell">
      <TopBar />
      <Explorer />
      <main class="shell-editor">{props.children}</main>
      <Terminal />
      <StatusBar />
    </div>
  );
}
