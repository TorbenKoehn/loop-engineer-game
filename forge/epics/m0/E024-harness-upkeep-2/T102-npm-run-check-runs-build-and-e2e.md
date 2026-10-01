---
id: T102
epic: E024
title: npm run check runs build and e2e
summary: "npm run check runs vite build and the Playwright suite after vitest when the working tree changes src/ or tests/e2e/, else prints a skip reason; a failing spec fails check."
keywords: ["check", "e2e", "playwright", "build", "gate", "verification"]
type: task
status: done
priority: p0
model: sonnet
size: S
updated: 2026-10-01
related: ["EPIC.md", "../../../retros/RT004-fourth-retro-e007-e008-e009-sim-save-and.md"]
---

# T102: npm run check runs build and e2e

## Goal

`npm run check` stops at vitest and harness:check, so a fight-outcome change broke
`tests/e2e/combat.spec.ts` unnoticed until a later task (RT004 What Went Wrong 1, T029
and T064). The build and the Playwright suite run only when the orchestrator remembers
the extra lines in delegate step 5. After this task the single gate runs both whenever
the change can affect them, so a red spec fails check for every implementer and reviewer.

## Context

- Epic: [E024](EPIC.md); [RT004 proposal P1](../../../retros/RT004-fourth-retro-e007-e008-e009-sim-save-and.md)
- `tools/check/run.ts` (steps and `skipIf`), `playwright.config.ts`
- `CLAUDE.md` (check line), `.claude/skills/delegate/SKILL.md` step 5, `.claude/skills/forge-task/SKILL.md` step 7
- Out of scope: new e2e specs; changing Playwright config, browsers or timeouts; the `check_all_s` budget value; running e2e inside `harness:check` or hooks; the error-message work of T088.

## Acceptance Criteria

- [x] With a changed or untracked file under `src/` or `tests/e2e/` (against `HEAD`), `npm run check` runs `npm run build` and then `npm run e2e` after the vitest step (Log shows the step lines)
- [x] Vitest test `skips build and e2e without src or e2e changes` passes: for a changed-file list with no `src/` or `tests/e2e/` path the skip function returns a reason, and check prints `SKIPPED - <reason>` for both steps
- [x] With one assertion in a `tests/e2e/*.spec.ts` temporarily broken, `npm run check` exits non-zero at the e2e step (Log records command and exit code; the spec is restored)
- [x] `CLAUDE.md` names build and e2e in the `npm run check` line, and neither delegate step 5 nor forge-task step 7 lists a separate `npm run build` / `npm run e2e` command
- [x] `npm run check` exits 0 on the finished tree

## Subtasks

- [x] Pure function: changed paths to skip reason (testable without spawning)
- [x] Changed paths from `git status --porcelain` (staged, unstaged, untracked)
- [x] Two new steps after vitest, before harness:check
- [x] Update CLAUDE.md, delegate step 5, forge-task step 7 (and their tests.md if they quote the lines)

## Notes

- 2026-10-01: Source: RT004 P1 (p0). Run first in E024.
- 2026-10-01: T088 (E023, ready) also edits `tools/check/run.ts`; do not run the two in parallel.
- 2026-10-01: Importing `run.ts` runs the steps (T088 fixes this). Put the skip logic in its own module so the vitest case does not import `run.ts`.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: with untracked src/tmp-t102.txt, `npm run check` printed `[check 4/6] build (vite)` and `[check 5/6] e2e (playwright)` after vitest, 20 e2e passed, exit 0, 39s wall (budget 120s); file removed
- 2026-10-01: AC2 verified: vitest tools/check/skip.test.ts (`skips build and e2e without src or e2e changes`); without src changes check printed `[check 4/6] build (vite): SKIPPED - no changes under src/ or tests/e2e/` and the same for 5/6
- 2026-10-01: AC3 verified: smoke.spec.ts title regex broken; `npm run check` printed `FAILED at step 5/6: e2e (playwright) (exit 1)`, exit 1; spec restored
- 2026-10-01: AC4 verified: CLAUDE.md check line names build + e2e; delegate step 5 and forge-task step 7 (and their tests.md) no longer list separate build/e2e commands
- 2026-10-01: AC5 verified: final `npm run check` exit 0
- 2026-10-01: playwright output dirs (test-results/, playwright-report/) already in .gitignore; no change needed. One vitest timeout flake in src/run/apply.test.ts on the first cold run, passed on rerun.
- 2026-10-01: review requested
- 2026-10-01: R076 changes-requested
- 2026-10-01: addressed R076 (2 findings): clean tree or git failure now runs build+e2e (skip only when changes exist and none touch src/ or tests/e2e/); unit test updated; delegate step 5 reworded
- 2026-10-01: review requested
- 2026-10-01: done (R077)
