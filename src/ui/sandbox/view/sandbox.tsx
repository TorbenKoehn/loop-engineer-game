// Dev combat sandbox page (T098): pick a harness and a Phase-1 encounter, run the fight
// once through resolveCombat and replay its event log. Replaced by T055/T059.
import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { GAME_TITLE } from '../../../content/index.ts';
import { SIM_VERSION } from '../../../sim/index.ts';
import type { SandboxSetup } from '../adapter.ts';
import { harnessName } from '../names.ts';
import { createPlayer, type Player, rafClock, runFight, type Speed } from '../player.ts';
import { Arena } from './arena.tsx';
import { CombatLog } from './combat-log.tsx';
import { SetupPanel } from './setup-panel.tsx';
import { ToolRow } from './tool-row.tsx';
import { ResultStrip, Transport } from './transport.tsx';

const setup = signal<SandboxSetup>({ harness: 'terminal_purist', encounter: 'p1e1', seed: '1' });
const player = signal<Player | null>(null);
/** Speed persists between fights (screens.md "Controls"). */
const speed = signal<Speed>(1);

function run(): void {
  player.value?.dispose();
  // Keys are handled on the document, so don't leave focus on the button that was clicked.
  if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur();
  const next = createPlayer(runFight(setup.value), rafClock, speed.value);
  player.value = next;
  next.play();
}

function setSpeed(s: Speed): void {
  speed.value = s;
  if (player.value) player.value.speed.value = s;
}

const SPEED_KEYS: Readonly<Record<string, Speed>> = { '1': 1, '2': 2, '4': 4 };

/** Space toggles playback, 1/2/4 set the speed; ignored while typing in a field. */
function onKey(e: KeyboardEvent): void {
  const p = player.value;
  if (!p || (e.target instanceof HTMLElement && e.target.closest('input, select, textarea')))
    return;
  const s = SPEED_KEYS[e.key];
  if (s) setSpeed(s);
  if (e.key !== ' ') return;
  e.preventDefault();
  if (p.playing.value) p.pause();
  else p.play();
}

function Header() {
  return (
    <header class="top">
      <h1 class="logo">
        {GAME_TITLE.toUpperCase()}
        <span class="cursor" aria-hidden="true">
          █
        </span>
        <span class="logo__loop" aria-hidden="true">
          ↻
        </span>
      </h1>
      <p class="top__tag">
        combat sandbox <span class="sep">·</span> dev build <span class="sep">·</span> space pauses,
        1/2/4 set speed
      </p>
    </header>
  );
}

function StatusBar(props: { player: Player | null }) {
  const p = props.player;
  const end = p?.view.value.end;
  const state = end ? `${end.outcome} (${end.reason})` : p?.playing.value ? 'replaying' : 'paused';
  return (
    <footer class="statusbar">
      <span>● {harnessName(p?.fight.setup.harness ?? setup.value.harness)}</span>
      <span>{p ? `${p.fight.setup.encounter} · seed ${p.fight.setup.seed}` : 'no fight yet'}</span>
      <span>{p ? state : ''}</span>
      <span class="statusbar__right">
        {speed.value}x · sim v{SIM_VERSION}
      </span>
    </footer>
  );
}

export function Sandbox() {
  useEffect(() => {
    if (!player.value) run();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const p = player.value;
  return (
    <div class="sandbox">
      <Header />
      <SetupPanel setup={setup} onRun={run} />
      {p && (
        <main class="stage">
          <section class="panel arena" aria-label="Fight">
            <Transport player={p} onSpeed={setSpeed} />
            <Arena player={p} />
            <ToolRow player={p} />
            <ResultStrip player={p} />
          </section>
          <CombatLog player={p} />
        </main>
      )}
      <StatusBar player={p} />
    </div>
  );
}
