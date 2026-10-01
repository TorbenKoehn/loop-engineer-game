// Stand-in for each run screen until its task lands: the mode plus its legal actions as buttons.
import type { StringKey } from '../../content/strings/en.ts';
import type { Action } from '../../run/actions.ts';
import { legalActions } from '../../run/apply.ts';
import { SKIP_CREDITS } from '../../run/nodes/rewards.ts';
import { t } from '../i18n.ts';
import { dispatch, run, type UiMode } from '../store/run.ts';

function label(a: Action): string {
  switch (a.t) {
    case 'travel':
      return t('ui.action.travel', { node: a.node });
    case 'continue':
      return t('ui.action.continue');
    case 'pickPrompt':
      return t('ui.action.pick_prompt', { name: t(`prompt.${a.prompt}.name` as StringKey) });
    case 'pickReward':
      return t('ui.action.pick_reward', { n: a.ix + 1 });
    case 'skipReward':
      return t('ui.action.skip_reward', { credits: SKIP_CREDITS });
    case 'discardItem':
      return t('ui.action.discard', { item: JSON.stringify(a.item) });
    case 'buy':
      return t('ui.action.buy', { n: a.ix + 1 });
    case 'sell':
      return t('ui.action.sell', { item: JSON.stringify(a.item) });
    case 'reroll':
      return t('ui.action.reroll');
    case 'leaveShop':
      return t('ui.action.leave_shop');
    case 'restHeal':
      return t('ui.action.rest_heal');
    case 'restUpgrade':
      return t('ui.action.rest_upgrade', { n: a.slot + 1 });
    case 'takeTreasure':
      return t('ui.action.take_treasure');
    case 'chooseEvent':
      return t('ui.action.choose_event', { n: a.ix + 1 });
    case 'abandon':
      return t('ui.action.abandon');
    case 'pickLesson':
      return a.replace === undefined
        ? t('ui.action.pick_lesson', { n: a.ix + 1 })
        : t('ui.action.pick_lesson_replace', { n: a.ix + 1, line: a.replace + 1 });
    case 'skipLesson':
      return t('ui.action.skip_lesson');
    default:
      // Build actions are not in legalActions; the build panel (E009) dispatches them.
      return t('ui.action.build', { action: JSON.stringify(a) });
  }
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
