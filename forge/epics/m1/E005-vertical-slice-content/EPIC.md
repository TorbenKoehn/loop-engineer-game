---
id: E005
title: Vertical slice content
summary: "Typed TS content for M1: types and DSL builders, generated text, 2 harnesses, 3 prompts, 12 tools, 8 skills, 4 memories, phase-1 enemies, elite, boss, 12 encounters, 4 events, lessons."
keywords: ["content", "dsl", "types", "slice", "validation", "strings", "m1"]
type: epic
status: backlog
priority: p0
milestone: m1
updated: 2026-10-01
related: ["../../../../docs/architecture/content-model.md", "../../../../docs/game/vertical-slice.md", "../../../../docs/game/content/tools.md", "../../../../docs/game/content/phase-1-implement.md", "../../../../docs/game/content/harnesses.md", "../../../../docs/game/ux/localisation.md"]
---

# E005: Vertical slice content

## Goal

M1 vertical slice. After this epic every content id listed in the vertical slice exists as typed, frozen, validated data with string keys and generated plain-English lines, so the sim, run reducer and UI consume real content instead of fixtures.

## Scope

- Content types, effect DSL and define* builders ([content model](../../../../docs/architecture/content-model.md))
- String table and generated text templates ([localisation](../../../../docs/game/ux/localisation.md))
- M1 harnesses and system prompts ([harnesses](../../../../docs/game/content/harnesses.md))
- 12 M1 tools, 8 skills, 4 memories ([tools](../../../../docs/game/content/tools.md), [skills](../../../../docs/game/content/skills.md), [memories](../../../../docs/game/content/memories-lessons.md))
- Phase-1 enemies, Yak Shave, Legacy Monolith and encounters p1e1–p1e5, p1h1–p1h5, p1x1, p1b ([phase 1](../../../../docs/game/content/phase-1-implement.md))
- 4 M1 events, next-fight modifiers, 10 lessons ([events](../../../../docs/game/content/events.md))
- Content validation rules 1–6 and the M1 id-list test

## Out of Scope

- Behaviour of rules, traits and handlers in the sim (E007)
- Final ASCII portraits (E011) and SFX presets (E011)
- M2 content: other tools, skills, memories, events, phases 2–3 (E012–E014)
- Balance tuning of numbers (E010)

## Definition of Done

- [ ] All E005 tasks done with approved reviews
- [ ] Test "M1 ids match the vertical slice" passes
- [ ] Content validation tests pass with a failing fixture per rule
- [ ] Every content item has name, plain-English line and flavour keys in en.ts
- [ ] src/content line coverage ≥ 90% for builders and validate
