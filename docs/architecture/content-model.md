---
title: Content model and effect DSL
summary: Typed TS content definitions (tools, skills, memories, enemies, encounters, events, harnesses), the trigger-condition-effect DSL, custom handlers, generated text and validation.
keywords: [content, dsl, effects, triggers, types, validation, data-driven]
type: doc
status: active
updated: 2026-10-01
related_code: [src/content/types/**, src/content/dsl/**, src/content/strings/en.ts, tools/content/**]
related: [sim-core.md, run-state.md, ../game/content/tools.md, ../game/content/skills.md, ../game/ux/localisation.md, adr/adr-004-content-typed-ts.md]
---

# Content model and effect DSL

## Contents
- Core types
- The DSL: rules = trigger -> condition -> effect
- Custom handlers
- Generated text
- Adding a content area
- Validation (`src/content/validate.ts`, run in tests)

Content is TypeScript data in `src/content`, built with small `define*` helpers so typos
fail at compile time ([ADR-004](adr/adr-004-content-typed-ts.md)). Text is never
literal: names and lines are string keys ([localisation](../game/ux/localisation.md)).

## Core types

```ts
export type Tag = 'Search' | 'Edit' | 'Test' | 'Shell' | 'Web' | 'Agent';
export type Rarity = 'common' | 'uncommon' | 'rare';
export type V3 = readonly [number, number, number];        // v1, v2, v3 values
export type TargetSel = 'front' | 'back' | 'lowest' | 'all' | 'self' | 'tool' | 'rightTool' | 'tools';

export interface ToolDef {
  id: ToolId; tags: readonly [Tag] | readonly [Tag, Tag]; rarity: Rarity;
  weight: number; cooldownMs: number; output: number; pipeMs?: number;
  target: TargetSel; effects: readonly Effect[];           // values use V3
  unlock: UnlockRef; milestone: 1 | 2;
}
export interface SkillDef  { id: SkillId; rarity: Rarity; weight: number; rules: readonly Rule[]; unlock: UnlockRef }
export interface MemoryDef { id: MemoryId; rarity: Rarity; weight: number; rules: readonly Rule[]; unlock: UnlockRef }
export interface LessonDef { id: LessonId; family: Family; rules: readonly Rule[] }
export interface EnemyDef {
  id: EnemyId; family: Family; homePhase: 1 | 2 | 3; sev: number; guard?: number;
  traits: readonly Trait[]; opening?: readonly Intent[]; cycle: readonly Intent[];
  stages?: readonly Stage[]; art: readonly string[];
}
export interface Intent { id: IntentId; windupMs: number; verbs: readonly Verb[] } // 1–2 verbs
export interface EncounterDef { id: EncounterId; phase: 1 | 2 | 3; pool: 'easy' | 'hard' | 'elite' | 'boss'; enemies: readonly EnemyId[]; deadlineMs?: number }
```

Ids are plain string aliases (`ToolId`, `SkillId`, `MemoryId`, `LessonId`, `EnemyId`,
`IntentId`, `EncounterId`, `HarnessId`, `PromptId`, `EventId`, `HandlerId`, `UnlockId`),
not literal unions. Cross-references are validated at test time by `src/content`
validation, not by the compiler.

Further types in `src/content/types`: `Value` (`V3 | number`), `Zone`, `Status`, `Family`,
`Filter`, `Selector`, `Verb`/`VerbSel`, `Trait`, `Stage`, `FightModifier`, `ToolPick`,
`Outcome`, `EventDef`/`EventChoice`, `HarnessDef`, `HarnessTrait`, `SystemPromptDef`,
`ModelStats`, `Slots`, `Accuracy`, `Milestone`, `UnlockRef` (`'base'` or `{ node }`), and the
runtime lists `TRIGGER_KINDS`, `COND_KINDS`, `EFFECT_KINDS`, `TRAIT_KINDS`, `VERB_KINDS`.

## The DSL: rules = trigger -> condition -> effect

```ts
export type Trigger =
  | { on: 'fightStart' } | { on: 'fightWon' } | { on: 'every'; ms: number }
  | { on: 'toolFired'; tag?: Tag; tool?: ToolId } | { on: 'compaction' }
  | { on: 'damaged'; min?: number } | { on: 'guardGained'; fromTool?: boolean }
  | { on: 'trustBelow'; pct: number } | { on: 'passive' };   // always-on modifiers
export type Cond =
  | { if: 'zone'; is: Zone } | { if: 'piped' } | { if: 'nth'; n: number }
  | { if: 'adjacentSharesTag' } | { if: 'cooldownAtMost'; ms: number }
  | { if: 'oncePerFight' } | { if: 'oncePerRun' } | { if: 'cooldown'; ms: number };
export type Effect =
  | { do: 'dmg'; v: V3 | number; target?: TargetSel; perSignalTenth?: V3 }
  | { do: 'guard'; v: V3 | number } | { do: 'heal'; v: V3 | number }
  | { do: 'prime'; filter: Filter; pct: V3 | number; count?: number }
  | { do: 'status'; status: Status; ms: V3 | number; sel: Selector }
  | { do: 'clearStatus'; status: Status; sel: Selector }
  | { do: 'charge'; ms: V3 | number; sel: Selector } | { do: 'removeCtx'; v: V3 | number }
  | { do: 'compact' } | { do: 'summon'; v: V3; lifeMs: number; everyMs: number; report: number }
  | { do: 'mod'; stat: ModStat; v: number; filter?: Filter }   // passive stat modifiers
  | { do: 'custom'; handler: HandlerId; args?: Readonly<Record<string, number>> };
export interface Rule { when: Trigger; if?: readonly Cond[]; then: readonly Effect[] }
```

Rules are written with the `rule(when, then, conds?)` and `passive(...effects)` builders
from `src/content/dsl/rule.ts`, never as `{ when, then }` object literals (Biome
`noThenProperty`: thenables are a hazard).

Tool data lives in `src/content/tools/` (one module per tag group, `tools` array in
`index.ts`); names and flavour in `src/content/strings/en-tools.ts`, merged into `en` via
the generated registry (see "Adding a content area").
Target `tool` is one own tool picked by the effect selectors; `clearStatus` removes a timed
status (`retry_with_backoff` clears Throttle on `longestCharge`, T012).

`ModStat` covers the passive numbers: `rate`, `dmgPct`, `dmgFlat`, `output`, `window`,
`pipeMs`, `focusPct`, `noiseBlock`, `throttleDurPct`, `stunDurPct`, `dmgTakenPct`,
`credits`, `slots.tool`, `slots.memory`, `rerollCost`, `healPct`.

Example (Grep First):

```ts
export const grepFirst = defineSkill({
  id: 'grep_first', rarity: 'uncommon', weight: 3, unlock: base,
  rules: [rule({ on: 'toolFired', tag: 'Search' },
               [{ do: 'prime', filter: { tag: 'Edit' }, pct: 50 }])],
});
```

## Custom handlers

Bosses and a few traits need logic that the DSL does not express (stage switches, Hidden
reveal, SLA timer). They live in `src/sim/handlers/` as named pure functions
`(sim, args) => void` registered in a typed `handlers` map. Rules: a handler emits events
like any effect; each has a unit test; content may only reference handler ids that exist
(validated). Target: ≤ 10 handlers in the full game.

## Generated text

Each effect, trigger, condition and trait kind has one string template
(`effect.dmg = "deal {n} damage to {target}"`; the target is a `{target}` placeholder,
not a per-target key). Tooltips and plain-English
lines are composed from templates and current values, so text cannot drift from data.
Flavour lines and names are separate keys.

## Adding a content area

A new area is added by creating files only; `src/content/strings/en.ts` and
`src/content/index.ts` are hub files and are not edited (T099, RT002 P1).

1. Data: put the defs in their own module in the kind's folder (`src/content/<kind>/`,
   e.g. `enemies/yak-shave.ts`) and add it to that kind's barrel `<kind>/index.ts`, which
   owns catalogue order. `src/content/index.ts` imports one barrel per kind and only
   changes when a new kind is added to `Content`.
2. Strings: create `src/content/strings/en-<area>.ts` exporting `en<Area>` (`en-yak-shave.ts`
   exports `enYakShave`), a flat `as const` record.
3. Run `npm run content:index`. It rewrites the generated `src/content/strings/areas.gen.ts`
   (one import, registry entry and spread per `en-*.ts`); `en` = `{ ...enCore, ...enAreas }`.
   Never edit `areas.gen.ts` by hand; on a merge conflict there, rerun the command.

Checks (vitest, so `npm run check` and CI fail on drift):
`tools/content/strings-registry.test.ts` fails when an `en-*.ts` module is missing from
`areas.gen.ts` or the file differs from the generator output; `en.test.ts` fails on a key
defined twice across `enCore` and the area modules (a spread would override it silently) and
asserts the key count of `en` equals the sum of its parts. Unknown keys stay a `tsc` error.
The list is a checked-in static module, not a runtime glob, so content runs on plain Node 24
([ADR-006](adr/adr-006-native-node-imports.md)).

## Validation (`src/content/validate.ts`, run in tests)

1. Ids unique per kind; every referenced id exists (enemies in encounters, unlock refs,
   handler ids, string keys).
2. Number budgets: `weight` 0–6, `cooldownMs`/`windupMs` ≥ 1000 and multiples of 50,
   output −20..10, V3 values non-decreasing, Severity > 0.
3. Every tool has 1–2 tags; every item has name, line and flavour keys in `en`.
4. Every encounter fits ≤ 5 enemies; every phase has ≥ 5 easy, ≥ 5 hard, ≥ 2 elite
   encounters and exactly 1 boss (M1: 1 elite).
5. Milestone flags match the slice lists in the GDD (a test reads the M1 id list).
6. Snapshot of a content summary table (counts per kind and rarity) to catch accidental
   deletions.

`CONTENT_VERSION` (integer) is bumped whenever any number or rule changes; it is stored
in saves ([save system](save.md)).
