// Effect clauses: one renderer per Effect kind, each filling the `effect.<kind>` template.
import type { Strings } from '../strings/en.ts';
import type { TargetSel } from '../types/basics.ts';
import type { Effect } from '../types/dsl.ts';
import { kindKey, type Params, render } from './fill.ts';
import {
  filterText,
  msText,
  selectorText,
  signed,
  targetText,
  type Version,
  valueAt,
} from './phrases.ts';

export interface EffectCtx {
  readonly strings: Strings;
  /** Tool version whose value is shown for v1/v2/v3 triples. */
  readonly version: Version;
  /** Default damage target (the owning tool's target). */
  readonly target: TargetSel;
}

type Of<K extends Effect['do']> = Extract<Effect, { do: K }>;
type Renderers = { readonly [K in Effect['do']]: (e: Of<K>, c: EffectCtx) => Params };

function dmgAmount(e: Of<'dmg'>, c: EffectCtx): string | number {
  const n = valueAt(e.v, c.version);
  if (!e.perSignalTenth) return n;
  return render(c.strings, 'bonus.per_signal', { n, per: valueAt(e.perSignalTenth, c.version) });
}

function statText(e: Of<'mod'>, c: EffectCtx): string {
  const stat = render(c.strings, kindKey('stat', e.stat), { n: signed(e.v) });
  if (!e.filter) return stat;
  return render(c.strings, 'text.for', {
    clause: stat,
    who: filterText(c.strings, e.filter, true),
  });
}

const renderers: Renderers = {
  dmg: (e, c) => ({ n: dmgAmount(e, c), target: targetText(c.strings, e.target ?? c.target) }),
  guard: (e, c) => ({ n: valueAt(e.v, c.version) }),
  heal: (e, c) => ({ n: valueAt(e.v, c.version) }),
  prime: (e, c) => ({
    what: filterText(c.strings, e.filter, false),
    pct: valueAt(e.pct, c.version),
  }),
  status: (e, c) => ({
    status: render(c.strings, `status.${e.status}`),
    sel: selectorText(c.strings, e.sel),
    ms: msText(c.strings, valueAt(e.ms, c.version)),
  }),
  charge: (e, c) => ({
    sel: selectorText(c.strings, e.sel),
    ms: msText(c.strings, valueAt(e.ms, c.version)),
  }),
  removeCtx: (e, c) => ({ n: valueAt(e.v, c.version) }),
  compact: () => ({}),
  summon: (e, c) => ({
    n: valueAt(e.v, c.version),
    every: msText(c.strings, e.everyMs),
    life: msText(c.strings, e.lifeMs),
  }),
  mod: (e, c) => ({ stat: statText(e, c) }),
  custom: (e, c) => ({ text: render(c.strings, `handler.${e.handler}`) }),
};

/** The clause for one effect, e.g. "deal 6 damage to the front enemy". */
export function effectClause(effect: Effect, ctx: EffectCtx): string {
  // Correlated union: renderers[effect.do] accepts exactly this effect's variant.
  const params = (renderers[effect.do] as (e: Effect, c: EffectCtx) => Params)(effect, ctx);
  const clause = render(ctx.strings, kindKey('effect', effect.do), params);
  if (effect.do !== 'prime' || (effect.count ?? 1) <= 1) return clause;
  return render(ctx.strings, 'text.times', { clause, count: effect.count ?? 1 });
}
