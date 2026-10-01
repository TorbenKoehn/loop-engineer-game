// Standup events and next-fight modifiers (docs/game/content/events.md).
import type { Rarity, Tag } from './basics.ts';
import type { EnemyId, EventId, MemoryId, ToolId } from './ids.ts';
import type { Milestone } from './items.ts';
import type { HandlerId, UnlockRef } from './refs.ts';

/** Stored in run state; applies to the next Task, elite or boss fight. */
export type FightModifier =
  | {
      readonly mod: 'addEnemy';
      readonly enemy: EnemyId;
      readonly count: number;
      readonly fights: number;
    }
  | { readonly mod: 'startNoise'; readonly tokens: number }
  | { readonly mod: 'startSignal'; readonly tokens: number }
  | { readonly mod: 'tagBonus'; readonly tag: Tag; readonly pct: number };

/** An owned tool picked by an event outcome; 'random' uses the event RNG. */
export interface ToolPick {
  readonly pick: 'leftmost' | 'rightmost' | 'random' | 'chosen';
  readonly tag?: Tag;
  readonly maxVersion?: 1 | 2 | 3;
  readonly minVersion?: 1 | 2 | 3;
}

export type Outcome =
  | { readonly do: 'credits'; readonly n: number }
  /** Restore (n > 0) or lose (n < 0) Trust. */
  | { readonly do: 'trust'; readonly n: number }
  | { readonly do: 'maxTrust'; readonly n: number }
  | {
      readonly do: 'version';
      readonly tool: ToolPick;
      readonly n: 1 | -1;
      /** Applied when no owned tool matches. */
      readonly otherwise?: readonly Outcome[];
    }
  | { readonly do: 'gainTool'; readonly tool?: ToolId; readonly rarity?: readonly Rarity[] }
  | { readonly do: 'gainSkill'; readonly rarity: readonly Rarity[] }
  | { readonly do: 'gainMemory'; readonly memory: MemoryId; readonly owned?: readonly Outcome[] }
  | { readonly do: 'deleteTool'; readonly tool: ToolPick }
  | { readonly do: 'slot'; readonly kind: 'tool' | 'memory'; readonly n: number }
  | { readonly do: 'nextFight'; readonly mod: FightModifier }
  /** A declared roll, shown as "pct%:" before the click. */
  | { readonly do: 'chance'; readonly pct: number; readonly then: readonly Outcome[] }
  | { readonly do: 'custom'; readonly handler: HandlerId };

export interface EventChoice {
  readonly id: string;
  /** Credits paid when the choice is taken. */
  readonly cost?: number;
  /** An equipped tool with this tag is required. */
  readonly needsTag?: Tag;
  readonly outcomes: readonly Outcome[];
}

export interface EventDef {
  readonly id: EventId;
  readonly phases: readonly (1 | 2 | 3)[];
  readonly unlock: UnlockRef;
  readonly milestone: Milestone;
  readonly choices: readonly EventChoice[];
}
