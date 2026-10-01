// The rule engine: the sim raises triggers (state.ts), fixed dispatch points run the matching
// item rules in slot order (docs/game/content/skills.md "Trigger semantics").
import { updateZone } from '../context/zone.ts';
import { applyEffect } from '../effects.ts';
import type { Sim } from '../state.ts';
import type { Activation } from '../status/status-effects.ts';
import { condsPass, subjectOf, triggerMatches } from './conds.ts';
import { type Fire, type FireSpec, type RuleRt, raise } from './state.ts';

/** Raises a trigger and dispatches the queue; the caller's overflow check updates the zone. */
export function fireRules(sim: Sim, spec: FireSpec): void {
  raise(sim.rules, spec);
  drain(sim);
}

/** Dispatches the queue (and `spec`); then the zone once if a rule ran (it may remove tokens). */
export function runRules(sim: Sim, spec?: FireSpec): void {
  if (spec) raise(sim.rules, spec);
  if (drain(sim)) updateZone(sim);
}

/** FIFO; triggers raised by rule effects join the queue with the raising rule's chain. */
function drain(sim: Sim): boolean {
  const { pending } = sim.rules;
  let ran = false;
  for (let fire = pending.shift(); fire; fire = pending.shift()) ran = dispatch(sim, fire) || ran;
  return ran;
}

/** Runs every matching rule in slot order; returns whether one ran. */
function dispatch(sim: Sim, fire: Fire): boolean {
  const tool = subjectOf(sim, fire);
  let ran = false;
  for (const [ix, rt] of sim.rules.list.entries()) {
    if (fire.chain.includes(ix) || !triggerMatches(sim, rt.rule.when, fire)) continue;
    rt.hits++;
    if (!condsPass(sim, rt, tool)) continue;
    run(sim, rt, { ...fire, chain: [...fire.chain, ix] });
    ran = true;
  }
  return ran;
}

/** Item effects are flat (no zone or prime mods); `a` is their source in the log. */
function run(sim: Sim, rt: RuleRt, fire: Fire): void {
  rt.lastT = sim.t;
  if (rt.rule.if?.some((c) => c.if === 'oncePerRun')) sim.rules.usedOncePerRun.push(rt.id);
  const picked = subjectOf(sim, fire);
  const act: Activation = { src: 'a', id: rt.src, picked, picks: new Map(), mods: [] };
  sim.rules.chain = fire.chain;
  for (const effect of rt.rule.then) applyEffect(sim, act, effect);
  sim.rules.chain = [];
}
