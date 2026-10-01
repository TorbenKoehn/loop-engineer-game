// Package Registry screen (screens.md "Other screens"): 5 offers as `name@version` packages with
// price and sale tag, Reroll with its cost, sell from the build, leave. Dispatches
// buy / reroll / sell / leaveShop; a rejected sell of the last tool surfaces its reason here.
import type { StringKey } from '../../content/strings/en.ts';
import { ownedTool } from '../../run/gain.ts';
import { rerollCost, sellPrice } from '../../run/shop.ts';
import type { AgentState, ItemRef, OwnedItem, ShopOffer } from '../../run/state.ts';
import { fmtNumber, t } from '../i18n.ts';
import { dispatch, lastError, run } from '../store/run.ts';
import { arrowFocus, useInitialFocus } from './focus.ts';
import { itemName } from './item-text.ts';

/** `grep@2.0.0`: a tool already owned is offered as its next version. */
function packageId(agent: AgentState, o: ShopOffer): string {
  const version = o.kind === 'tool' ? (ownedTool(agent, o.id)?.version ?? 0) + 1 : 1;
  return `${o.id}@${version}.0.0`;
}

function Offer({ o, ix, agent, focus }: PackageProps) {
  const short = o.price - agent.credits;
  const why = o.sold ? t('ui.shop.sold') : short > 0 ? t('ui.shop.need', { n: short }) : null;
  return (
    <button
      ref={focus}
      type="button"
      class="pkg"
      data-testid={`shop-offer-${ix}`}
      disabled={why !== null}
      onClick={() => dispatch({ t: 'buy', ix })}
    >
      <span class="pkg__id">{packageId(agent, o)}</span>
      <span>{t(`${o.kind}.${o.id}.name` as StringKey)}</span>
      <span class="pkg__meta">
        <span class="tag">{t(`ui.reward.kind.${o.kind}`)}</span>
        <span class="tag">{t(`ui.reward.rarity.${o.rarity}`)}</span>
        {o.sale && <span class="tag tag--brand">{t('ui.shop.sale')}</span>}
      </span>
      <span class="pkg__price">{t('ui.shop.price', { n: fmtNumber(o.price) })}</span>
      {why && <span class="pkg__why">{why}</span>}
    </button>
  );
}

interface PackageProps {
  o: ShopOffer;
  ix: number;
  agent: AgentState;
  focus?: ReturnType<typeof useInitialFocus<HTMLButtonElement>>;
}

/** Everything the agent owns, as a sell ref and the item behind it. */
function owned(a: AgentState): { ref: Exclude<ItemRef, { at: 'gained' }>; item: OwnedItem }[] {
  return [
    ...a.tools.map((tool, ix) => ({
      ref: { at: 'tool', ix } as const,
      item: { kind: 'tool', tool } as const,
    })),
    ...a.skills.map((id, ix) => ({
      ref: { at: 'skill', ix } as const,
      item: { kind: 'skill', id } as const,
    })),
    ...a.memories.map((id, ix) => ({
      ref: { at: 'memory', ix } as const,
      item: { kind: 'memory', id } as const,
    })),
    ...a.stash.map((item, ix) => ({ ref: { at: 'stash', ix } as const, item })),
  ];
}

export function ShopScreen() {
  const r = run.value;
  const focus = useInitialFocus<HTMLButtonElement>();
  if (r?.pending?.kind !== 'shop') return null;
  const shop = r.pending;
  const credits = r.agent.credits;
  const cost = rerollCost(shop);
  return (
    <section class="screen" aria-labelledby="shop-title">
      <header class="screen__head">
        <h2 id="shop-title">
          <span aria-hidden="true">$ </span>
          {t('ui.shop.title')}
        </h2>
        <p class="screen__hint">{t('ui.shop.hint')}</p>
      </header>
      <p class="shop__credits" data-testid="shop-credits">
        {t('ui.shop.credits', { n: fmtNumber(credits) })}
      </p>
      <fieldset class="cards" aria-label={t('ui.shop.offers')} onKeyDown={arrowFocus}>
        {shop.offers.map((o, ix) => (
          <Offer
            key={`${o.kind}-${o.id}`}
            o={o}
            ix={ix}
            agent={r.agent}
            focus={ix === 0 ? focus : undefined}
          />
        ))}
      </fieldset>
      <div class="screen__actions">
        <button
          type="button"
          class="skip"
          data-testid="shop-reroll"
          disabled={credits < cost}
          onClick={() => dispatch({ t: 'reroll' })}
        >
          {t('ui.shop.reroll', { cost })}
        </button>
        <button
          type="button"
          class="skip"
          data-testid="shop-leave"
          onClick={() => dispatch({ t: 'leaveShop' })}
        >
          {t('ui.shop.leave')}
        </button>
      </div>
      <div class="shop__sell">
        <h3>{t('ui.shop.sell.title')}</h3>
        {lastError.value === 'lastTool' && (
          <p class="shop__err" role="alert" data-testid="shop-error">
            {t('ui.shop.err.last_tool')}
          </p>
        )}
        {owned(r.agent).map(({ ref, item }) => (
          <button
            key={`${ref.at}-${ref.ix}`}
            type="button"
            class="skip"
            data-testid={`shop-sell-${ref.at}-${ref.ix}`}
            onClick={() => dispatch({ t: 'sell', item: ref })}
          >
            {t('ui.shop.sell.item', { item: itemName(item), n: sellPrice(r, item) })}
          </button>
        ))}
      </div>
    </section>
  );
}
