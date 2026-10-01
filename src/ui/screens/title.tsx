// Title (screens.md "Other screens", art-direction.md "Logo"): the `$ loop-engineer` prompt,
// the block-letter logo, seed and New run. Continue, Daily, History and Codex come later.
import { t } from '../i18n.ts';
import { choosingHarness, nextSeed } from '../store/ui.ts';
import { useInitialFocus } from './focus.ts';

const LOGO = [
  '██          ████      ████    ██████',
  '██        ██    ██  ██    ██  ██    ██',
  '██        ██    ██  ██    ██  ██████',
  '██        ██    ██  ██    ██  ██',
  '████████    ████      ████    ██',
  '',
  '████████  ██    ██    ██████  ██████  ██    ██  ████████  ████████  ██████',
  '██        ████  ██  ██          ██    ████  ██  ██        ██        ██    ██',
  '██████    ██  ████  ██  ████    ██    ██  ████  ██████    ██████    ██████',
  '██        ██    ██  ██    ██    ██    ██    ██  ██        ██        ██  ██',
  '████████  ██    ██    ██████  ██████  ██    ██  ████████  ████████  ██    ██',
].join('\n');

function onSubmit(e: Event): void {
  e.preventDefault();
  choosingHarness.value = true;
}

export function Title() {
  const start = useInitialFocus<HTMLButtonElement>();
  return (
    <form class="title" onSubmit={onSubmit}>
      <p class="title__prompt">{t('ui.title.prompt')}</p>
      <pre class="title__logo" aria-hidden="true">
        {LOGO} <span class="cursor">█</span> ↻
      </pre>
      <h1 class="sr-only">{t('ui.title.name')}</h1>
      <p class="title__tagline">{t('ui.title.tagline')}</p>
      <div class="title__menu">
        <button ref={start} type="submit" class="btn btn--primary">
          {t('ui.title.new_run')}
        </button>
        <label class="title__seed">
          <span>{t('ui.title.seed')}</span>
          <input
            value={nextSeed.value}
            spellcheck={false}
            onInput={(e) => {
              nextSeed.value = e.currentTarget.value;
            }}
          />
        </label>
        {import.meta.env.DEV && <a href="?sandbox">{t('ui.title.sandbox')}</a>}
      </div>
    </form>
  );
}
