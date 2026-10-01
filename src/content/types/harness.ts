// Harnesses (character classes) and system prompts (docs/game/content/harnesses.md).
import type { Rule } from './dsl.ts';
import type { HarnessId, PromptId, SkillId, ToolId } from './ids.ts';
import type { Milestone } from './items.ts';
import type { UnlockRef } from './refs.ts';

/** Cold penalty 15 / 25 / 35%, decoy skipping. */
export type Accuracy = 'high' | 'normal' | 'low';

export interface ModelStats {
  /** Context window W in tokens. */
  readonly window: number;
  /** Base charge rate in percent (100 = normal). */
  readonly speed: number;
  readonly accuracy: Accuracy;
  /** Max Trust at run start. */
  readonly trust: number;
  /** Fixed tokens always in the baseline. */
  readonly baseWeight: number;
}

export interface Slots {
  readonly tools: number;
  readonly skills: number;
  readonly memory: number;
  readonly stash: number;
}

/** Built-in harness trait; cannot be removed. */
export interface HarnessTrait {
  readonly id: string;
  readonly rules: readonly Rule[];
}

export interface HarnessDef {
  readonly id: HarnessId;
  readonly model: ModelStats;
  readonly slots: Slots;
  /** Starter tools in slot order. */
  readonly tools: readonly ToolId[];
  readonly skills: readonly SkillId[];
  readonly trait: HarnessTrait;
  readonly unlock: UnlockRef;
  readonly milestone: Milestone;
}

export interface SystemPromptDef {
  readonly id: PromptId;
  readonly weight: number;
  readonly rules: readonly Rule[];
  readonly unlock: UnlockRef;
  readonly milestone: Milestone;
}
