// Loadout items: tools fire on cooldown, skills/memories/lessons are rule sets.
import type { Family, Rarity, Tag, TargetSel } from './basics.ts';
import type { Effect, Rule } from './dsl.ts';
import type { LessonId, MemoryId, SkillId, ToolId } from './ids.ts';
import type { UnlockRef } from './refs.ts';

export type Milestone = 1 | 2;

export interface ToolDef {
  readonly id: ToolId;
  readonly tags: readonly [Tag] | readonly [Tag, Tag];
  readonly rarity: Rarity;
  readonly weight: number;
  readonly cooldownMs: number;
  readonly output: number;
  readonly pipeMs?: number;
  readonly target: TargetSel;
  /** Effect values use V3 (v1, v2, v3). */
  readonly effects: readonly Effect[];
  readonly unlock: UnlockRef;
  readonly milestone: Milestone;
}

export interface SkillDef {
  readonly id: SkillId;
  readonly rarity: Rarity;
  readonly weight: number;
  readonly rules: readonly Rule[];
  readonly unlock: UnlockRef;
}

export interface MemoryDef {
  readonly id: MemoryId;
  readonly rarity: Rarity;
  readonly weight: number;
  readonly rules: readonly Rule[];
  readonly unlock: UnlockRef;
}

export interface LessonDef {
  readonly id: LessonId;
  readonly family: Family;
  readonly rules: readonly Rule[];
}
