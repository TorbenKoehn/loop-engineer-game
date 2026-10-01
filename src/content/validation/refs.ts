// Rule 1: ids unique per kind; every referenced id exists (enemies, tools, skills, memories,
// unlock nodes, handler ids with their `handler.<id>` string).
import { CONTENT_KINDS, type Content } from '../index.ts';
import type { Strings } from '../strings/en.ts';
import type { Effect, Rule } from '../types/dsl.ts';
import type { Outcome } from '../types/event.ts';
import type { UnlockRef } from '../types/refs.ts';
import { effectsOf, handlersOf, hasKey, outcomesOf, rulesOf, verbsOf } from './walk.ts';

export interface RefOptions {
  readonly strings: Strings;
  readonly unlockNodes: readonly string[];
  /** Registered handler ids (src/sim/handlers); when absent only string keys are checked. */
  readonly handlers?: ReadonlySet<string>;
}

const err = (msg: string) => `[rule 1] ${msg}`;

function duplicates(ids: readonly string[]): string[] {
  return ids.filter((id, i) => ids.indexOf(id) !== i);
}

function uniqueIds(c: Content): string[] {
  const kinds = CONTENT_KINDS.flatMap((kind) =>
    duplicates(c[kind].map((x) => x.id)).map((id) => err(`duplicate ${kind} id '${id}'`)),
  );
  const stages = c.enemies.flatMap((e) =>
    duplicates((e.stages ?? []).map((s) => s.id)).map((id) => err(`enemy ${e.id}: stage '${id}'`)),
  );
  const choices = c.events.flatMap((ev) =>
    duplicates(ev.choices.map((ch) => ch.id)).map((id) => err(`event ${ev.id}: choice '${id}'`)),
  );
  return [...kinds, ...stages, ...choices];
}

const idSet = (xs: readonly { readonly id: string }[]) => new Set(xs.map((x) => x.id));

function enemyRefs(c: Content, enemies: ReadonlySet<string>): string[] {
  const missing = (owner: string, id: string) =>
    enemies.has(id) ? [] : [err(`${owner} references unknown enemy '${id}'`)];
  const familyOf = (id: string) =>
    Object.entries(c.families).find(([, ids]) => ids.includes(id))?.[0];
  return [
    ...c.encounters.flatMap((en) => en.enemies.flatMap((id) => missing(`encounter ${en.id}`, id))),
    ...c.enemies.flatMap((e) =>
      e.traits.flatMap((t) => (t.trait === 'split' ? missing(`enemy ${e.id}`, t.child) : [])),
    ),
    ...verbsOf(c).flatMap((v) => (v.item.verb === 'spawn' ? missing(v.owner, v.item.enemy) : [])),
    ...outcomesOf(c).flatMap((o) =>
      o.item.do === 'nextFight' && o.item.mod.mod === 'addEnemy'
        ? missing(o.owner, o.item.mod.enemy)
        : [],
    ),
    ...c.enemies.flatMap((e) =>
      familyOf(e.id) === e.family ? [] : [err(`enemy ${e.id} is not in families.${e.family}`)],
    ),
  ];
}

const toolOfEffect = (e: Effect): string | undefined =>
  e.do === 'prime' || e.do === 'mod' ? e.filter?.tool : undefined;
const toolOfRule = (r: Rule): string | undefined =>
  r.when.on === 'toolFired' ? r.when.tool : undefined;
const toolOfOutcome = (o: Outcome): string | undefined =>
  o.do === 'gainTool' ? o.tool : undefined;

function itemRefs(c: Content): string[] {
  const tools = idSet(c.tools);
  const skills = idSet(c.skills);
  const memories = idSet(c.memories);
  const check = (set: ReadonlySet<string>, kind: string) => (owner: string, id?: string) =>
    id === undefined || set.has(id) ? [] : [err(`${owner} references unknown ${kind} '${id}'`)];
  const tool = check(tools, 'tool');
  return [
    ...c.harnesses.flatMap((h) => h.tools.flatMap((id) => tool(`harness ${h.id}`, id))),
    ...c.harnesses.flatMap((h) =>
      h.skills.flatMap((id) => check(skills, 'skill')(`harness ${h.id}`, id)),
    ),
    ...effectsOf(c).flatMap((e) => tool(e.owner, toolOfEffect(e.item))),
    ...rulesOf(c).flatMap((r) => tool(r.owner, toolOfRule(r.item))),
    ...outcomesOf(c).flatMap((o) => tool(o.owner, toolOfOutcome(o.item))),
    ...outcomesOf(c).flatMap((o) =>
      o.item.do === 'gainMemory' ? check(memories, 'memory')(o.owner, o.item.memory) : [],
    ),
  ];
}

interface Unlockable {
  readonly id: string;
  readonly unlock: UnlockRef;
}

function unlockRefs(c: Content, nodes: readonly string[]): string[] {
  const tag = (kind: string, xs: readonly Unlockable[]) => xs.map((x) => ({ kind, ...x }));
  const items = [
    ...tag('tool', c.tools),
    ...tag('skill', c.skills),
    ...tag('memory', c.memories),
    ...tag('event', c.events),
    ...tag('harness', c.harnesses),
    ...tag('prompt', c.prompts),
  ];
  return items.flatMap(({ kind, id, unlock }) =>
    unlock === 'base' || nodes.includes(unlock.node)
      ? []
      : [err(`${kind} ${id} references unknown unlock node '${unlock.node}'`)],
  );
}

function handlerRefs(c: Content, o: RefOptions): string[] {
  return handlersOf(c).flatMap(({ owner, item: id }) => [
    ...(hasKey(o.strings, `handler.${id}`) ? [] : [err(`${owner}: no string 'handler.${id}'`)]),
    ...(o.handlers && !o.handlers.has(id) ? [err(`${owner}: unregistered handler '${id}'`)] : []),
  ]);
}

export function checkRefs(c: Content, o: RefOptions): string[] {
  return [
    ...uniqueIds(c),
    ...enemyRefs(c, idSet(c.enemies)),
    ...itemRefs(c),
    ...unlockRefs(c, o.unlockNodes),
    ...handlerRefs(c, o),
  ];
}
