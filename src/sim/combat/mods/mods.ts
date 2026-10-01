// Passive `mod` effects (docs/architecture/content-model.md "ModStat"): collected once at fight
// start from the passive rules in slot order (trait, prompt, skills, memories, lessons). Each
// keeps its why id, e.g. `skill:inline_suggestions`, and its rule for conds.
import type { Family, Filter, ModStat, ToolDef } from '../../../content/types/index.ts';
import type { Mod } from '../damage.ts';
import { condsPass } from '../rules/conds.ts';
import type { RuleRt } from '../rules/state.ts';
import type { Sim, ToolRt } from '../state.ts';
import { fits } from './filter.ts';

export interface ModRt {
  /** The owner without the rule index: `<kind>:<def id>`. */
  readonly id: string;
  readonly stat: ModStat;
  readonly v: number;
  readonly filter: Filter;
  readonly rule: RuleRt; // owning passive rule: conds and their state
}

export function collectMods(rules: readonly RuleRt[]): ModRt[] {
  return rules.flatMap((rule) => {
    if (rule.rule.when.on !== 'passive') return [];
    const id = rule.id.slice(0, rule.id.lastIndexOf('#'));
    return rule.rule.then.flatMap((e) =>
      e.do === 'mod' ? [{ id, stat: e.stat, v: e.v, filter: e.filter ?? {}, rule }] : [],
    );
  });
}

const total = (mods: readonly ModRt[]): number => mods.reduce((sum, m) => sum + m.v, 0);

/** Fight-start stats (window, noiseBlock, focusPct, rate): filter only, conds are not checked. */
export const statMods = (mods: readonly ModRt[], stat: ModStat, tool?: ToolDef): ModRt[] =>
  mods.filter((m) => m.stat === stat && fits(m.filter, tool));

export const sumMods = (mods: readonly ModRt[], stat: ModStat, tool?: ToolDef): number =>
  total(statMods(mods, stat, tool));

/** Mods on `stat` that apply now: the filter fits `tool` and the owning rule's conds hold. */
export const activeMods = (sim: Sim, stat: ModStat, tool?: ToolRt): ModRt[] =>
  statMods(sim.mods, stat, tool?.def).filter((m) => condsPass(sim, m.rule, tool));

export const activeSum = (sim: Sim, stat: ModStat, tool?: ToolRt): number =>
  total(activeMods(sim, stat, tool));

/**
 * dmgFlat and dmgPct of one activation (damage only, `family` per target); conds once, fired.
 */
export function damageMods(sim: Sim, tool: ToolRt): Mod[] {
  const mods = [...activeMods(sim, 'dmgFlat', tool), ...activeMods(sim, 'dmgPct', tool)];
  for (const m of mods) m.rule.lastT = sim.t;
  return mods.map((m) => ({
    id: m.id,
    ...(m.stat === 'dmgFlat' ? { flat: m.v } : { pct: m.v }),
    dmgOnly: true,
    ...(m.filter.family && { family: m.filter.family }),
  }));
}

/** dmgTakenPct against a hit by an enemy of `family`; a family filter must match it. */
export const takenMods = (sim: Sim, family: Family): Mod[] =>
  activeMods(sim, 'dmgTakenPct')
    .filter((m) => m.filter.family === undefined || m.filter.family === family)
    .map((m) => ({ id: m.id, pct: m.v }));
