// Title screen walking skeleton: seed field and New run (default harness until E009).
import { t } from '../i18n.ts';
import { startRun } from '../store/run.ts';
import { nextSeed } from '../store/ui.ts';

function onSubmit(e: Event): void {
  e.preventDefault();
  startRun({ seed: nextSeed.value, harness: 'terminal_purist', lint: [], tutorial: false });
}

export function Title() {
  return (
    <form class="title" onSubmit={onSubmit}>
      <h1>{t('ui.title.name')}</h1>
      <label>
        {t('ui.title.seed')}
        <input
          value={nextSeed.value}
          onInput={(e) => {
            nextSeed.value = e.currentTarget.value;
          }}
        />
      </label>
      <button type="submit">{t('ui.title.new_run')}</button>
      {import.meta.env.DEV && <a href="?sandbox">{t('ui.title.sandbox')}</a>}
    </form>
  );
}
