// Standup screen (screens.md "Other screens"): a chat thread in #standup with the speaker, at
// most 3 setup lines and reply buttons stating exact outcomes; a blocked reply is disabled and
// says why (events.md "Rules"). Dispatches chooseEvent.
import type { StringKey } from '../../../content/strings/en.ts';
import { eventChoices } from '../../../run/events/standup.ts';
import { t } from '../../i18n.ts';
import { dispatch, run } from '../../store/run.ts';
import { arrowFocus, useInitialFocus } from '../focus.ts';
import { blockText, outcomeLines } from './outcome-text.ts';

const MAX_LINES = 3;

export function StandupScreen() {
  const r = run.value;
  const focus = useInitialFocus<HTMLButtonElement>();
  if (r?.pending?.kind !== 'event') return null;
  const id = r.pending.event;
  const lines = t(`event.${id}.setup` as StringKey)
    .split('\n')
    .slice(0, MAX_LINES);
  const choices = eventChoices(r);
  const first = choices.findIndex((c) => c.blocked === null);
  return (
    <section class="screen" aria-labelledby="standup-title">
      <header class="screen__head">
        <h2 id="standup-title">
          <span aria-hidden="true"># </span>
          {t('ui.standup.channel')}
        </h2>
        <p class="screen__hint">{t('ui.standup.hint')}</p>
      </header>
      <article class="msg" aria-labelledby="standup-who">
        <p id="standup-who" class="msg__who" data-testid="standup-speaker">
          {t(`event.${id}.speaker` as StringKey)}
        </p>
        {lines.map((line) => (
          <p key={line} class="msg__line" data-testid="standup-line">
            {line}
          </p>
        ))}
      </article>
      <fieldset class="replies" aria-label={t('ui.standup.replies')} onKeyDown={arrowFocus}>
        {choices.map(({ choice, blocked }, ix) => (
          <button
            key={choice.id}
            ref={ix === first ? focus : undefined}
            type="button"
            class="reply"
            data-testid={`standup-reply-${ix}`}
            disabled={blocked !== null}
            onClick={() => dispatch({ t: 'chooseEvent', ix })}
          >
            <span class="reply__label">
              <span aria-hidden="true">{'> '}</span>
              {t(`event.${id}.choice.${choice.id}` as StringKey)}
              {choice.cost ? (
                <span class="tag">{t('ui.standup.cost', { n: choice.cost })}</span>
              ) : null}
            </span>
            {outcomeLines(choice.outcomes).map((line) => (
              <span key={line} class="reply__out">
                {line}
              </span>
            ))}
            {blocked && (
              <span class="reply__why" data-testid={`standup-why-${ix}`}>
                <span aria-hidden="true">{'✕ '}</span>
                {blockText(blocked, choice, r.agent.credits)}
              </span>
            )}
          </button>
        ))}
      </fieldset>
    </section>
  );
}
