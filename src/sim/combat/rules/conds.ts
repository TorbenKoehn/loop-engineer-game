// Trigger matching and conditions of item rules (docs/architecture/content-model.md "The DSL").
// The rule's own tool is the tool that fired or gave Guardrails; tool conds fail without one.
import type { Cond, Trigger } from '../../../content/types/index.ts';
import type { Sim, ToolRt } from '../state.ts';
import type { Fire, RuleRt } from './state.ts';

type Match<T extends Trigger> = (w: T, sim: Sim, fire: Fire) => boolean;
type Matchers = { readonly [K in Trigger['on']]: Match<Extract<Trigger, { on: K }>> };

export const subjectOf = (sim: Sim, fire: Fire): ToolRt | undefined =>
  fire.slot === undefined ? undefined : sim.agent.tools[fire.slot];

const always = () => true;

const MATCH: Matchers = {
  fightStart: always,
  fightWon: always,
  compaction: always,
  /** Raised every tick in step 2; due at each multiple of `ms`. */
  every: (w, sim) => sim.t % w.ms === 0,
  toolFired: (w, sim, fire) => {
    const def = subjectOf(sim, fire)?.def;
    return !!def && (!w.tag || def.tags.includes(w.tag)) && (!w.tool || def.id === w.tool);
  },
  damaged: (w, _, fire) => (fire.n ?? 0) >= (w.min ?? 1),
  guardGained: (w, _, fire) => !w.fromTool || fire.fromTool === true,
  trustBelow: (w, sim, fire) => (fire.n ?? 0) * 100 < w.pct * sim.agent.maxTrust,
  /** Always-on modifiers are never dispatched (T033). */
  passive: () => false,
};

export function triggerMatches(sim: Sim, when: Trigger, fire: Fire): boolean {
  return when.on === fire.on && (MATCH[when.on] as Match<Trigger>)(when, sim, fire);
}

type CondCtx = { readonly sim: Sim; readonly rule: RuleRt; readonly tool?: ToolRt | undefined };
type Check<C extends Cond> = (c: C, x: CondCtx) => boolean;
type Checks = { readonly [K in Cond['if']]: Check<Extract<Cond, { if: K }>> };

const sharesTag = (sim: Sim, tool: ToolRt, slot: number): boolean =>
  !!sim.agent.tools[slot]?.def.tags.some((tag) => tool.def.tags.includes(tag));

const CHECK: Checks = {
  zone: (c, { sim }) => sim.agent.ctx.zone === c.is,
  piped: (_, { tool }) => tool?.piped === true,
  /** Every n-th trigger match, counted whether or not the other conds pass. */
  nth: (c, { rule }) => rule.hits % c.n === 0,
  adjacentSharesTag: (_, { sim, tool }) =>
    !!tool && (sharesTag(sim, tool, tool.slot - 1) || sharesTag(sim, tool, tool.slot + 1)),
  cooldownAtMost: (c, { tool }) => !!tool && tool.def.cooldownMs <= c.ms,
  oncePerFight: (_, { rule }) => rule.lastT < 0,
  oncePerRun: (_, { sim, rule }) => !sim.rules.usedOncePerRun.includes(rule.id),
  cooldown: (c, { sim, rule }) => rule.lastT < 0 || sim.t - rule.lastT >= c.ms,
};

/** All conditions of the rule hold now. */
export function condsPass(sim: Sim, rule: RuleRt, tool: ToolRt | undefined): boolean {
  return (rule.rule.if ?? []).every((c) => (CHECK[c.if] as Check<Cond>)(c, { sim, rule, tool }));
}
