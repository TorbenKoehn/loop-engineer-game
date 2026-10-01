// Run end (screens.md "Other screens", onboarding.md "Why did I lose?"): `^C` or
// "Merged to main!", cause, top-3 damage sources and zone time as text bars, compactions
// and one hint; then the AGENTS.md lesson offer, or the title after an abandon.
import { useMemo, useState } from 'preact/hooks';
import type { RunState } from '../../../run/state.ts';
import { DEADLINE } from '../../../run/stats.ts';
import { resolveCombat } from '../../../sim/index.ts';
import { enemyName } from '../../combat/names.ts';
import { fmtNumber, fmtSeconds, t } from '../../i18n.ts';
import { closeRun, run } from '../../store/run.ts';
import { useInitialFocus } from '../focus.ts';
import { AgentsMd } from './agents-md.tsx';
import { type Summary, summarize } from './summary.ts';

const BAR = 24;
/** Zone fill glyphs from art-direction.md "Zone encoding". */
const ZONES = [
  ['cold', '░'],
  ['focused', '█'],
  ['rot', '▒'],
] as const;

const sourceName = (src: string) => (src === DEADLINE ? t('ui.runend.deadline') : enemyName(src));

function causeText(s: Summary): string {
  if (s.outcome !== 'ctrlc') return t(`ui.runend.cause.${s.outcome}`);
  return s.cause ? sourceName(s.cause) : t('ui.runend.cause.unknown');
}

/** A text-bar line: `glyph` for the share `v` of `max` over BAR cells, at least one if v > 0. */
function row(id: string, label: string, [v, max, glyph]: [number, number, string], value: string) {
  const n = v > 0 && max > 0 ? Math.max(1, Math.round((v / max) * BAR)) : 0;
  return (
    <li key={id} class={`tbar tbar--${id}`} data-testid={`runend-${id}`}>
      <span class="tbar__label">{label}</span>
      <span class="tbar__cells" aria-hidden="true">
        <span class="tbar__fill">{glyph.repeat(n)}</span>
        {'·'.repeat(BAR - n)}
      </span>
      <span class="tbar__value">{value}</span>
    </li>
  );
}

function Bars({ s }: { s: Summary }) {
  const max = s.top[0]?.dmg ?? 0;
  const total = s.zoneMs.reduce((a, b) => a + b, 0);
  return (
    <div class="runend__grid">
      <section aria-labelledby="runend-damage">
        <h3 id="runend-damage">{t('ui.runend.damage')}</h3>
        {s.top.length === 0 && <p class="runend__muted">{t('ui.runend.no_damage')}</p>}
        <ol class="tbars" data-testid="runend-damage">
          {s.top.map(({ src, dmg }) =>
            row(`src-${src}`, sourceName(src), [dmg, max, '█'], fmtNumber(dmg)),
          )}
        </ol>
      </section>
      <section aria-labelledby="runend-zones">
        <h3 id="runend-zones">{t('ui.runend.zones')}</h3>
        <ul class="tbars" data-testid="runend-zones">
          {ZONES.map(([zone, glyph], i) => {
            const ms = s.zoneMs[i] ?? 0;
            return row(zone, t(`zone.${zone}`), [ms, total, glyph], fmtSeconds(ms));
          })}
        </ul>
      </section>
    </div>
  );
}

function Facts({ r, s }: { r: RunState; s: Summary }) {
  const fact = (key: 'cause' | 'cleared' | 'compactions', value: string) => (
    <div>
      <dt>{t(`ui.runend.${key}`)}</dt>
      <dd data-testid={`runend-${key}`}>{value}</dd>
    </div>
  );
  return (
    <dl class="cfg runend__facts">
      {fact('cause', causeText(s))}
      {fact('cleared', fmtNumber(r.stats.nodesCleared))}
      {fact('compactions', fmtNumber(s.compactions))}
    </dl>
  );
}

function RunSummary({ r, onNext }: { r: RunState; onNext: () => void }) {
  const focus = useInitialFocus<HTMLButtonElement>();
  const input = r.combat?.input;
  const events = useMemo(() => (input ? resolveCombat(input).events : []), [input]);
  const s = summarize(r, events);
  const offer = r.pending?.kind === 'lessonOffer';
  return (
    <section class={`screen runend runend--${s.outcome}`} aria-labelledby="runend-title">
      <header class="runend__head">
        <div>
          <p class="runend__file">{t('ui.runend.file', { seed: r.setup.seed })}</p>
          <h2 id="runend-title" class="runend__title" data-testid="runend-title">
            {t(`ui.runend.title.${s.outcome}`)}
          </h2>
          <p class="runend__lead">{t(`ui.runend.lead.${s.outcome}`)}</p>
        </div>
        <Facts r={r} s={s} />
      </header>
      <Bars s={s} />
      <div class="runend__foot">
        <aside class="runend__hint" aria-labelledby="runend-hint" data-testid="runend-hint">
          <h3 id="runend-hint">{t('ui.runend.hint')}</h3>
          <p data-hint={s.hint}>{t(`ui.runend.hint.${s.hint}`)}</p>
        </aside>
        <button
          ref={focus}
          type="button"
          class="btn btn--primary"
          onClick={offer ? onNext : closeRun}
        >
          {t(offer ? 'ui.runend.next' : 'ui.runend.back')}
        </button>
      </div>
    </section>
  );
}

/** Mode `runEnd`: the summary first, then AGENTS.md while the lesson offer is open. */
export function RunEndScreen() {
  const [lessons, setLessons] = useState(false);
  const r = run.value;
  if (!r?.result) return null;
  if (lessons && r.pending?.kind === 'lessonOffer') return <AgentsMd r={r} />;
  return <RunSummary r={r} onNext={() => setLessons(true)} />;
}
