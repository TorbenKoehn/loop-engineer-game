// The rule DSL: trigger -> conditions -> effects (docs/architecture/content-model.md).
import type { Family, Status, Tag, TargetSel, V3, Value, Zone } from './basics.ts';
import type { ToolId } from './ids.ts';
import type { HandlerId } from './refs.ts';

export type Trigger =
  | { readonly on: 'fightStart' }
  | { readonly on: 'fightWon' }
  | { readonly on: 'every'; readonly ms: number }
  | { readonly on: 'toolFired'; readonly tag?: Tag; readonly tool?: ToolId }
  | { readonly on: 'compaction' }
  | { readonly on: 'damaged'; readonly min?: number }
  | { readonly on: 'guardGained'; readonly fromTool?: boolean }
  | { readonly on: 'trustBelow'; readonly pct: number }
  /** Always-on modifiers. */
  | { readonly on: 'passive' };

export type Cond =
  | { readonly if: 'zone'; readonly is: Zone }
  | { readonly if: 'piped' }
  | { readonly if: 'nth'; readonly n: number }
  | { readonly if: 'adjacentSharesTag' }
  | { readonly if: 'cooldownAtMost'; readonly ms: number }
  | { readonly if: 'oncePerFight' }
  | { readonly if: 'oncePerRun' }
  | { readonly if: 'cooldown'; readonly ms: number };

/** Which tools (or enemies) an item effect matches. Every given field must match. */
export interface Filter {
  readonly tag?: Tag;
  readonly tool?: ToolId;
  readonly maxWeight?: number;
  readonly maxCooldownMs?: number;
  /** Enemy family, for effects that depend on the enemy hit or hitting. */
  readonly family?: Family;
}

/** Recipient of a status or charge effect: a combat target or a single own tool. */
export type Selector =
  | TargetSel
  | 'fastest'
  | 'leftmost'
  | 'rightmost'
  | 'longestCharge'
  | { readonly tag: Tag };

export type ModStat =
  | 'rate'
  | 'dmgPct'
  | 'dmgFlat'
  | 'output'
  | 'window'
  | 'pipeMs'
  | 'focusPct'
  | 'noiseBlock'
  | 'throttleDurPct'
  | 'stunDurPct'
  | 'dmgTakenPct'
  | 'credits'
  | 'slots.tool'
  | 'slots.memory'
  | 'rerollCost'
  | 'healPct';

export type Effect =
  | {
      readonly do: 'dmg';
      readonly v: Value;
      readonly target?: TargetSel;
      readonly perSignalTenth?: V3;
    }
  | { readonly do: 'guard'; readonly v: Value }
  | { readonly do: 'heal'; readonly v: Value }
  | { readonly do: 'prime'; readonly filter: Filter; readonly pct: Value; readonly count?: number }
  | { readonly do: 'status'; readonly status: Status; readonly ms: Value; readonly sel: Selector }
  /** Removes a timed status, e.g. Throttle (retry_with_backoff). */
  | { readonly do: 'clearStatus'; readonly status: Status; readonly sel: Selector }
  | { readonly do: 'charge'; readonly ms: Value; readonly sel: Selector }
  | { readonly do: 'removeCtx'; readonly v: Value }
  | { readonly do: 'compact' }
  | {
      readonly do: 'summon';
      readonly v: V3;
      readonly lifeMs: number;
      readonly everyMs: number;
      readonly report: number;
    }
  /** Passive stat modifier. */
  | { readonly do: 'mod'; readonly stat: ModStat; readonly v: number; readonly filter?: Filter }
  | {
      readonly do: 'custom';
      readonly handler: HandlerId;
      readonly args?: Readonly<Record<string, number>>;
    };

export interface Rule {
  readonly when: Trigger;
  readonly if?: readonly Cond[];
  readonly then: readonly Effect[];
}
