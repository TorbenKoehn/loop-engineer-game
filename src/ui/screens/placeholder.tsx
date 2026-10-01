// Stand-in for each run screen until its task lands: the mode plus its legal actions as buttons.
import type { StringKey } from '../../content/strings/en.ts';
import type { Action } from '../../run/actions.ts';
import { legalActions } from '../../run/apply.ts';
import { t } from '../i18n.ts';
import { dispatch, run, type UiMode } from '../store/run.ts';

function label(a: Action): string {
  if (a.t === 'travel') return t('ui.action.travel', { node: a.node });
  if (a.t === 'continue') return t('ui.action.continue');
  return t('ui.action.pick_prompt', { name: t(`prompt.${a.prompt}.name` as StringKey) });
}

export function Placeholder(props: { mode: UiMode }) {
  const actions = run.value ? legalActions(run.value) : [];
  return (
    <section class="placeholder">
      <p>{t('ui.screen.todo', { mode: props.mode })}</p>
      {actions.map((a) => (
        <button type="button" key={JSON.stringify(a)} onClick={() => dispatch(a)}>
          {label(a)}
        </button>
      ))}
    </section>
  );
}
