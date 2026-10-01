// Reward screen (screens.md "Other screens"): "PR ready to merge" with 3 diff-style cards,
// Skip (+6) and a credits receipt with the interest line. Dispatches pickReward / skipReward.
import type { Ref } from 'preact';
import type { StringKey } from '../../content/strings/en.ts';
import { ownedTool } from '../../run/gain.ts';
import { SKIP_CREDITS } from '../../run/rewards.ts';
import type { RewardCard, RewardPending } from '../../run/state.ts';
import { fmtNumber, t } from '../i18n.ts';
import { dispatch, run } from '../store/run.ts';
import { arrowFocus, useInitialFocus } from './focus.ts';
import { itemLines, nextVersion } from './item-text.ts';

interface CardProps {
  card: RewardCard;
  ix: 0 | 1 | 2;
  from: 1 | 2 | 3 | null;
  focus?: Ref<HTMLButtonElement>;
}

/** A diff hunk: removed lines of the owned version, then the added lines. */
function Card({ card, ix, from, focus }: CardProps) {
  const to = nextVersion(from);
  const added = itemLines(card.kind, card.id, to);
  const removed = from === null ? [] : itemLines(card.kind, card.id, from);
  const version = (n: number) => t('ui.item.version', { n });
  return (
    <button
      ref={focus}
      type="button"
      class="rcard"
      data-testid={`reward-${ix}`}
      onClick={() => dispatch({ t: 'pickReward', ix })}
    >
      <span class="rcard__file">
        {t('ui.reward.file', { kind: t(`ui.reward.kind.${card.kind}`) })}
      </span>
      <span class="rcard__row">
        <span class="rcard__name">{t(`${card.kind}.${card.id}.name` as StringKey)}</span>
        <span class="tag">{t(`ui.reward.rarity.${card.rarity}`)}</span>
      </span>
      <span class="rcard__ver" data-testid={`reward-${ix}-version`}>
        {from === null
          ? t('ui.reward.new')
          : t('ui.reward.upgrade', { from: version(from), to: version(to) })}
      </span>
      <span class="diff">
        {removed.map((line) => (
          <span key={`-${line}`} class="diff__del">
            <span aria-hidden="true">- </span>
            {line}
          </span>
        ))}
        {added.map((line) => (
          <span key={`+${line}`} class="diff__add">
            <span aria-hidden="true">+ </span>
            {line}
          </span>
        ))}
        <span class="diff__ctx">{t(`${card.kind}.${card.id}.flavour` as StringKey)}</span>
      </span>
    </button>
  );
}

function Receipt({ p }: { p: RewardPending }) {
  const row = (key: StringKey, n: number, id: string) => (
    <div>
      <dt>{t(key)}</dt>
      <dd data-testid={id}>+{fmtNumber(n)}</dd>
    </div>
  );
  return (
    <dl class="receipt" aria-label={t('ui.reward.receipt')} data-testid="receipt">
      {row('ui.reward.receipt.reward', p.credits, 'receipt-reward')}
      {row('ui.reward.receipt.interest', p.interest, 'receipt-interest')}
      {row('ui.reward.receipt.total', p.credits + p.interest, 'receipt-total')}
    </dl>
  );
}

export function RewardScreen() {
  const r = run.value;
  const focus = useInitialFocus<HTMLButtonElement>();
  if (r?.pending?.kind !== 'reward') return null;
  const p = r.pending;
  return (
    <section class="screen" aria-labelledby="reward-title">
      <header class="screen__head">
        <h2 id="reward-title">
          <span aria-hidden="true">$ </span>
          {t('ui.reward.title')}
        </h2>
        <p class="screen__hint">{t('ui.reward.hint')}</p>
      </header>
      <fieldset class="cards" aria-label={t('ui.reward.cards')} onKeyDown={arrowFocus}>
        {p.cards.map((card, i) => {
          const ix = i as 0 | 1 | 2;
          const owned = card.kind === 'tool' ? ownedTool(r.agent, card.id)?.version : undefined;
          return (
            <Card
              key={`${card.kind}-${card.id}`}
              card={card}
              ix={ix}
              from={owned ?? null}
              focus={i === 0 ? focus : undefined}
            />
          );
        })}
      </fieldset>
      <div class="screen__actions">
        <button type="button" class="skip" onClick={() => dispatch({ t: 'skipReward' })}>
          {t('ui.reward.skip', { credits: SKIP_CREDITS })}
        </button>
      </div>
      <Receipt p={p} />
    </section>
  );
}
