// Tag breakpoints (docs/game/systems/harness-loadout.md "Tag breakpoints"): counted over the
// equipped tools, a tool with two tags counts for both. Active ones join the fight's item rules
// as `bp:<id>` (rules/state.ts); the build panel shows the same progress.
import type { Effect, ModStat, Rule, Tag, Trigger } from '../content/types/index.ts';

export type BreakpointId = 'posix' | 'refactor' | 'indexed' | 'tdd';

export interface BreakpointDef {
  readonly id: BreakpointId;
  readonly tag: Tag;
  readonly need: number;
  readonly rules: readonly Rule[];
}

/** A rule in the item DSL (shorthand `then`, never a thenable literal). */
const rule = (when: Trigger, then: readonly Effect[]): Rule => ({ when, then });
const mod = (stat: ModStat, v: number, tag?: Tag): Rule =>
  rule({ on: 'passive' }, [{ do: 'mod', stat, v, ...(tag && { filter: { tag } }) }]);

/** The M1 breakpoints; Always Online and Orchestration join with E014. */
export const BREAKPOINTS: readonly BreakpointDef[] = [
  { id: 'posix', tag: 'Shell', need: 3, rules: [mod('pipeMs', 500)] },
  { id: 'refactor', tag: 'Edit', need: 3, rules: [mod('dmgPct', 15, 'Edit')] },
  { id: 'indexed', tag: 'Search', need: 3, rules: [mod('output', -1, 'Search')] },
  {
    id: 'tdd',
    tag: 'Test',
    need: 2,
    rules: [rule({ on: 'toolFired', tag: 'Test' }, [{ do: 'heal', v: 2 }])],
  },
];

export interface BreakpointProgress {
  readonly def: BreakpointDef;
  /** Equipped tools carrying the tag, e.g. 2 of `need` 3 shows as `Shell 2/3`. */
  readonly count: number;
  readonly active: boolean;
}

/** Progress of every breakpoint over the equipped tools, in table order. */
export function breakpoints(
  tools: readonly { readonly tags: readonly Tag[] }[],
): BreakpointProgress[] {
  return BREAKPOINTS.map((def) => {
    const count = tools.filter((t) => t.tags.includes(def.tag)).length;
    return { def, count, active: count >= def.need };
  });
}
