---
id: T034
epic: E007
title: Harness traits, system prompts and lessons in combat
summary: "Muscle Memory and Undo Stack traits, senior/concise/step_by_step prompt effects (incl. double first activation) and all lesson effects working in fights."
keywords: ["harness", "traits", "system-prompts", "lessons", "sim"]
type: task
status: in-progress
priority: p1
model: opus
size: M
depends_on: [T033, T029, T011, T015]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T034: Harness traits, system prompts and lessons in combat

## Goal

The harness and prompt chosen at run start, and the AGENTS.md lesson, change fights exactly as their cards say, which is what makes the harness choice matter.

## Context

- Epic: [E007](EPIC.md)
- [Harnesses: Traits, System prompts](../../../../docs/game/content/harnesses.md#traits-built-in-cannot-be-removed)
- [Lessons table and Deadline note](../../../../docs/game/content/memories-lessons.md#lessons)
- [Content model: Custom handlers](../../../../docs/architecture/content-model.md#custom-handlers)
- Code: `src/sim/combat/rules.ts`, `src/sim/handlers/`
- Out of scope: Swarm and YOLO traits, prompts tenx/clarify/json_only (E013).

## Acceptance Criteria

- [ ] Muscle Memory: tools with weight ≤ 3 get rate +10 (test with grep and sed)
- [ ] Undo Stack grants 15 Guardrails once per fight when damage leaves Trust below 30% of max (test)
- [ ] senior, concise and step_by_step behave as in harnesses.md, including the first activation resolving twice with its output (tests)
- [ ] Each lesson effect has a test; Deadline damage is unaffected by Process lessons

## Subtasks

- [ ] Traits
- [ ] Prompt effects and step_by_step handler
- [ ] Lesson effects

## Notes

- Orchestrator 2026-10-01 (R040 F1): src/run/combat.ts `combatInput` does not yet pass harness trait rules to the sim (CombatInput has no field) - wire them here.

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
