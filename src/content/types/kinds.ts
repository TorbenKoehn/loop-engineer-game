// Runtime lists of every DSL kind, for templates and exhaustive tests.
// types.test.ts proves each list equals its union exactly.
import type { Cond, Effect, Trigger } from './dsl.ts';
import type { Trait, Verb } from './enemy.ts';

export const TRIGGER_KINDS = [
  'fightStart',
  'fightWon',
  'every',
  'toolFired',
  'compaction',
  'damaged',
  'guardGained',
  'trustBelow',
  'passive',
] as const satisfies readonly Trigger['on'][];

export const COND_KINDS = [
  'zone',
  'piped',
  'nth',
  'adjacentSharesTag',
  'cooldownAtMost',
  'oncePerFight',
  'oncePerRun',
  'cooldown',
] as const satisfies readonly Cond['if'][];

export const EFFECT_KINDS = [
  'dmg',
  'guard',
  'heal',
  'prime',
  'status',
  'clearStatus',
  'charge',
  'removeCtx',
  'compact',
  'summon',
  'mod',
  'custom',
] as const satisfies readonly Effect['do'][];

export const TRAIT_KINDS = [
  'split',
  'grow',
  'outage',
  'blocked',
  'armor',
] as const satisfies readonly Trait['trait'][];

export const VERB_KINDS = [
  'hit',
  'multiHit',
  'noise',
  'throttle',
  'slow',
  'stun',
  'guard',
  'heal',
  'spawn',
  'redirect',
  'custom',
] as const satisfies readonly Verb['verb'][];
