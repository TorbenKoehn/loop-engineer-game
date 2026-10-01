// System prompt pick (screens.md "Other screens", onboarding.md "First-run flow"): three
// quoted prompt cards with weight and effect line; picking one dispatches pickPrompt.
import type { Ref } from 'preact';
import { content } from '../../content/index.ts';
import type { StringKey } from '../../content/strings/en.ts';
import type { SystemPromptDef } from '../../content/types/harness.ts';
import { t } from '../i18n.ts';
import { dispatch, run } from '../store/run.ts';
import { arrowFocus, useInitialFocus } from './focus.ts';

interface CardProps {
  p: SystemPromptDef;
  max: number;
  focus?: Ref<HTMLButtonElement>;
}

function Card({ p, max, focus }: CardProps) {
  const str = (part: string) => t(`prompt.${p.id}.${part}` as StringKey);
  return (
    <button
      ref={focus}
      type="button"
      class="pcard"
      data-testid={`prompt-${p.id}`}
      onClick={() => dispatch({ t: 'pickPrompt', prompt: p.id })}
    >
      <span class="pcard__quote">{t('ui.prompt.quote', { text: str('flavour') })}</span>
      <span class="pcard__name">{str('name')}</span>
      <span class="pcard__weight">
        <span class="pcard__meter" aria-hidden="true">
          {'█'.repeat(p.weight)}
          {'░'.repeat(Math.max(0, max - p.weight))}
        </span>
        {t('ui.prompt.weight', { n: p.weight })}
      </span>
      <span class="pcard__line">{str('line')}</span>
    </button>
  );
}

export function PromptPick() {
  const pending = run.value?.pending;
  const ids = pending?.kind === 'promptOffer' ? pending.prompts : [];
  const offer = ids.flatMap((id) => content.prompts.filter((p) => p.id === id));
  const max = Math.max(0, ...offer.map((p) => p.weight));
  const focus = useInitialFocus<HTMLButtonElement>();
  return (
    <section class="screen" aria-labelledby="prompt-title">
      <header class="screen__head">
        <h2 id="prompt-title">
          <span aria-hidden="true">$ </span>
          {t('ui.prompt.title')}
        </h2>
        <p class="screen__hint">{t('ui.prompt.tip')}</p>
      </header>
      <fieldset class="cards" aria-labelledby="prompt-title" onKeyDown={arrowFocus}>
        {offer.map((p, i) => (
          <Card key={p.id} p={p} max={max} focus={i === 0 ? focus : undefined} />
        ))}
      </fieldset>
    </section>
  );
}
