// English string table (docs/game/ux/localisation.md "String files"). Flat, `as const`,
// dotted lower-case keys, named placeholders only. Kind templates (`effect.*`, `trigger.*`,
// `cond.*`, `trait.*`, `verb.*`) are lower-case clauses; text.ts wraps them into sentences.
// Trigger and cond templates wrap the effect clause `{then}`.
import { enEnemies } from './en-enemies.ts';
import { enTools } from './en-tools.ts';

export const en = {
  // Sentence composition.
  'text.sentence': '{clause}.',
  'text.and': '{a} and {b}',
  'text.list': '{a}, {b}',
  'text.for': '{clause} for {who}',
  'text.times': '{clause} ({count} times)',
  'unit.ms': '{n} ms',
  'bonus.per_signal': '{n} (+{per} per 10% of the window in Signal)',

  // Effects: one template per Effect kind.
  'effect.dmg': 'deal {n} damage to {target}',
  'effect.guard': 'gain {n} Guardrails',
  'effect.heal': 'restore {n} Trust',
  'effect.prime': 'your next {what} hits {pct}% harder',
  'effect.status': '{status} {sel} for {ms}',
  'effect.clear_status': 'clear {status} from {sel}',
  'effect.charge': 'give {sel} {ms} of charge',
  'effect.remove_ctx': 'remove {n} context (noise first)',
  'effect.compact': 'compact the context now',
  'effect.summon': 'summon a sub-agent that hits for {n} every {every} for {life}',
  'effect.mod': '{stat}',
  'effect.custom': '{text}',

  // Triggers: one template per Trigger kind.
  'trigger.fight_start': 'at the start of each fight, {then}',
  'trigger.fight_won': 'after each won fight, {then}',
  'trigger.every': 'every {ms}, {then}',
  'trigger.tool_fired': 'after {what} fires, {then}',
  'trigger.compaction': 'on any compaction, {then}',
  'trigger.damaged': 'when an enemy hit deals at least {min} damage, {then}',
  'trigger.guard_gained': 'whenever {source} gives you Guardrails, {then}',
  'trigger.trust_below': 'when Trust drops below {pct}%, {then}',
  'trigger.passive': '{then}',

  // Conditions: one template per Cond kind.
  'cond.zone': 'while in the {zone} zone, {then}',
  'cond.piped': 'if piped since its last activation, {then}',
  'cond.nth': '{then} (every {n} triggers)',
  'cond.adjacent_shares_tag': 'if next to a tool sharing a tag, {then}',
  'cond.cooldown_at_most': 'if its cooldown is {ms} or less, {then}',
  'cond.once_per_fight': '{then} (once per fight)',
  'cond.once_per_run': '{then} (once per run)',
  'cond.cooldown': '{then} (at most once per {ms})',

  // Enemy traits: one template per Trait kind.
  'trait.split': 'when resolved, splits into {n} {child} at {pct}% Severity',
  'trait.grow': 'every {ms}, gains {sev} Severity and {dmg} damage',
  'trait.outage': 'while alive, {tools} time out',
  'trait.blocked': 'takes no damage while any other enemy is alive',
  'trait.armor': '{layers} armor layers of {hp}; Edit damage counts fully, other damage half',

  // Enemy action verbs: one template per Verb kind.
  'verb.hit': 'hit for {n}',
  'verb.multi_hit': 'hit {times} times for {n}',
  'verb.noise': 'add {n} noise',
  'verb.throttle': 'Throttle {sel} for {ms}',
  'verb.slow': 'Slow {sel} for {ms}',
  'verb.stun': 'Stun you for {ms}',
  'verb.guard': 'gain {n} Guardrails',
  'verb.heal': 'heal {n} Severity',
  'verb.spawn': 'summon {enemy} (at most {max})',
  'verb.redirect': 'redirect your next hit',
  'verb.custom': '{text}',

  // Phrases used inside templates.
  'fired.any': 'any tool',
  'source.any': 'anything',
  'source.tool': 'a tool',
  'filter.any.one': 'tool',
  'filter.any.other': 'tools',
  'filter.tag.one': '{tag} tool',
  'filter.tag.other': '{tag} tools',
  'filter.max_weight': '{what} with weight {n} or less',
  'filter.max_cooldown': '{what} with cooldown {ms} or less',
  'filter.family': '{what} against {family}',
  'target.front': 'the front enemy',
  'target.back': 'the back enemy',
  'target.lowest': 'the weakest enemy',
  'target.all': 'all enemies',
  'target.self': 'yourself',
  'target.tool': 'one of your tools',
  'target.right_tool': 'the tool to the right',
  'target.tools': 'all your tools',
  'sel.fastest': 'your fastest tool',
  'sel.leftmost': 'your leftmost tool',
  'sel.rightmost': 'your rightmost tool',
  'sel.longest_charge': 'your tool with the longest charge left',
  'sel.tag': 'your {tag} tools',

  // Vocabulary.
  'tag.search': 'Search',
  'tag.edit': 'Edit',
  'tag.test': 'Test',
  'tag.shell': 'Shell',
  'tag.web': 'Web',
  'tag.agent': 'Agent',
  'tag.search.indef': 'a Search tool',
  'tag.edit.indef': 'an Edit tool',
  'tag.test.indef': 'a Test tool',
  'tag.shell.indef': 'a Shell tool',
  'tag.web.indef': 'a Web tool',
  'tag.agent.indef': 'an Agent tool',
  'status.haste': 'Haste',
  'status.slow': 'Slow',
  'status.throttle': 'Throttle',
  'status.stun': 'Stun',
  'zone.cold': 'Cold',
  'zone.focused': 'Focused',
  'zone.rot': 'Rot',
  'zone.overflow': 'Overflow',
  'family.bugs': 'Bugs',
  'family.context': 'Context',
  'family.infra': 'Infra',
  'family.process': 'Process',
  'family.sandbox': 'Sandbox',

  // Passive stat modifiers ({n} is signed).
  'stat.rate': 'charge rate {n}',
  'stat.dmg_pct': 'damage {n}%',
  'stat.dmg_flat': 'flat damage {n}',
  'stat.output': 'output {n} tokens',
  'stat.window': 'window {n}',
  'stat.pipe_ms': 'pipe time {n} ms',
  'stat.focus_pct': 'Focused bonus {n}%',
  'stat.noise_block': 'noise blocked each fight {n}',
  'stat.throttle_dur_pct': 'Throttle and Slow duration on your tools {n}%',
  'stat.stun_dur_pct': 'Stun duration on you {n}%',
  'stat.dmg_taken_pct': 'damage taken {n}%',
  'stat.credits': 'Credits {n}',
  'stat.slots.tool': 'tool slots {n}',
  'stat.slots.memory': 'memory slots {n}',
  'stat.reroll_cost': 'reroll cost {n}',
  'stat.heal_pct': 'healing {n}%',

  // Content names and flavour (one spread per content area).
  ...enEnemies,
  ...enTools,
} as const;

export type StringKey = keyof typeof en;
/** A complete string table; other locales are Partial and fall back to `en`. */
export type Strings = Readonly<Record<StringKey, string>>;
