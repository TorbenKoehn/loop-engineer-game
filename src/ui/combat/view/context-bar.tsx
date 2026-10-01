// The context bar (screens.md "Combat screen"): baseline, signal in the zone pattern, hatched
// noise per source, ticks at 25% and 70%, the policy marker, F/W and the zone label. Every
// number is the folded view; zones are never colour alone (pattern and label, zones.css).
import type { Ref } from '../../../sim/events.ts';
import { t } from '../../i18n.ts';
import { type CtxView, ZONES } from '../context.ts';
import type { Replay } from '../fight.ts';

/** Zone boundaries as % of W (context.md "Zones"). */
export const TICKS = [25, 70] as const;

/** One segment, sized by its tokens; the tooltip shows on hover and keyboard focus. */
function Seg(props: { cls: string; tokens: number; tip: string }) {
  if (props.tokens <= 0) return null;
  return (
    <span class={`ctx__seg ${props.cls}`} style={{ flexGrow: props.tokens }}>
      <span class="ctx__tip" role="tooltip">
        {props.tip}
      </span>
    </span>
  );
}

export interface ContextBarProps {
  readonly ctx: CtxView;
  /** Planned-compaction threshold in % of W; 0 means never. */
  readonly policy: number;
  /** Display names by enemy ref. */
  readonly labels: ReadonlyMap<Ref, string>;
}

export function ContextBar(props: ContextBarProps) {
  const { ctx, policy, labels } = props;
  const zone = ZONES[ctx.zone] ?? 'cold';
  const fill = ctx.S + ctx.N;
  const sourceName = (src: Ref) => labels.get(src) ?? t('ui.ctx.source_start');
  const policyText = t(ctx.policyOff ? 'ui.ctx.policy_off' : 'ui.ctx.policy', { n: policy });
  return (
    <section class="ctx" data-testid="ctx-bar" data-zone={zone} aria-label={t('ui.ctx.region')}>
      <span class="ctx__label">{t('ui.ctx.label')}</span>
      <div class="ctx__track">
        <Seg cls="ctx__seg--base" tokens={ctx.B} tip={t('ui.ctx.baseline', { n: ctx.B })} />
        <Seg
          cls={`ctx__seg--signal zone--${zone}`}
          tokens={ctx.S - ctx.B}
          tip={t('ui.ctx.signal', { n: ctx.S - ctx.B })}
        />
        {ctx.noise.map((s) => (
          <Seg
            key={s.src}
            cls="ctx__seg--noise zone--noise"
            tokens={s.n}
            tip={t('ui.ctx.source', { name: sourceName(s.src), n: s.n })}
          />
        ))}
        <span class="ctx__free" style={{ flexGrow: Math.max(0, ctx.W - fill) }} />
        {TICKS.map((n) => (
          <span key={n} class="ctx__tick" style={{ left: `${n}%` }} aria-hidden="true">
            {t('ui.ctx.tick', { n })}
          </span>
        ))}
        {policy > 0 && (
          <span
            class={`ctx__policy${ctx.policyOff ? ' is-off' : ''}`}
            style={{ left: `${policy}%` }}
            title={policyText}
          >
            ▲
          </span>
        )}
      </div>
      <span class="ctx__fill" data-testid="ctx-fill">
        {t('ui.ctx.fill', { f: fill, w: ctx.W })}
      </span>
      <span
        class={`zone zone--${zone}`}
        data-testid="ctx-zone"
        role="img"
        aria-label={t('ui.ctx.zone', { zone: t(`zone.${zone}`) })}
      />
      {ctx.policyOff && policy > 0 && (
        <span class="ctx__warn" data-testid="ctx-policy-off" role="status">
          ⚠ {policyText}
        </span>
      )}
    </section>
  );
}

/** The bar of a replay: follows the playback view. */
export function ReplayContextBar(props: { r: Replay }) {
  const { fight, pb } = props.r;
  return <ContextBar ctx={pb.view.value.ctx} policy={fight.input.policy} labels={fight.labels} />;
}
