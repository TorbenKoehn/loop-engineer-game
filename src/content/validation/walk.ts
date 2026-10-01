// Collectors over the content bundle: every rule, effect, intent, verb, outcome and handler
// id, each labelled with its owner ("skill grep_first") for error messages.
import type { Content } from '../index.ts';
import type { Strings } from '../strings/en.ts';
import type { Effect, Rule } from '../types/dsl.ts';
import type { EnemyDef, Intent, Verb } from '../types/enemy.ts';
import type { Outcome } from '../types/event.ts';

export interface Owned<T> {
  readonly owner: string;
  readonly item: T;
}

/** True when `key` is a non-empty string in the table. */
export const hasKey = (strings: Strings, key: string): boolean =>
  Boolean((strings as Readonly<Record<string, string | undefined>>)[key]);

const own = <T>(owner: string, items: readonly T[]): Owned<T>[] =>
  items.map((item) => ({ owner, item }));

/** Every rule of skills, memories, lessons, prompts and harness traits. */
export function rulesOf(c: Content): Owned<Rule>[] {
  return [
    ...c.skills.flatMap((s) => own(`skill ${s.id}`, s.rules)),
    ...c.memories.flatMap((m) => own(`memory ${m.id}`, m.rules)),
    ...c.lessons.flatMap((l) => own(`lesson ${l.id}`, l.rules)),
    ...c.prompts.flatMap((p) => own(`prompt ${p.id}`, p.rules)),
    ...c.harnesses.flatMap((h) => own(`harness ${h.id}`, h.trait.rules)),
  ];
}

/** Every effect: tool effects and the effects of every rule. */
export function effectsOf(c: Content): Owned<Effect>[] {
  return [
    ...c.tools.flatMap((t) => own(`tool ${t.id}`, t.effects)),
    ...rulesOf(c).flatMap((r) => own(r.owner, r.item.then)),
  ];
}

/** Opening, cycle and stage intents of one enemy (shared intents appear once per list). */
export const intentsOf = (e: EnemyDef): readonly Intent[] => [
  ...(e.opening ?? []),
  ...e.cycle,
  ...(e.stages ?? []).flatMap((s) => s.cycle),
];

export const verbsOf = (c: Content): Owned<Verb>[] =>
  c.enemies.flatMap((e) =>
    own(
      `enemy ${e.id}`,
      intentsOf(e).flatMap((i) => i.verbs),
    ),
  );

function nested(o: Outcome): readonly Outcome[] {
  switch (o.do) {
    case 'version':
      return o.otherwise ?? [];
    case 'gainMemory':
      return o.owned ?? [];
    case 'chance':
      return o.then;
    default:
      return [];
  }
}

const flatOutcomes = (os: readonly Outcome[]): Outcome[] =>
  os.flatMap((o) => [o, ...flatOutcomes(nested(o))]);

/** Every event outcome, nested ones (otherwise, owned, chance) included. */
export const outcomesOf = (c: Content): Owned<Outcome>[] =>
  c.events.flatMap((ev) =>
    ev.choices.flatMap((ch) => own(`event ${ev.id}.${ch.id}`, flatOutcomes(ch.outcomes))),
  );

/** Every custom handler id: custom effects, verbs and outcomes, and enemy handlers. */
export function handlersOf(c: Content): Owned<string>[] {
  const pick = <T extends { readonly owner: string; readonly item: object }>(xs: readonly T[]) =>
    xs.flatMap(({ owner, item }) =>
      'handler' in item && typeof item.handler === 'string' ? [{ owner, item: item.handler }] : [],
    );
  return [
    ...pick(effectsOf(c)),
    ...pick(verbsOf(c)),
    ...pick(outcomesOf(c)),
    ...pick(c.enemies.map((e) => ({ owner: `enemy ${e.id}`, item: e }))),
  ];
}
