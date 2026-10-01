// Dev combat sandbox (`?sandbox`, dev builds only, see src/main.tsx): pick a harness, a
// Phase-1 encounter and a seed; the fight lands in the run store and plays on CombatScreen.
import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { content } from '../../content/index.ts';
import type { Action } from '../../run/actions.ts';
import { legalActions } from '../../run/apply.ts';
import { fight } from '../../run/combat/combat.ts';
import { Screen } from '../app.tsx';
import { harnessName } from '../combat/names.ts';
import { t } from '../i18n.ts';
import { Shell } from '../shell/shell.tsx';
import { dispatch, run, startRun } from '../store/run.ts';

interface Setup {
  readonly harness: string;
  readonly encounter: string;
  readonly seed: string;
}

const setup = signal<Setup>({ harness: 'terminal_purist', encounter: 'p1e1', seed: '1' });
const encounters = content.encounters.filter((e) => e.phase === 1);

/** A fresh run (first prompt picked) fighting the chosen encounter at a row-1 node. */
function start(s: Setup): void {
  startRun({ seed: s.seed, harness: s.harness, lint: [], tutorial: false });
  if (run.value) dispatch(legalActions(run.value)[0] as Action);
  const state = run.value;
  if (!state) return;
  const node = { id: 'p1-r1-c0', row: 1, col: 0, type: 'task', encounter: s.encounter } as const;
  // Dev shortcut past dispatch: in a real run the map picks the encounter.
  run.value = fight(state, node);
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
        start(setup.value);
      }}
    >
      <label class="setup__field">
        <span class="setup__label">{t('ui.sandbox.harness')}</span>
        <select value={s.harness} onChange={field('harness')}>
          {content.harnesses.map((h) => (
            <option key={h.id} value={h.id}>
              {harnessName(h.id)}
            </option>
          ))}
        </select>
      </label>
      <label class="setup__field">
        <span class="setup__label">{t('ui.sandbox.encounter')}</span>
        <select value={s.encounter} onChange={field('encounter')}>
          {encounters.map((enc) => (
            <option key={enc.id} value={enc.id}>
              {enc.id} · {enc.pool}
            </option>
          ))}
        </select>
      </label>
      <label class="setup__field">
        <span class="setup__label">{t('ui.title.seed')}</span>
        <input type="text" value={s.seed} spellcheck={false} onInput={field('seed')} />
      </label>
      <button type="submit" class="btn btn--primary" data-testid="run">
        ▶ {t('ui.sandbox.run')}
      </button>
    </form>
  );
}

export function Sandbox() {
  useEffect(() => {
    if (!run.value) start(setup.value);
  }, []);
  return (
    <Shell>
      <SetupPanel />
      <Screen />
    </Shell>
  );
}
