---
id: T009
epic: E005
title: Content types and effect DSL builders
summary: "Typed content model in src/content/types and dsl: item, enemy, encounter, harness, prompt and event defs, Rule/Trigger/Cond/Effect unions, verbs, traits and define* helpers."
keywords: ["content", "types", "dsl", "effects", "triggers", "builders"]
type: task
status: ready
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
- [Content model: Core types, The DSL](../../../docs/architecture/content-model.md)
- [ADR-004 typed TS content](../../../docs/architecture/adr/adr-004-content-typed-ts.md)
- [Statuses: Enemy action verbs and traits](../../../docs/game/systems/statuses.md#enemy-action-verbs)
- [Harness and loadout: Item kinds, Model stats](../../../docs/game/systems/harness-loadout.md)
- Code: `src/content/types/`, `src/content/dsl/`
- Out of scope: Any content data (other E005 tasks), validation rules, string templates, handler implementations (E007).

## Acceptance Criteria

- [ ] `npx tsc --noEmit` passes with types for every kind in content-model.md "Core types" plus HarnessDef, SystemPromptDef, EventDef, Verb, Trait and FightModifier
- [ ] Test `define helpers freeze content in dev` shows every define* helper returns a frozen object
- [ ] A type-level test proves an unknown trigger `on` value and a misspelled effect `do` fail to compile
- [ ] `src/content/types` imports nothing outside `src/content` (arch test or grep evidence in the Log)

## Subtasks

- [ ] Core types and id unions
- [ ] DSL unions: Trigger, Cond, Effect, Rule, ModStat, Selector, Filter
- [ ] Intent, Verb and Trait types for the M1 traits (Split, Grow, Outage, Blocked, Armor)
- [ ] define* helpers with dev-mode freeze

## Notes


## Log

- 2026-10-01: created
