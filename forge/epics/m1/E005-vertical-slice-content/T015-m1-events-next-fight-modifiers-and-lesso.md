---
id: T015
epic: E005
title: M1 events, next-fight modifiers and lessons
summary: "The 4 vertical-slice Standup events as data, next-fight modifier types, the enemy family table and all 10 AGENTS.md lessons with strings."
keywords: ["content", "events", "standup", "lessons", "modifiers"]
type: task
status: done
priority: p1
model: sonnet
size: S
depends_on: [T010]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T015: M1 events, next-fight modifiers and lessons

## Goal

Provide the event and lesson data the run reducer and meta state need, with every outcome expressed in the documented verbs.

## Context

- Epic: [E005](EPIC.md)
- [Events: Rules, Catalogue (M1 rows), Next-fight modifiers (data)](../../../../docs/game/content/events.md)
- [AGENTS.md lessons: Enemy families, Lessons](../../../../docs/game/content/memories-lessons.md#agentsmd-lessons)
- Code: `src/content/events/`, `src/content/lessons.ts`, `src/content/strings/en.ts`
- Out of scope: Event resolution in the reducer (E004), lesson offer logic (E008), lesson combat effects (E007), the 12 M2 events.

## Acceptance Criteria

- [x] Test `M1 events match the catalogue` asserts phases, choices, requirements and outcomes of quick_tiny_change, pasted_log, underflow_answer and green_locally
- [x] Modifier types addEnemy, startNoise, startSignal and tagBonus exist with the fields from events.md
- [x] All 10 lessons exist with family, line key and rule, and the family table covers every phase-1 enemy and add
- [x] Every event setup line and choice has a string key in en.ts

## Subtasks

- [x] Event defs
- [x] Modifier types
- [x] Families and lessons
- [x] Strings

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: vitest src/content/events, test 'M1 events match the catalogue' passed
- 2026-10-01: AC2 verified: FightModifier types in src/content/types/event.ts (T010); events use addEnemy and startNoise
- 2026-10-01: AC3 verified: src/content/lessons.ts 10 lessons + FAMILY_MEMBERS; test checks every defined enemy is in its family
- 2026-10-01: AC4 verified: en-events.ts and en-lessons.ts spread in en.ts; test checks every setup and choice key
- 2026-10-01: npm run check green
- 2026-10-01: review requested
- 2026-10-01: done (R027)
