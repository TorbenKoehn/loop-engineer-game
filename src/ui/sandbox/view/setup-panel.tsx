// Fight setup: harness cards, Phase-1 encounter picker, seed and the Run button.
import type { Signal } from '@preact/signals';
import type { EncounterDef } from '../../../content/types/index.ts';
import { type SandboxSetup, sandboxEncounters, sandboxHarnesses } from '../adapter.ts';
import { enemyName, harnessFlavour, harnessLine, harnessName } from '../names.ts';

const POOLS: readonly EncounterDef['pool'][] = ['easy', 'hard', 'elite', 'boss'];

/** `Typo ×2, Scope Creep` */
function rosterLabel(enc: EncounterDef): string {
  const counts = new Map<string, number>();
  for (const id of enc.enemies) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts]
    .map(([id, n]) => (n > 1 ? `${enemyName(id)} ×${n}` : enemyName(id)))
    .join(', ');
}

function HarnessPicker(props: { setup: Signal<SandboxSetup> }) {
  const { setup } = props;
  return (
    <fieldset class="harnesses">
      <legend class="setup__label">harness</legend>
      {sandboxHarnesses.map((h) => {
        const selected = setup.value.harness === h.id;
        const { model } = h;
        return (
          <label key={h.id} class={`harness${selected ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name="harness"
              value={h.id}
              checked={selected}
              onChange={() => {
                setup.value = { ...setup.value, harness: h.id };
              }}
            />
            <span class="harness__name">{harnessName(h.id)}</span>
            <span class="harness__flavour">{harnessFlavour(h.id)}</span>
            <span class="harness__stats">
              ♥ {model.trust} · speed {model.speed}% · window {model.window}
            </span>
            <span class="harness__trait">{harnessLine(h.id)}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

export function SetupPanel(props: { setup: Signal<SandboxSetup>; onRun: () => void }) {
  const { setup } = props;
  return (
    <form
      class="setup panel"
      onSubmit={(e) => {
        e.preventDefault();
        props.onRun();
      }}
    >
      <HarnessPicker setup={setup} />
      <div class="setup__side">
        <label class="setup__field">
          <span class="setup__label">encounter · phase 1</span>
          <select
            value={setup.value.encounter}
            onChange={(e) => {
              setup.value = { ...setup.value, encounter: e.currentTarget.value };
            }}
          >
            {POOLS.map((pool) => (
              <optgroup key={pool} label={pool}>
                {sandboxEncounters
                  .filter((enc) => enc.pool === pool)
                  .map((enc) => (
                    <option key={enc.id} value={enc.id}>
                      {enc.id} · {rosterLabel(enc)}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label class="setup__field">
          <span class="setup__label">seed</span>
          <input
            type="text"
            value={setup.value.seed}
            spellcheck={false}
            onInput={(e) => {
              setup.value = { ...setup.value, seed: e.currentTarget.value };
            }}
          />
        </label>
        <button type="submit" class="btn btn--primary" data-testid="run">
          ▶ Run fight
        </button>
      </div>
    </form>
  );
}
