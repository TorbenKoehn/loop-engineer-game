// Public combat API types (docs/architecture/sim-core.md "API"). Content arrives as resolved defs.
import type {
  EnemyDef,
  FightModifier,
  LessonDef,
  MemoryDef,
  ModelStats,
  SkillDef,
  SystemPromptDef,
  ToolDef,
} from '../../content/types/index.ts';
import type { CombatEvent } from '../events.ts';
import type { Seed } from '../rng.ts';

export type Version = 1 | 2 | 3;

export interface ToolSetup {
  readonly def: ToolDef;
  readonly version: Version;
}

/** Resolved harness stats, Trust and tools in slot order. */
export interface AgentSetup {
  readonly model: ModelStats;
  readonly trust: number;
  readonly maxTrust: number;
  readonly tools: readonly ToolSetup[];
  readonly usedOncePerRun: readonly string[];
}

export interface EncounterSetup {
  /** Front to back. */
  readonly enemies: readonly EnemyDef[];
  /** Defs that intents may spawn without being in the starting line, e.g. Side Quest. */
  readonly spawnDefs?: readonly EnemyDef[];
  readonly deadlineMs: number;
  readonly phase: 1 | 2 | 3;
  readonly loop: number;
}

export interface CombatInput {
  /** Forked by the run: 'combat/' + nodeId. */
  readonly seed: Seed;
  readonly agent: AgentSetup;
  readonly skills: readonly SkillDef[];
  readonly memories: readonly MemoryDef[];
  readonly lessons: readonly LessonDef[];
  readonly prompt: SystemPromptDef;
  /** Planned compaction threshold in percent; 0 = never. */
  readonly policy: 70 | 80 | 90 | 0;
  readonly encounter: EncounterSetup;
  readonly modifiers: readonly FightModifier[];
}

export type Outcome = 'win' | 'loss';
export type EndReason = 'resolved' | 'trust' | 'timeout';

/** Damage dealt per tool slot and damage taken by the agent. Zone time and compactions: E003. */
export interface CombatStats {
  readonly toolDamage: readonly number[];
  readonly damageTaken: number;
}

export interface CombatResult {
  readonly outcome: Outcome;
  readonly reason: EndReason;
  /** ms */
  readonly endT: number;
  readonly agentAfter: {
    readonly trust: number;
    readonly maxTrust: number;
    readonly usedOncePerRun: readonly string[];
  };
  /** Empty when `opts.log === false`. */
  readonly events: readonly CombatEvent[];
  readonly stats: CombatStats;
}

export interface CombatOptions {
  readonly log?: boolean;
}
