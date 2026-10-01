---
id: T016
epic: E005
title: Content validation and M1 slice id test
summary: "src/content/validate.ts implementing validation rules 1-6, the M1 id-list test against the vertical slice, starting-baseline checks and CONTENT_VERSION."
keywords: ["content", "validation", "slice", "tests", "content-version"]
type: task
status: done
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

- [x] `npx vitest run src/content` passes with a test and a failing fixture for each of validation rules 1-6
- [x] Test `M1 ids match the vertical slice` compares ids with the slice lists (12 tools, 8 skills, 4 memories, 4 events, 12 encounters, 2 harnesses, 3 prompts)
- [x] Test `starting baselines` reproduces the six M1 cells of harnesses.md "Starting baselines"
- [x] A content summary snapshot (counts per kind and rarity) exists and `CONTENT_VERSION` is an exported integer

## Subtasks

- [x] Reference and id checks
- [x] Number budgets
- [x] String key checks
- [x] Slice id test and snapshot

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Layout: `src/content/index.ts` (the `content` bundle, `Content` type, `CONTENT_KINDS`, `CONTENT_VERSION = 1`); `src/content/validate.ts` (`validateContent(content, { milestone, slice, strings?, unlockNodes?, handlers? })` returns `[rule N] ...` messages, rules 1-5); rule modules in `src/content/validation/` (refs, numbers, strings, pools, slice, summary, walk). Rule 6 is `summarize` + `compareSummary` with an inline snapshot in `validation/slice.test.ts`.
- 2026-10-01: Rule 1 handler ids: a `handler.<id>` string is required (R013 F5 / T010 note). The handler registry lives in src/sim (E007), which src/content must not import, so `validateContent` takes an optional `handlers` set; E007 should call it with the registry keys. Unlock nodes: `UNLOCK_NODES` (`power_tools`, `loop_theory`) in `src/content/dsl/unlock.ts`; the unlock-tree epic extends it.
- 2026-10-01: Rule 3 accepts generated lines (T012 note): tools, skills, memories, lessons, prompt rules, harness traits and enemies must render through text.ts without a missing key; vocabulary keys (tag, tag.indef, zone, status, family, target, sel, stat) are checked from exhaustive `satisfies Record<Union, 1>` lists (closes R013 F5). Harnesses and prompts also need `name`/`line`/`flavour`, lessons `line`, enemies `name` plus intent and stage names, events `setup` plus choice labels.
- 2026-10-01: Rule 4 uses `POOL_RULES` per milestone (M1: phase 1, 1 elite; M2: phases 1-3, 2 elite) as written in content-model.md; no M2 content was added. Rule 5: tools, events, harnesses and prompts carry `milestone` and must be M1 exactly when listed; skills, memories and encounters have no flag, so every listed id must exist.
- 2026-10-01: Real data errors found by the validator: none (the M1 content passes rules 1-5 unchanged).
- 2026-10-01: R029: bundle moved from `catalogue.ts` into `src/content/index.ts` (F2); `parseSliceDoc`, `harnessIdOf` and `sliceOf` moved to test support `src/content/testing/slice-doc.ts` (F3; it stays fs-free because tests/arch.test.ts bans `node:fs` in non-test content files, so the tests read the doc); id ranges with different prefixes or a reversed range now throw (F4, test "id ranges in the slice table need one prefix").
- 2026-10-01: budget_override task_diff_lines: 651 production lines; reason: validator rules 1-6 + slice parser are one cohesive unit planned as one task (sizing miss, see RT001); orchestrator-approved 2026-10-01. Measured with `git diff --cached --numstat -M` per budgets.md: 651 production, 1001 total (Markdown excluded).
- 2026-10-01: Follow-ups (outside allowed paths): docs/architecture/content-model.md could name the bundle in `index.ts`, `UNLOCK_NODES` and the `handlers` option. Budget warnings introduced: `src/content` now has 12 files (warn_at 10, error 15) and 11 subdirs (warn 10); grouping harnesses.ts/prompts.ts/lessons.ts into a folder would clear them.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/content (14 files, 83 passed); src/content/validate.test.ts has "passes the M1 content" plus a failing fixture per rule (rule 1 x2, rules 2-6)
- 2026-10-01: AC2 verified: src/content/validation/slice.test.ts "M1 ids match the vertical slice" parses vertical-slice.md "In scope" (ranges p1e1-p1e5 expanded, harness names mapped) and asserts 12/8/4/4/12/2/3 ids equal the content ids
- 2026-10-01: AC3 verified: slice.test.ts "starting baselines" computes B and W from harness, prompt, starter tool and skill data and matches all six M1 cells of harnesses.md (and Focused zone)
- 2026-10-01: AC4 verified: slice.test.ts "counts per kind, rarity and pool match the snapshot" (inline snapshot) and "CONTENT_VERSION is an exported integer" (now src/content/index.ts)
- 2026-10-01: npm run check green (tsc, biome, vitest, harness:check 0 errors); src/content coverage 99.15% lines
- 2026-10-01: review requested
- 2026-10-01: addressed R029 (4 findings: F1 via orchestrator override, F2, F3, F4)
- 2026-10-01: npx vitest run src/content (14 files, 84 passed); npm run check green
- 2026-10-01: review requested
- 2026-10-01: done (R032)
