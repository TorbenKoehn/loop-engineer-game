// Discard screen: a gained item has no space, so the player drops one owned item or the new
// one (harness-loadout.md). Every legal ref from discardRefs is a button dispatching discardItem.
import { discardRefs } from '../../run/gain.ts';
import type { AgentState, ItemRef, OwnedItem } from '../../run/state.ts';
import { t } from '../i18n.ts';
import { dispatch, run } from '../store/run.ts';
import { arrowFocus, useInitialFocus } from './focus.ts';
import { itemName } from './item-text.ts';

/** The owned item a non-gained ref points at. */
function itemAt(agent: AgentState, ref: Exclude<ItemRef, { at: 'gained' }>): OwnedItem | undefined {
  if (ref.at === 'stash') return agent.stash[ref.ix];
  if (ref.at === 'tool') {
    const tool = agent.tools[ref.ix];
    return tool && { kind: 'tool', tool };
  }
  const id = (ref.at === 'skill' ? agent.skills : agent.memories)[ref.ix];
  return id === undefined ? undefined : ({ kind: ref.at, id } as OwnedItem);
}

/** Test id and button label of one discard choice. */
export function describeRef(agent: AgentState, ref: ItemRef, gained: string) {
  if (ref.at === 'gained') {
    return { id: 'discard-gained', label: t('ui.discard.gained', { item: gained }) };
  }
  const owned = itemAt(agent, ref);
  const where = t(`ui.discard.where.${ref.at}`, { n: ref.ix + 1 });
  const label = owned ? t('ui.discard.slot', { item: itemName(owned), where }) : where;
  return { id: `discard-${ref.at}-${ref.ix}`, label };
}

export function DiscardScreen() {
  const r = run.value;
  const focus = useInitialFocus<HTMLButtonElement>();
  if (r?.pending?.kind !== 'discard') return null;
  const gained = itemName(r.pending.item);
  return (
    <section class="screen" aria-labelledby="discard-title">
      <header class="screen__head">
        <h2 id="discard-title">
          <span aria-hidden="true">$ </span>
          {t('ui.discard.title')}
        </h2>
        <p class="screen__hint">{t('ui.discard.hint', { item: gained })}</p>
      </header>
      <fieldset class="cards cards--col" aria-label={t('ui.discard.items')} onKeyDown={arrowFocus}>
        {discardRefs(r.agent, r.pending.item.kind).map((ref, i) => {
          const { id, label } = describeRef(r.agent, ref, gained);
          return (
            <button
              key={id}
              ref={i === 0 ? focus : undefined}
              type="button"
              class="dcard"
              data-testid={id}
              onClick={() => dispatch({ t: 'discardItem', item: ref })}
            >
              <span class="dcard__mark" aria-hidden="true">
                {'rm '}
              </span>
              {label}
            </button>
          );
        })}
      </fieldset>
    </section>
  );
}
