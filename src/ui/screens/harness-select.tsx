// Harness select (screens.md "Other screens", harnesses.md "Harness select screen copy"):
// config-file cards as a native radio group, so arrow keys choose and Enter starts the run.
import type { Ref } from 'preact';
import { useState } from 'preact/hooks';
import { content } from '../../content/index.ts';
import type { StringKey } from '../../content/strings/en.ts';
import type { HarnessDef } from '../../content/types/harness.ts';
import type { HarnessId } from '../../content/types/ids.ts';
import { isUnlocked } from '../../run/new-run.ts';
import type { MetaView } from '../../run/state.ts';
import { fmtNumber, t } from '../i18n.ts';
import { meta } from '../store/meta.ts';
import { startRun } from '../store/run.ts';
import { choosingHarness, nextSeed } from '../store/ui.ts';
import { useInitialFocus } from './focus.ts';

/** Preselected and tagged on the first run (onboarding.md "First-run flow"). */
export const RECOMMENDED: HarnessId = 'ide_companion';

/** The unlocked harnesses and the preselected one; `recommended` only on the first run. */
export function harnessChoice(m: MetaView) {
  const pool = content.harnesses.filter((h) => isUnlocked(h.unlock, m.unlocked));
  const first = (m.run ?? 0) <= 1 && pool.some((h) => h.id === RECOMMENDED);
  return { pool, initial: first ? RECOMMENDED : pool[0]?.id, recommended: first };
}

const str = (h: HarnessDef, part: string) => t(`harness.${h.id}.${part}` as StringKey);

function Config(props: { h: HarnessDef }) {
  const { model: m, slots: s } = props.h;
  const rows: [StringKey, string][] = [
    ['ui.cfg.window', fmtNumber(m.window)],
    ['ui.cfg.speed', `${fmtNumber(m.speed)}%`],
    ['ui.cfg.accuracy', t(`ui.cfg.accuracy.${m.accuracy}`)],
    ['ui.cfg.trust', fmtNumber(m.trust)],
    ['ui.cfg.base', fmtNumber(m.baseWeight)],
    [
      'ui.cfg.slots',
      t('ui.cfg.slots_value', { tools: s.tools, skills: s.skills, memory: s.memory }),
    ],
    ['ui.cfg.tools', props.h.tools.map((id) => t(`tool.${id}.name` as StringKey)).join(' | ')],
    ['ui.cfg.skills', props.h.skills.map((id) => t(`skill.${id}.name` as StringKey)).join(', ')],
  ];
  return (
    <dl class="cfg">
      {rows.map(([key, value]) => (
        <div key={key}>
          <dt>{t(key)}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface CardProps {
  h: HarnessDef;
  checked: boolean;
  recommended: boolean;
  onPick: () => void;
  focus?: Ref<HTMLInputElement>;
}

function Card({ h, checked, recommended, onPick, focus }: CardProps) {
  return (
    <label class="hcard" data-testid={`harness-${h.id}`}>
      <input
        ref={focus}
        class="sr-only"
        type="radio"
        name="harness"
        value={h.id}
        checked={checked}
        onChange={onPick}
        aria-labelledby={`harness-${h.id}-name`}
        aria-describedby={`harness-${h.id}-trait`}
      />
      <span class="hcard__row hcard__file">
        <span>{t('ui.harness.file', { id: h.id })}</span>
        {recommended && <span class="tag tag--brand">★ {t('ui.harness.recommended')}</span>}
      </span>
      <span class="hcard__row">
        <strong class="hcard__name" id={`harness-${h.id}-name`}>
          {str(h, 'name')}
        </strong>
        <span class="tag">{t('ui.harness.difficulty', { level: str(h, 'difficulty') })}</span>
      </span>
      <span class="hcard__fantasy">{str(h, 'flavour')}</span>
      <Config h={h} />
      <span class="hcard__trait" id={`harness-${h.id}-trait`}>
        {str(h, 'line')}
      </span>
    </label>
  );
}

function back(): void {
  choosingHarness.value = false;
}

export function HarnessSelect() {
  const choice = harnessChoice(meta.value);
  const [pick, setPick] = useState(choice.initial);
  const focus = useInitialFocus<HTMLInputElement>();
  const onSubmit = (e: Event) => {
    e.preventDefault();
    if (pick) startRun({ seed: nextSeed.value, harness: pick, lint: [], tutorial: false });
  };
  return (
    <form
      class="screen"
      aria-labelledby="harness-title"
      onSubmit={onSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') back();
      }}
    >
      <header class="screen__head">
        <h2 id="harness-title">
          <span aria-hidden="true">$ </span>
          {t('ui.harness.title')}
        </h2>
        <p class="screen__hint">{t('ui.harness.hint')}</p>
      </header>
      <fieldset class="cards" aria-labelledby="harness-title">
        {choice.pool.map((h) => (
          <Card
            key={h.id}
            h={h}
            checked={h.id === pick}
            recommended={choice.recommended && h.id === RECOMMENDED}
            onPick={() => setPick(h.id)}
            focus={h.id === pick ? focus : undefined}
          />
        ))}
      </fieldset>
      <div class="screen__actions">
        <button type="button" class="btn" onClick={back}>
          {t('ui.harness.back')}
        </button>
        <button type="submit" class="btn btn--primary">
          {t('ui.harness.start')}
        </button>
      </div>
    </form>
  );
}
