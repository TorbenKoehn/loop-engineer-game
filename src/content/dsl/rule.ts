// Rule builders. Data modules use these instead of `{ when, then }` literals, because
// Biome's noThenProperty flags object literals with a written-out `then` key.
import type { Cond, Effect, Rule, Trigger } from '../types/dsl.ts';

/** when -> (all conds) -> then. */
export function rule(when: Trigger, then: readonly Effect[], conds?: readonly Cond[]): Rule {
  return conds ? { when, if: conds, then } : { when, then };
}

/** An always-on modifier rule. */
export const passive = (...effects: readonly Effect[]): Rule => rule({ on: 'passive' }, effects);
