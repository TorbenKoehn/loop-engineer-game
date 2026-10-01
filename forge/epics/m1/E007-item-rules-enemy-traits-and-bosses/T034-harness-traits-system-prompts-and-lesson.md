---
id: T034
epic: E007
title: Harness traits, system prompts and lessons in combat
summary: "Muscle Memory and Undo Stack traits, senior/concise/step_by_step prompt effects (incl. double first activation) and all lesson effects working in fights."
keywords: ["harness", "traits", "system-prompts", "lessons", "sim"]
type: task
status: done
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

- [x] Muscle Memory: tools with weight ≤ 3 get rate +10 (test with grep and sed)
- [x] Undo Stack grants 15 Guardrails once per fight when damage leaves Trust below 30% of max (test)
- [x] senior, concise and step_by_step behave as in harnesses.md, including the first activation resolving twice with its output (tests)
- [x] Each lesson effect has a test; Deadline damage is unaffected by Process lessons

## Subtasks

- [x] Traits
- [x] Prompt effects and step_by_step handler
- [x] Lesson effects

## Notes

- Orchestrator 2026-10-01 (R040 F1): src/run/combat.ts `combatInput` does not yet pass harness trait rules to the sim (CombatInput has no field) - wire them here.

- 2026-10-01 (T034 attempt 1): `combatInput` now passes `trait: harness.trait`. Passive `custom` effects are hooks in `src/sim/combat/mods/custom.ts` (not the T037 registry): `double_first_resolve` (first activation's effects and output resolve twice with the same zone/item/prime mods; one `toolFired` with `d.echo: 1`; toolFired rules raised once), `context_noise_cut` (after Rot x2, before blockers), `throttle_shorter` (flat cut before % duration mods, floor = `min` arg). Real-content tests live in `src/run/combat.test.ts` because sim tests may not import content data (tests/arch.test.ts). Follow-up candidate: context.md "Noise" and statuses.md duration bullets could name the lesson cuts (no related_code there, left untouched).

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/run/combat.test.ts -t "Muscle Memory" (purist rates grep/cat 120, sed 110; IDE 100)
- 2026-10-01: AC2 verified: npx vitest run src/run/combat.test.ts -t "Undo Stack" (one guard 15 from 'a' at the hit leaving Trust 16 of 100, none at 30)
- 2026-10-01: AC3 verified: npx vitest run src/run/combat.test.ts -t "senior|concise|step_by_step" and src/sim/combat/mods/custom.test.ts -t double_first_resolve (W 50, pct +10, outputs -1 min 0, rates -5, first activation 2x damage and 2x output, echo 1)
- 2026-10-01: AC4 verified: npx vitest run src/run/combat.test.ts -t "lesson|_def|Deadline" (5 offense, 3 defense incl. min 1, context_def 7->5, infra_def 3000->2000 and min 50, Deadline sys damage identical with process_off+process_def) and custom.test.ts hooks (24 T034 tests passed)
- 2026-10-01: npm run check green (74 files, 669 tests; harness lint 0 errors); production diff ~85 lines
- 2026-10-01: review requested
- 2026-10-01: done (R064)
