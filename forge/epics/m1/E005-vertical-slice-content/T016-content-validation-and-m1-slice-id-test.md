---
id: T016
epic: E005
title: Content validation and M1 slice id test
summary: "src/content/validate.ts implementing validation rules 1-6, the M1 id-list test against the vertical slice, starting-baseline checks and CONTENT_VERSION."
keywords: ["content", "validation", "slice", "tests", "content-version"]
type: task
status: in-progress
priority: p1
model: opus
size: M
depends_on: [T011, T012, T013, T014, T015]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T016: Content validation and M1 slice id test

## Goal

Catch broken references, out-of-budget numbers and accidental deletions automatically, and prove the content matches the vertical-slice lists exactly.

## Context

- Epic: [E005](EPIC.md)
- [Content model: Validation](../../../../docs/architecture/content-model.md#validation-srccontentvalidatets-run-in-tests)
- [Vertical slice: In scope](../../../../docs/game/vertical-slice.md#in-scope)
- [Harnesses: Starting baselines](../../../../docs/game/content/harnesses.md#starting-baselines-prompt-included)
- Code: `src/content/validate.ts`, `src/content/validate.test.ts`
- Out of scope: Changing any content number (E010 tuning), M2 counts per phase.

## Acceptance Criteria

- [ ] `npx vitest run src/content` passes with a test and a failing fixture for each of validation rules 1-6
- [ ] Test `M1 ids match the vertical slice` compares ids with the slice lists (12 tools, 8 skills, 4 memories, 4 events, 12 encounters, 2 harnesses, 3 prompts)
- [ ] Test `starting baselines` reproduces the six M1 cells of harnesses.md "Starting baselines"
- [ ] A content summary snapshot (counts per kind and rarity) exists and `CONTENT_VERSION` is an exported integer

## Subtasks

- [ ] Reference and id checks
- [ ] Number budgets
- [ ] String key checks
- [ ] Slice id test and snapshot

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
