---
id: T011
epic: E005
title: Harness and system prompt data for M1
summary: "Terminal Purist and IDE Companion harness defs with traits as rules, and the senior, concise and step_by_step system prompts with weights, effects and strings."
keywords: ["content", "harness", "system-prompts", "traits", "starters"]
type: task
status: backlog
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

- [ ] Test `harness stats match the GDD` asserts window, speed, accuracy, max Trust, base weight, slots and starter order for both M1 harnesses
- [ ] Test `prompts match the GDD` asserts weights 8/4/10 and the encoded effects of senior, concise and step_by_step
- [ ] Muscle Memory and Undo Stack are expressed as DSL rules, step_by_step's double resolve as a registered handler id
- [ ] Every harness and prompt has name, line and flavour keys in en.ts (test)

## Subtasks

- [ ] Harness defs
- [ ] Prompt defs
- [ ] Strings

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
