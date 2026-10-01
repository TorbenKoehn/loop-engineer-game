// define* helpers: type-check a content definition, keep its literal id and freeze it in
// dev. Data modules derive id unions from the results: `(typeof tools)[number]['id']`.
import type { EncounterDef, EnemyDef } from '../types/enemy.ts';
import type { EventDef } from '../types/event.ts';
import type { HarnessDef, SystemPromptDef } from '../types/harness.ts';
import type { LessonDef, MemoryDef, SkillDef, ToolDef } from '../types/items.ts';
import { freezeInDev } from './freeze.ts';

/** A definition whose `id` keeps its string-literal type. */
export type Defined<T extends { readonly id: string }, Id extends string> = T & {
  readonly id: Id;
};

// The parameter type is concrete apart from Id, so object literals get excess-property checks.
const definer =
  <T extends { readonly id: string }>() =>
  <const Id extends string>(def: Defined<T, Id>): Defined<T, Id> =>
    freezeInDev(def);

export const defineTool = definer<ToolDef>();
export const defineSkill = definer<SkillDef>();
export const defineMemory = definer<MemoryDef>();
export const defineLesson = definer<LessonDef>();
export const defineEnemy = definer<EnemyDef>();
export const defineEncounter = definer<EncounterDef>();
export const defineHarness = definer<HarnessDef>();
export const definePrompt = definer<SystemPromptDef>();
export const defineEvent = definer<EventDef>();
