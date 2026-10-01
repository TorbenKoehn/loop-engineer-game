// Passive `custom` effects (docs/architecture/content-model.md "Custom handlers"): hooks the sim
// asks at fixed points (sim-core.md "Custom hooks"). Ids without a hook here have no effect yet.
import type { Family, HandlerId } from '../../../content/types/index.ts';
import { mulDiv } from '../../int.ts';
import { condsPass } from '../rules/conds.ts';
import type { RuleRt } from '../rules/state.ts';
import type { Sim } from '../state.ts';

export interface Hook {
  readonly rule: RuleRt;
  readonly args: Readonly<Record<string, number>>;
}

/** The passive `custom` effects naming `handler` whose rule's conds hold, in slot order. */
export function hooks(sim: Sim, handler: HandlerId): Hook[] {
  return sim.rules.list.flatMap((rule) => {
    if (rule.rule.when.on !== 'passive' || !condsPass(sim, rule, undefined)) return [];
    return rule.rule.then.flatMap((e) =>
      e.do === 'custom' && e.handler === handler ? [{ rule, args: e.args ?? {} }] : [],
    );
  });
}

const sum = (list: readonly Hook[], key: string): number =>
  list.reduce((total, h) => total + (h.args[key] ?? 0), 0);

/** double_first_resolve: 1 extra resolve for the fight's first activation; `lastT` marks it. */
export function echoes(sim: Sim): number {
  const unused = hooks(sim, 'double_first_resolve').filter((h) => h.rule.lastT < 0);
  for (const h of unused) h.rule.lastT = sim.t;
  return unused.length > 0 ? 1 : 0;
}

/** context_noise_cut: noise injected by a Context enemy loses `pct` percent (floor). */
export function cutNoise(sim: Sim, family: Family, n: number): number {
  if (family !== 'Context') return n;
  const pct = sum(hooks(sim, 'context_noise_cut'), 'pct');
  return pct > 0 ? mulDiv(n, Math.max(0, 100 - pct), 100) : n;
}

export interface Cut {
  readonly ms: number;
  readonly min: number;
}

/** throttle_shorter: ms cut off an enemy Throttle on a tool (before % mods) and its floor. */
export function throttleCut(sim: Sim): Cut {
  const list = hooks(sim, 'throttle_shorter');
  return { ms: sum(list, 'ms'), min: Math.max(0, ...list.map((h) => h.args.min ?? 0)) };
}
