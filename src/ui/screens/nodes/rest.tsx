// Idle Cycle screen (screens.md "Other screens"): `$ sleep 30` with a progress bar, then Heal or
// Upgrade through a tool picker. Amounts come from reducer previews, so the screen shows exactly
// what restHeal / restUpgrade will do.
import type { StringKey } from '../../../content/strings/en.ts';
import { t } from '../../i18n.ts';
import { dispatch, preview, run } from '../../store/run.ts';
import { arrowFocus, useInitialFocus } from '../focus.ts';
import { itemLines, nextVersion } from '../item-text.ts';

export function RestScreen() {
  const r = run.value;
  const focus = useInitialFocus<HTMLButtonElement>();
  if (r?.mode !== 'rest') return null;
  const { trust } = r.agent;
  const healed = preview({ t: 'restHeal' })?.agent.trust ?? trust;
  const version = (n: number) => t('ui.item.version', { n });
  return (
    <section class="screen" aria-labelledby="rest-title">
      <header class="screen__head">
        <h2 id="rest-title">
          <span aria-hidden="true">$ </span>
          {t('ui.rest.title')}
        </h2>
        <p class="screen__hint">{t('ui.rest.hint')}</p>
      </header>
      <div class="sleep" aria-hidden="true">
        <span class="sleep__bar" />
      </div>
      <fieldset class="cards" aria-label={t('ui.rest.options')} onKeyDown={arrowFocus}>
        <button
          ref={focus}
          type="button"
          class="rcard"
          data-testid="rest-heal"
          onClick={() => dispatch({ t: 'restHeal' })}
        >
          <span class="rcard__name">{t('ui.rest.heal')}</span>
          <span class="diff__add">
            <span aria-hidden="true">+ </span>
            {t('ui.rest.heal_line', { n: healed - trust })}
          </span>
          <span class="rcard__ver">{t('ui.rest.trust', { from: trust, to: healed })}</span>
        </button>
        <fieldset class="picker">
          <legend class="rcard__name">{t('ui.rest.upgrade')}</legend>
          {r.agent.tools.map((tool, slot) => {
            const to = nextVersion(tool.version);
            const maxed = preview({ t: 'restUpgrade', slot }) === null;
            return (
              <button
                key={tool.id}
                type="button"
                class="skip pick"
                data-testid={`rest-upgrade-${slot}`}
                disabled={maxed}
                onClick={() => dispatch({ t: 'restUpgrade', slot })}
              >
                <span>
                  {t(`tool.${tool.id}.name` as StringKey)}{' '}
                  <span class="rcard__ver">
                    {maxed
                      ? t('ui.rest.maxed')
                      : t('ui.reward.upgrade', { from: version(tool.version), to: version(to) })}
                  </span>
                </span>
                {!maxed && (
                  <span class="diff__add">{itemLines('tool', tool.id, to).join(' ')}</span>
                )}
              </button>
            );
          })}
        </fieldset>
      </fieldset>
    </section>
  );
}
