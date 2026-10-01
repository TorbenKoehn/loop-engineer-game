// Deadline clock, playback controls and the result strip shown after the fight.
import { useEffect, useRef } from 'preact/hooks';
import { fmtNumber, fmtSeconds, formatClock, t, tPlural } from '../../i18n.ts';
import { dispatch } from '../../store/run.ts';
import type { Replay } from '../fight.ts';
import type { Speed } from '../playback.ts';
import { clockTone } from '../timeline.ts';
import { Bar } from './bits.tsx';

const SPEEDS: readonly Exclude<Speed, 'skip'>[] = [1, 2, 4];
/** Never colour alone (art-direction.md): the tone also gets a glyph. */
const TONE_GLYPH = { ok: '', warn: '⧗', over: '!' } as const;

export function Transport(props: { r: Replay }) {
  const { pb } = props.r;
  const time = pb.simT.value;
  const deadline = props.r.fight.input.encounter.deadlineMs;
  const tone = clockTone(time, deadline);
  const press = (s: Speed) => () => {
    pb.speed.value = s;
    pb.paused.value = false;
  };
  return (
    <div class="transport">
      <div class="clock">
        <span class={`clock__now is-${tone}`} data-testid="clock" data-tone={tone}>
          {formatClock(time)}
          <span class="clock__glyph">{TONE_GLYPH[tone]}</span>
        </span>
        <span class="clock__of">{t('ui.combat.deadline', { time: formatClock(deadline) })}</span>
        <Bar value={time} max={deadline} tone="clock" />
      </div>
      <fieldset class="controls" aria-label={t('ui.combat.playback')}>
        <button
          type="button"
          class="btn"
          aria-pressed={pb.paused.value}
          onClick={() => {
            pb.paused.value = !pb.paused.value;
          }}
        >
          ⏸ {t('ui.combat.pause')}
        </button>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            class="btn"
            aria-pressed={pb.speed.value === s}
            onClick={press(s)}
          >
            {t('ui.status.speed', { speed: s })}
          </button>
        ))}
        <button
          type="button"
          class="btn"
          aria-pressed={pb.speed.value === 'skip'}
          onClick={press('skip')}
        >
          ⏭ {t('ui.combat.skip')}
        </button>
      </fieldset>
    </div>
  );
}

/** Takes focus when the result strip appears, so Enter continues. */
function Continue() {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => button.current?.focus(), []);
  return (
    <button
      ref={button}
      type="button"
      class="btn btn--primary result__continue"
      onClick={() => dispatch({ t: 'continue' })}
    >
      {t('ui.action.continue')}
    </button>
  );
}

export function ResultStrip(props: { r: Replay }) {
  const { fight, pb } = props.r;
  const end = pb.view.value.end;
  if (!end) return null;
  const delta = end.trust - fight.input.agent.trust;
  const signed = `${delta > 0 ? '+' : ''}${fmtNumber(delta)}`;
  return (
    <div class={`result result--${end.outcome} result--${end.reason}`} data-testid="result">
      <span class="result__title">
        {t(`ui.combat.result.${end.reason}`, { time: fmtSeconds(end.t) })}
      </span>
      <span class="result__detail">
        {t('ui.combat.trust_delta', { delta: signed })} ·{' '}
        {tPlural('ui.combat.compactions', fight.compactions)}
      </span>
      <Continue />
    </div>
  );
}
