// Generated plain-English text (docs/architecture/content-model.md "Generated text").
// Every line is composed from the kind templates in strings/en.ts and the current values,
// so text cannot drift from data. Pass another complete table to render other locales.
import { en, type Strings } from './strings/en.ts';
import { condClause, traitClause, triggerClause, verbClause } from './text/clauses.ts';
import { effectClause } from './text/effects.ts';
import { joinAnd, sentence } from './text/fill.ts';
import type { Version } from './text/phrases.ts';
import type { TargetSel } from './types/basics.ts';
import type { Effect, Rule } from './types/dsl.ts';
import type { EnemyDef, Intent } from './types/enemy.ts';
import type { ToolDef } from './types/items.ts';

export type { Version };

export interface DescribeOptions {
  readonly strings?: Strings;
  /** Version used for v1/v2/v3 values (default 1). */
  readonly version?: Version;
  /** Default damage target for effects without their own (default 'front'). */
  readonly target?: TargetSel;
}

export interface EnemyText {
  readonly traits: readonly string[];
  /** Opening, cycle and stage intents in order. */
  readonly intents: readonly string[];
}

const ctxOf = (o: DescribeOptions) => ({
  strings: o.strings ?? en,
  version: o.version ?? 1,
  target: o.target ?? 'front',
});

/** One effect as a sentence, e.g. "Deal 6 damage to the front enemy." */
export function describeEffect(effect: Effect, options: DescribeOptions = {}): string {
  const ctx = ctxOf(options);
  return sentence(ctx.strings, effectClause(effect, ctx));
}

/** A rule as one sentence: trigger, then conditions, wrapped around the joined effects. */
export function describeRule(rule: Rule, options: DescribeOptions = {}): string {
  const ctx = ctxOf(options);
  const s = ctx.strings;
  const clauses = rule.then.map((e) => effectClause(e, ctx));
  const effects = joinAnd(s, clauses);
  const conditioned = (rule.if ?? []).reduce((then, c) => condClause(c, s, then), effects);
  return sentence(s, triggerClause(rule.when, s, conditioned));
}

/** A tool's line at `version`: its effects joined into one sentence. */
export function describeTool(tool: ToolDef, version: Version, strings: Strings = en): string {
  const ctx = { strings, version, target: tool.target };
  const clauses = tool.effects.map((e) => effectClause(e, ctx));
  return sentence(strings, joinAnd(strings, clauses));
}

function intentLine(intent: Intent, s: Strings): string {
  const clauses = intent.verbs.map((v) => verbClause(v, s));
  return sentence(s, joinAnd(s, clauses));
}

/** Trait card lines and intent lines of an enemy, including boss stages. */
export function describeEnemy(enemy: EnemyDef, strings: Strings = en): EnemyText {
  const stages = enemy.stages ?? [];
  const traits = [...enemy.traits, ...stages.flatMap((st) => st.traits ?? [])];
  const intents = [...(enemy.opening ?? []), ...enemy.cycle, ...stages.flatMap((st) => st.cycle)];
  return {
    traits: traits.map((t) => sentence(strings, traitClause(t, strings))),
    intents: intents.map((i) => intentLine(i, strings)),
  };
}
