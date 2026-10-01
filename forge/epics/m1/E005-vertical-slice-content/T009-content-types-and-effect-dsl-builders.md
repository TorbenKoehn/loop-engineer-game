---
id: T009
epic: E005
title: Content types and effect DSL builders
summary: "Typed content model in src/content/types and dsl: item, enemy, encounter, harness, prompt and event defs, Rule/Trigger/Cond/Effect unions, verbs, traits and define* helpers."
keywords: ["content", "types", "dsl", "effects", "triggers", "builders"]
type: task
status: done
priority: p0
model: opus
size: M
depends_on: [T001]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T009: Content types and effect DSL builders

## Goal

Provide the compile-time content model every other module builds on: the sim imports only these types, and data modules use the define* helpers so typos fail at compile time. Sim, run and content data tasks all start from here.

## Context

- Epic: [E005](EPIC.md)
- [Content model: Core types, The DSL](../../../../docs/architecture/content-model.md)
- [ADR-004 typed TS content](../../../../docs/architecture/adr/adr-004-content-typed-ts.md)
- [Statuses: Enemy action verbs and traits](../../../../docs/game/systems/statuses.md#enemy-action-verbs)
- [Harness and loadout: Item kinds, Model stats](../../../../docs/game/systems/harness-loadout.md)
- Code: `src/content/types/`, `src/content/dsl/`
- Out of scope: Any content data (other E005 tasks), validation rules, string templates, handler implementations (E007).

## Acceptance Criteria

- [x] `npx tsc --noEmit` passes with types for every kind in content-model.md "Core types" plus HarnessDef, SystemPromptDef, EventDef, Verb, Trait and FightModifier
- [x] Test `define helpers freeze content in dev` shows every define* helper returns a frozen object
- [x] A type-level test proves an unknown trigger `on` value and a misspelled effect `do` fail to compile
- [x] `src/content/types` imports nothing outside `src/content` (arch test or grep evidence in the Log)

## Subtasks

- [x] Core types and id unions
- [x] DSL unions: Trigger, Cond, Effect, Rule, ModStat, Selector, Filter
- [x] Intent, Verb and Trait types for the M1 traits (Split, Grow, Outage, Blocked, Armor)
- [x] define* helpers with dev-mode freeze

## Notes

- Layout: `src/content/types/` (basics, ids, refs, dsl, items, enemy, harness, event, kinds,
  index barrel) and `src/content/dsl/` (define, freeze, rule, unlock). Types import only
  `./*.ts` inside the folder; `kinds.ts` is the only runtime module there.
- Id types (`ToolId`, `EnemyId`, ...) are plain `string` aliases: the sim may import only
  `src/content/types*`, never data, so literal unions come from the data via the define*
  helpers, which keep the literal id (`(typeof tools)[number]['id']`). Cross-references
  (encounter enemies, starter tools, handler ids) are checked by validate.ts rule 1 (T016).
- define* signature `<const Id>(def: Def & { id: Id })`: keeps excess-property checks, so a
  misspelled field (`deadline` for `deadlineMs`) also fails to compile.
- Freeze: deep freeze unless `import.meta.env.PROD === true`, so dev, Vitest and native Node
  tools (no `import.meta.env`) freeze; production builds skip it.
- Biome `noThenProperty` (recommended) flags object literals with a written-out `then:`
  key, i.e. every literal `Rule`. Data tasks (T011-T015) should use `rule(when, then, conds?)`
  and `passive(...effects)` from `src/content/dsl/rule.ts` (shorthand `then` is not flagged).
  Alternative for the orchestrator: a Biome override for `src/content/**` (not in my scope).
- Types not spelled out in content-model.md and defined here: `Family`, `Zone` (lowercase,
  matches event-log `zone:focused`), `Status` (haste/slow/throttle/stun), `Value`,
  `Filter`, `Selector`, `VerbSel`, `Stage`, `UnlockRef` (`'base' | { node }`),
  `HarnessTrait`, `ModelStats`, `Slots`, `EventChoice`, `Outcome`, `ToolPick`.
  Enemy verbs: `{ verb: 'hit', n }` etc.; `spawn` has optional `at`, `perFight`, `maxOthers`
  for Yak Shave and Monolith. `VerbSel` keeps statuses.md `all` (= every tool).
- Kind lists `TRIGGER_KINDS`, `COND_KINDS`, `EFFECT_KINDS`, `TRAIT_KINDS`, `VERB_KINDS`
  (types/kinds.ts) are proven equal to their unions for T010 templates.
- Coupling: `Zone` and `Status` live here; sim tasks (T004, T025) should import them from
  `src/content/types/index.ts` instead of redefining. No `src/sim` types were needed.
- ModStat has no slow duration stat; Lockfile ("Throttle and Slow 50% shorter") needs either
  `throttleDurPct` covering Slow or a new stat (docs change, T013 to decide).

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx tsc --noEmit exit 0; types for ToolDef, SkillDef, MemoryDef, LessonDef, EnemyDef, Intent, Stage, EncounterDef, Tag, Rarity, V3, TargetSel, Trigger, Cond, Effect, Rule, ModStat, Selector, Filter plus HarnessDef, SystemPromptDef, EventDef, Verb, Trait, FightModifier in src/content/types/
- 2026-10-01: AC2 verified: npx vitest run src/content, test `define helpers freeze content in dev` passes for all 9 define* helpers (top level and nested); 14 passed in 3 files
- 2026-10-01: AC3 verified: src/content/dsl/define.test.ts "DSL types reject typos" uses @ts-expect-error for `on: 'fightStrat'` and `do: 'dammage'` plus expectTypeOf().not.toExtend; tsc exit 0, and with the directives stripped tsc reports TS2820 'fightStrat' and TS2322 'dammage'
- 2026-10-01: AC4 verified: test src/content/types-boundary.test.ts (every specifier relative, .ts, inside src/content); grep -rhoE "from '[^']+'" src/content/types/ lists only ./basics, ./ids, ./refs, ./dsl, ./items, ./enemy, ./event, ./harness, ./kinds
- 2026-10-01: npm run check exit 0 (tsc, biome, vitest 78 passed, harness:check 0 errors); node imports src/content/dsl/define.ts natively (ADR-006)
- 2026-10-01: review requested
- 2026-10-01: done (R009)
