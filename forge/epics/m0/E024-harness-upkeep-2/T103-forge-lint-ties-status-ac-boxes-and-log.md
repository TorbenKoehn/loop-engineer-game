---
id: T103
epic: E024
title: Forge lint ties status, AC boxes and Log
summary: "Three forge integrity errors: a done task with an unchecked AC, a checked AC in review or done without an `AC<n> verified` Log line, and a `done (R###)` Log line on a task not done."
keywords: ["forge", "lint", "integrity", "acceptance-criteria", "log", "status", "bookkeeping"]
type: task
status: done
priority: p0
model: sonnet
size: S
updated: 2026-10-01
related: ["EPIC.md", "../../../retros/RT004-fourth-retro-e007-e008-e009-sim-save-and.md"]
---

# T103: Forge lint ties status, AC boxes and Log

## Goal

Bookkeeping slipped past the delegate checklist about once every four tasks: T046 reached
review with checked AC and no evidence lines (R059 F1, major), and a worktree merge
committed T051 at status review with unchecked AC (RT004 What Went Wrong 2). After this
task `npm run harness:lint` fails on these states, so they are caught by the Stop hook
and `npm run check` instead of by the orchestrator's memory.

## Context

- Epic: [E024](EPIC.md); [RT004 proposal P2](../../../retros/RT004-fourth-retro-e007-e008-e009-sim-save-and.md)
- `tools/harness/budgets/forge/integrity.ts` (existing rules such as `done_needs_review`), `tools/harness/core/forge.ts`
- `tools/harness/test/rules.test.ts`, `tools/harness/README.md` section "Forge integrity"
- `docs/harness/workflow.md` sections "Task file conventions" (Log verbs) and "Definition of Done"
- Out of scope: new budgets in `harness.config.json`; rules for epics, reviews or retros; checking the evidence text itself; the commit-time gate (T107).

## Acceptance Criteria

- [x] Vitest test `done task with unchecked AC is an error` passes, and a done task with all AC checked yields no finding
- [x] Vitest test `checked AC without verified Log line is an error` passes for status `review` and `done`: AC n checked and no Log line containing `AC<n>` and `verified` yields an error naming AC n; one line covering several AC (`AC1, AC2 verified`) satisfies each named AC
- [x] Vitest test `done Log line on a task not done is an error` passes: a Log line `done (R###)` with status other than `done` yields an error
- [x] `npm run harness:lint` exits 0 on the finished tree; today T051, T086 and T096 break the second rule and get appended per-AC Log lines whose evidence comes from their reviews
- [x] `tools/harness/README.md` "Forge integrity" lists the three rule ids

## Subtasks

- [x] Three rules in `integrity.ts` (or a sibling module if it nears `ts_file_lines` warn_at)
- [x] Rule tests with in-memory task fixtures
- [x] Append Log lines to T051, T086, T096 (Log is append-only; do not touch their AC)
- [x] README entry

## Notes

- 2026-10-01: Source: RT004 P2; priority raised to p0 by the orchestrator. Planner count on 2026-10-01: 64 done tasks, 0 with unchecked AC, 3 (T051, T086, T096) with checked AC lacking a verified line, 0 with a stray `done (R###)` line.
- 2026-10-01: Allowed beyond Context: the T051, T086 and T096 task files (Log section only) and their review files (read only).

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: npx vitest run tools/harness/test/bookkeeping.test.ts (`done task with unchecked AC is an error` passes; all-checked done task yields no finding)
- 2026-10-01: AC2 verified: same file, `checked AC without verified Log line is an error` passes for review and done, incl. `AC1, AC2 verified`
- 2026-10-01: AC3 verified: same file, `done Log line on a task not done is an error` passes
- 2026-10-01: AC4 verified: npm run harness:lint 0 errors; Log lines appended to T051 (R056), T086 (R016) and T072 (R074, also flagged: AC4 had no verified line)
- 2026-10-01: AC5 verified: tools/harness/README.md Forge integrity lists done_ac_unchecked, ac_checked_needs_log, done_log_not_done
- 2026-10-01: npm run check exit 0; harness:diff production=89 total=165
- 2026-10-01: review requested
- 2026-10-01: done (R080)
