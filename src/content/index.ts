// Import boundary: content data modules import only src/content.
// See docs/architecture/overview.md. Also the whole catalogue as one bundle and its version:
// saves store CONTENT_VERSION (save.md); validate.ts checks the bundle (content-model.md).
// One barrel per kind: a new content area registers in its kind's barrel, not here (T099).
import { encounters } from './encounters/index.ts';
import { enemies } from './enemies/index.ts';
import { events } from './events/index.ts';
import { harnesses } from './harnesses.ts';
import { FAMILY_MEMBERS, lessons } from './lessons.ts';
import { memories } from './memories/index.ts';
import { prompts } from './prompts.ts';
import { skills } from './skills/index.ts';
import { tools } from './tools/index.ts';
import type { Family } from './types/basics.ts';
import type { EncounterDef, EnemyDef } from './types/enemy.ts';
import type { EventDef } from './types/event.ts';
import type { HarnessDef, SystemPromptDef } from './types/harness.ts';
import type { LessonDef, MemoryDef, SkillDef, ToolDef } from './types/items.ts';

export const GAME_TITLE = 'Loop Engineer';

/** Bump whenever any content number or rule changes; exact replay needs the same value. */
export const CONTENT_VERSION = 1;

export interface Content {
  readonly tools: readonly ToolDef[];
  readonly skills: readonly SkillDef[];
  readonly memories: readonly MemoryDef[];
  readonly lessons: readonly LessonDef[];
  readonly enemies: readonly EnemyDef[];
  readonly encounters: readonly EncounterDef[];
  readonly events: readonly EventDef[];
  readonly harnesses: readonly HarnessDef[];
  readonly prompts: readonly SystemPromptDef[];
  /** Enemy ids per family (lessons are offered by family). */
  readonly families: Readonly<Record<Family, readonly string[]>>;
}

/** The kinds of the bundle that are id lists. */
export const CONTENT_KINDS = [
  'tools',
  'skills',
  'memories',
  'lessons',
  'enemies',
  'encounters',
  'events',
  'harnesses',
  'prompts',
] as const satisfies readonly (keyof Content)[];

export type ContentKind = (typeof CONTENT_KINDS)[number];

export const content: Content = {
  tools,
  skills,
  memories,
  lessons,
  enemies,
  encounters,
  events,
  harnesses,
  prompts,
  families: FAMILY_MEMBERS,
};
