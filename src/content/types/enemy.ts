// Enemies, their intents (action verbs) and traits, and encounters
// (docs/game/systems/statuses.md "Enemy traits", "Enemy action verbs").
import type { Family, Tag } from './basics.ts';
import type { EncounterId, EnemyId, IntentId } from './ids.ts';
import type { HandlerId } from './refs.ts';

/** Which of the agent's tools an enemy verb hits ('all' = every tool). */
export type VerbSel = 'fastest' | 'leftmost' | 'rightmost' | 'all' | { readonly tag: Tag };

export type Verb =
  | { readonly verb: 'hit'; readonly n: number }
  | { readonly verb: 'multiHit'; readonly n: number; readonly times: number }
  | { readonly verb: 'noise'; readonly n: number }
  | { readonly verb: 'throttle'; readonly sel: VerbSel; readonly ms: number }
  | { readonly verb: 'slow'; readonly sel: VerbSel; readonly ms: number }
  | { readonly verb: 'stun'; readonly ms: number }
  | { readonly verb: 'guard'; readonly n: number }
  | { readonly verb: 'heal'; readonly n: number }
  | {
      readonly verb: 'spawn';
      readonly enemy: EnemyId;
      /** Cap on living copies of `enemy`. */
      readonly max: number;
      readonly at?: 'front' | 'back';
      /** Cap on spawns by this intent per fight. */
      readonly perFight?: number;
      /** Only spawn while fewer than this many other enemies are alive. */
      readonly maxOthers?: number;
    }
  | { readonly verb: 'redirect' }
  /** Bosses only. */
  | { readonly verb: 'custom'; readonly handler: HandlerId };

/** One enemy action: 1-2 verbs resolved together after the windup. */
export interface Intent {
  readonly id: IntentId;
  readonly windupMs: number;
  readonly verbs: readonly [Verb] | readonly [Verb, Verb];
}

/** The M1 traits; further traits join this union with their milestone. */
export type Trait =
  | { readonly trait: 'split'; readonly n: number; readonly pct: number; readonly child: EnemyId }
  | { readonly trait: 'grow'; readonly ms: number; readonly sev: number; readonly dmg: number }
  | { readonly trait: 'outage'; readonly tag: Tag }
  | { readonly trait: 'blocked' }
  | { readonly trait: 'armor'; readonly layers: number; readonly hp: number };

/** A boss stage; `layers` is the inclusive armor-layer range in which it is active. */
export interface Stage {
  readonly id: string;
  readonly layers?: readonly [number, number];
  readonly sev?: number;
  readonly traits?: readonly Trait[];
  readonly cycle: readonly Intent[];
}

export interface EnemyDef {
  readonly id: EnemyId;
  readonly family: Family;
  readonly homePhase: 1 | 2 | 3;
  readonly sev: number;
  readonly guard?: number;
  readonly traits: readonly Trait[];
  readonly opening?: readonly Intent[];
  readonly cycle: readonly Intent[];
  readonly stages?: readonly Stage[];
  /** Logic the DSL cannot express (stage switch, spawn rules); see src/sim/handlers. */
  readonly handler?: HandlerId;
  readonly art: readonly string[];
}

export interface EncounterDef {
  readonly id: EncounterId;
  readonly phase: 1 | 2 | 3;
  readonly pool: 'easy' | 'hard' | 'elite' | 'boss';
  /** Front to back. */
  readonly enemies: readonly EnemyId[];
  readonly deadlineMs?: number;
}
