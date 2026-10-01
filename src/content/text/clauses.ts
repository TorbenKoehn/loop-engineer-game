// Trigger, condition, trait and verb clauses: one renderer per kind, each filling the
// `<group>.<kind>` template. Trigger and cond templates wrap the effect clause `{then}`.
import type { Strings } from '../strings/en.ts';
import type { Cond, Trigger } from '../types/dsl.ts';
import type { Trait, Verb } from '../types/enemy.ts';
import { kindKey, nameOf, type Params, render } from './fill.ts';
import { filterText, msText, toolName, verbSelText } from './phrases.ts';

type ParamsOf<U, D extends keyof U> = {
  readonly [K in U[D] & string]: (x: Extract<U, Record<D, K>>, s: Strings) => Params;
};

const enemyName = (s: Strings, id: string): string => nameOf(s, `enemy.${id}.name`, id);

function firedWhat(t: Extract<Trigger, { on: 'toolFired' }>, s: Strings): string {
  if (t.tool !== undefined) return toolName(s, t.tool);
  if (t.tag !== undefined) return render(s, `tag.${t.tag.toLowerCase()}.indef`);
  return render(s, 'fired.any');
}

const triggers: ParamsOf<Trigger, 'on'> = {
  fightStart: () => ({}),
  fightWon: () => ({}),
  every: (t, s) => ({ ms: msText(s, t.ms) }),
  toolFired: (t, s) => ({ what: firedWhat(t, s) }),
  compaction: () => ({}),
  damaged: (t) => ({ min: t.min ?? 1 }),
  guardGained: (t, s) => ({ source: render(s, t.fromTool ? 'source.tool' : 'source.any') }),
  trustBelow: (t) => ({ pct: t.pct }),
  passive: () => ({}),
};

const conds: ParamsOf<Cond, 'if'> = {
  zone: (c, s) => ({ zone: render(s, `zone.${c.is}`) }),
  piped: () => ({}),
  nth: (c) => ({ n: c.n }),
  adjacentSharesTag: () => ({}),
  cooldownAtMost: (c, s) => ({ ms: msText(s, c.ms) }),
  oncePerFight: () => ({}),
  oncePerRun: () => ({}),
  cooldown: (c, s) => ({ ms: msText(s, c.ms) }),
};

const traits: ParamsOf<Trait, 'trait'> = {
  split: (t, s) => ({ n: t.n, child: enemyName(s, t.child), pct: t.pct }),
  grow: (t, s) => ({ ms: msText(s, t.ms), sev: t.sev, dmg: t.dmg }),
  outage: (t, s) => ({ tools: filterText(s, { tag: t.tag }, true) }),
  blocked: () => ({}),
  armor: (t) => ({ layers: t.layers, hp: t.hp }),
};

const verbs: ParamsOf<Verb, 'verb'> = {
  hit: (v) => ({ n: v.n }),
  multiHit: (v) => ({ n: v.n, times: v.times }),
  noise: (v) => ({ n: v.n }),
  throttle: (v, s) => ({ sel: verbSelText(s, v.sel), ms: msText(s, v.ms) }),
  slow: (v, s) => ({ sel: verbSelText(s, v.sel), ms: msText(s, v.ms) }),
  stun: (v, s) => ({ ms: msText(s, v.ms) }),
  guard: (v) => ({ n: v.n }),
  heal: (v) => ({ n: v.n }),
  spawn: (v, s) => ({ enemy: enemyName(s, v.enemy), max: v.max }),
  redirect: () => ({}),
  custom: (v, s) => ({ text: render(s, `handler.${v.handler}`) }),
};

// Correlated unions: each map entry accepts exactly the variant of its kind.
type Loose<T> = (x: T, s: Strings) => Params;

/** Wraps the effect clause `then` in the trigger's template. */
export const triggerClause = (t: Trigger, s: Strings, then: string): string =>
  render(s, kindKey('trigger', t.on), { ...(triggers[t.on] as Loose<Trigger>)(t, s), then });

/** Wraps the effect clause `then` in the condition's template. */
export const condClause = (c: Cond, s: Strings, then: string): string =>
  render(s, kindKey('cond', c.if), { ...(conds[c.if] as Loose<Cond>)(c, s), then });

export const traitClause = (t: Trait, s: Strings): string =>
  render(s, kindKey('trait', t.trait), (traits[t.trait] as Loose<Trait>)(t, s));

export const verbClause = (v: Verb, s: Strings): string =>
  render(s, kindKey('verb', v.verb), (verbs[v.verb] as Loose<Verb>)(v, s));
