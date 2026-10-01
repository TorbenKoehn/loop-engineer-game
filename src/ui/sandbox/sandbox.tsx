// Dev combat sandbox (T098): pick a harness, a Phase-1 encounter and a seed, then replay the
// fight with the combat view components on createPlayback. T101 rewrites it around the store.
import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { content, GAME_TITLE } from '../../content/index.ts';
import type { Action } from '../../run/actions.ts';
import { apply, legalActions } from '../../run/apply.ts';
import { combatInput } from '../../run/combat.ts';
import { newRun } from '../../run/new-run.ts';
import { loadFight, type Replay } from '../combat/fight.ts';
import { harnessName } from '../combat/names.ts';
import { createPlayback, rafClock } from '../combat/playback.ts';
import { Arena } from '../combat/view/arena.tsx';
import { ToolRow } from '../combat/view/tool-row.tsx';
import { ResultStrip, Transport } from '../combat/view/transport.tsx';
import { meta } from '../store/meta.ts';
import { speed } from '../store/playback.ts';

interface Setup {
  readonly harness: string;
  readonly encounter: string;
  readonly seed: string;
}

const setup = signal<Setup>({ harness: 'terminal_purist', encounter: 'p1e1', seed: '1' });
const replay = signal<Replay | null>(null);
const encounters = content.encounters.filter((e) => e.phase === 1);

/** Fight input from a fresh run (first prompt picked) at a row-1 node with the chosen encounter. */
function start(s: Setup): Replay {
  const run = newRun({ seed: s.seed, harness: s.harness, lint: [], tutorial: false }, meta.value);
  const res = apply(run, legalActions(run)[0] as Action);
  if (!res.ok) throw new Error(`sandbox: ${res.error}`);
  const node = { id: 'p1-r1-c0', row: 1, col: 0, type: 'task', encounter: s.encounter } as const;
  const fight = loadFight(combatInput(res.state, node), s.harness);
  return {
    fight,
    pb: createPlayback({ events: fight.events, start: fight.start, clock: rafClock, speed }),
  };
}

function run(): void {
  replay.value?.pb.dispose();
  replay.value = start(setup.value);
}

const field = (key: keyof Setup) => (e: { currentTarget: { value: string } }) => {
  setup.value = { ...setup.value, [key]: e.currentTarget.value };
};

function SetupPanel() {
  const s = setup.value;
  return (
    <form
      class="setup panel"
      onSubmit={(e) => {
        e.preventDefault();
        run();
      }}
    >
      <label class="setup__field">
        <span class="setup__label">harness</span>
        <select value={s.harness} onChange={field('harness')}>
          {content.harnesses.map((h) => (
            <option key={h.id} value={h.id}>
              {harnessName(h.id)}
            </option>
          ))}
        </select>
      </label>
      <label class="setup__field">
        <span class="setup__label">encounter · phase 1</span>
        <select value={s.encounter} onChange={field('encounter')}>
          {encounters.map((enc) => (
            <option key={enc.id} value={enc.id}>
              {enc.id} · {enc.pool}
            </option>
          ))}
        </select>
      </label>
      <label class="setup__field">
        <span class="setup__label">seed</span>
        <input type="text" value={s.seed} spellcheck={false} onInput={field('seed')} />
      </label>
      <button type="submit" class="btn btn--primary" data-testid="run">
        ▶ Run fight
      </button>
    </form>
  );
}

export function Sandbox() {
  useEffect(() => {
    if (!replay.value) run();
  }, []);
  const r = replay.value;
  return (
    <div class="sandbox">
      <header class="top">
        <h1 class="logo">{GAME_TITLE.toUpperCase()}</h1>
        <p class="top__tag">combat sandbox · dev build</p>
      </header>
      <SetupPanel />
      {r && (
        <main class="stage">
          <section class="panel arena" aria-label="Fight">
            <Transport r={r} />
            <Arena r={r} />
            <ToolRow r={r} />
            <ResultStrip r={r} />
          </section>
        </main>
      )}
    </div>
  );
}
