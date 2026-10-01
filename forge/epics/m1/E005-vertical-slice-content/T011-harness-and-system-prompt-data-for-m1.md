---
id: T011
epic: E005
title: Harness and system prompt data for M1
summary: "Terminal Purist and IDE Companion harness defs with traits as rules, and the senior, concise and step_by_step system prompts with weights, effects and strings."
keywords: ["content", "harness", "system-prompts", "traits", "starters"]
type: task
status: done
priority: p1
model: sonnet
size: S
depends_on: [T010]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T011: Harness and system prompt data for M1

## Goal

Provide the two M1 harnesses and three starter prompts as data so the run reducer can start runs and the sim can apply their stats and effects.

## Context

- Epic: [E005](EPIC.md)
- [Harnesses: Harness stats, Traits, System prompts](../../../../docs/game/content/harnesses.md)
- [Harness and loadout: Model stats](../../../../docs/game/systems/harness-loadout.md#model-stats)
- Code: `src/content/harnesses.ts`, `src/content/prompts.ts`, `src/content/strings/en.ts`
- Out of scope: Swarm Orchestrator, YOLO Mode and prompts tenx/clarify/json_only (E013); trait and prompt behaviour in the sim (E007).

## Acceptance Criteria

- [x] Test `harness stats match the GDD` asserts window, speed, accuracy, max Trust, base weight, slots and starter order for both M1 harnesses
- [x] Test `prompts match the GDD` asserts weights 8/4/10 and the encoded effects of senior, concise and step_by_step
- [x] Muscle Memory and Undo Stack are expressed as DSL rules, step_by_step's double resolve as a registered handler id
- [x] Every harness and prompt has name, line and flavour keys in en.ts (test)

## Subtasks

- [x] Harness defs
- [x] Prompt defs
- [x] Strings

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: test `harness stats match the GDD` passed
- 2026-10-01: AC2 verified: test `prompts match the GDD` passed (8/4/10, effects)
- 2026-10-01: AC3 verified: passive()/rule() trait rules; step_by_step uses handler double_first_resolve (test)
- 2026-10-01: AC4 verified: test on name/line/flavour keys in en.ts
- 2026-10-01: npm run check: all steps passed
- 2026-10-01: review requested
- 2026-10-01: addressed R021 F1: stash 4 on both harnesses, asserted in test
- 2026-10-01: review requested
- 2026-10-01: done (R023)
