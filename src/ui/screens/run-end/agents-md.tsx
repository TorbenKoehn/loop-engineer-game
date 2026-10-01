// AGENTS.md (screens.md "Other screens", meta-progression.md "AGENTS.md lessons"): a Markdown
// file with frontmatter and line numbers; the 3 offered lessons write a line, replace one when
// full, or skip. Every choice dispatches, then returns to the title.
import type { ComponentChildren, Ref } from 'preact';
import { content } from '../../../content/index.ts';
import type { StringKey } from '../../../content/strings/en.ts';
import { describeRule } from '../../../content/text.ts';
import type { Action } from '../../../run/actions.ts';
import { LESSON_CAP, lessonActions } from '../../../run/meta/lessons.ts';
import type { RunState } from '../../../run/state.ts';
import { t } from '../../i18n.ts';
import { closeRun, dispatch, run } from '../../store/run.ts';
import { arrowFocus, useInitialFocus } from '../focus.ts';

const lessonLine = (id: string) => t(`lesson.${id}.line` as StringKey);
const lessonRules = (id: string) =>
  content.lessons.find((l) => l.id === id)?.rules.map((r) => describeRule(r)) ?? [];

/** Dispatches a lesson choice; once the offer is closed the run is over. */
function choose(a: Action): void {
  dispatch(a);
  if (run.value?.pending === null) closeRun();
}

const Line = (p: { children?: ComponentChildren; cls?: string }) => (
  <li class={p.cls}>{p.children ?? ' '}</li>
);

function Front({ lines }: { lines: number }) {
  const key = (k: string, v: string) => (
    <Line>
      <span>
        <span class="md__key">{k}</span>: {v}
      </span>
    </Line>
  );
  return (
    <>
      <Line cls="md__fm">---</Line>
      {key(t('ui.agents.fm.title'), t('ui.agents.title'))}
      {key(t('ui.agents.fm.summary'), t('ui.agents.fm.summary_value'))}
      {key(t('ui.agents.fm.lines'), `${lines}/${LESSON_CAP}`)}
      {key(t('ui.agents.fm.cost'), t('ui.agents.fm.cost_value'))}
      <Line cls="md__fm">---</Line>
      <Line />
      <Line cls="md__h">{t('ui.agents.heading')}</Line>
    </>
  );
}

interface OfferProps {
  id: string;
  ix: number;
  actions: Action[];
  focus?: Ref<HTMLButtonElement>;
}

function Offer({ id, ix, actions, focus }: OfferProps) {
  return (
    <Line cls="md__offer">
      <span class="md__task" aria-hidden="true">
        {'- [ ] '}
      </span>
      <span class="md__lesson">
        <span data-testid={`lesson-${ix}`}>{lessonLine(id)}</span>
        {lessonRules(id).map((rule) => (
          <span key={rule} class="md__rule">
            {rule}
          </span>
        ))}
      </span>
      {actions.map((a, i) => {
        const at = a.t === 'pickLesson' ? a.replace : undefined;
        return (
          <button
            key={at ?? 'add'}
            ref={i === 0 ? focus : undefined}
            type="button"
            class="btn md__write"
            data-testid={`lesson-${ix}-write`}
            onClick={() => choose(a)}
          >
            {at === undefined ? t('ui.agents.write') : t('ui.agents.replace', { line: at + 1 })}
          </button>
        );
      })}
    </Line>
  );
}

export function AgentsMd({ r }: { r: RunState }) {
  const focus = useInitialFocus<HTMLButtonElement>();
  const lines = r.result?.lessons ?? [];
  const offered = r.pending?.kind === 'lessonOffer' ? r.pending.lessons : [];
  const actions = lessonActions(r);
  return (
    <section class="screen agents" aria-labelledby="agents-title">
      <fieldset
        class="md"
        aria-labelledby="agents-title"
        data-testid="agents-md"
        onKeyDown={arrowFocus}
      >
        <div class="md__bar">
          <h2 id="agents-title" class="md__tab">
            {t('ui.agents.title')}
          </h2>
          <button type="button" class="btn" onClick={() => choose({ t: 'skipLesson' })}>
            {t('ui.action.skip_lesson')}
          </button>
        </div>
        <ol class="md__lines">
          <Front lines={lines.length} />
          {lines.length === 0 && <Line cls="md__comment">{t('ui.agents.empty')}</Line>}
          {lines.map((id, i) => (
            <Line key={id} cls="md__kept">
              <span data-testid={`agents-line-${i}`}>{`- ${lessonLine(id)}`}</span>
            </Line>
          ))}
          <Line />
          <Line cls="md__comment">{t('ui.agents.offer')}</Line>
          {offered.map((id, ix) => (
            <Offer
              key={id}
              id={id}
              ix={ix}
              actions={actions.filter((a) => a.t === 'pickLesson' && a.ix === ix)}
              focus={ix === 0 ? focus : undefined}
            />
          ))}
        </ol>
      </fieldset>
    </section>
  );
}
