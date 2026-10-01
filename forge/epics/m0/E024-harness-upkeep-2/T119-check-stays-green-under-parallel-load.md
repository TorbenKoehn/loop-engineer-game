---
id: T119
epic: E024
title: Check stays green under parallel load
summary: "npm run check caps Playwright workers via CHECK_E2E_WORKERS (default 2) and the run reducer's fast-check property tests get timeouts of at least 20 s, so parallel worktree checks stop flaking."
keywords: ["check", "flaky", "playwright", "workers", "fast-check", "timeout", "parallel"]
type: task
status: in-progress
priority: p1
model: sonnet
size: S
depends_on: [T105]
updated: 2026-10-01
related: ["EPIC.md", "../../../retros/RT005-fifth-retro-e007-e009-e010-screens-bots.md"]
---

# T119: Check stays green under parallel load

## Goal

Since T102 every parallel worktree runs vitest, build and e2e at once, and checks flake:
a cold vitest timeout in `apply.test.ts` (T102 Log), a 5 s property-test timeout (T035 Log)
and three unlogged reruns (RT005 Also seen). After this task the check passes under three
concurrent runs.

## Context

- Epic: [E024](EPIC.md); [RT005 proposal P2](../../../retros/RT005-fifth-retro-e007-e009-e010-screens-bots.md)
- `tools/check/run.ts`, `tools/check/skip.test.ts`, `playwright.config.ts`
- `src/run/apply.test.ts` (path after T105, see its Log)
- Out of scope: changing `check_all_s` or other budgets; speeding up tests; changing property-test run counts.

## Acceptance Criteria

- [ ] Vitest case passes: the check's e2e step passes `--workers=2` by default and `--workers=3` when `CHECK_E2E_WORKERS=3`
- [ ] Every fast-check property test in the run reducer's apply test has an explicit timeout of at least 20000 ms, and `npx vitest run apply` passes
- [ ] Three concurrent `npm run check` runs in separate worktrees pass twice in a row (Log lists the six exit codes and durations)
- [ ] `npm run check` exits 0

## Subtasks

- [ ] Workers from env in the check runner
- [ ] Property-test timeouts
- [ ] Parallel load run

## Notes

- 2026-10-01: Source: RT005 P2. Waits for T105 (moves `src/run` files) and must not run in parallel with T108 (same reducer files).
- 2026-10-01: Meets the Definition of Ready; promote when T105 is done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
