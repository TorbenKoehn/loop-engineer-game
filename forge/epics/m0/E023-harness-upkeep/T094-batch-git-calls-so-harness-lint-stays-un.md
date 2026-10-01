---
id: T094
epic: E023
title: Batch git calls so harness lint stays under lint_s
summary: "harness:lint takes ~14 s (budget lint_s 10 s) because forge integrity and drift checks spawn one git process per file; batch them."
keywords: ["task", "batch", "calls", "harness", "lint", "stays"]
type: task
status: done
priority: p0
model: sonnet
size: S
updated: 2026-10-01
related: ["EPIC.md"]
---

# T094: Batch git calls so harness lint stays under lint_s

## Goal

`npm run harness:lint` must finish well under `lint_s` (target < 3 s on Windows) with ~100 task files. Forge integrity (`git show HEAD:<path>`) and doc drift (`git log -1`) currently spawn one git process per file; replace them with a constant number of batched git calls (e.g. one `git cat-file --batch` or `git ls-tree` + `git show` for all task files, one `git log --name-only` pass for drift) with identical findings.

## Context

- Epic: [E023](EPIC.md)

## Acceptance Criteria

- [x] `npm run harness:lint` completes in under 3 s on this repo (measured wall time in the Log)
- [x] The number of git subprocesses per lint run is constant (independent of task/doc count), asserted by a test or an instrumented counter
- [x] Existing forge integrity and drift tests pass unchanged, findings identical before/after on the current repo

## Subtasks

- [x] Profile lint and confirm where the time goes
- [x] Batch HEAD content reads for task files
- [x] Batch last-commit dates for related_code drift
- [x] Add a subprocess-count test

## Notes

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: `npm run harness:lint` wall 2.4 s (node direct 1.5 s), was ~14 s
- 2026-10-01: AC2 verified: tools/harness/test/git.test.ts asserts 2 git spawns for 2 and 40 files (gitStats counter)
- 2026-10-01: AC3 verified: old per-file git show/log vs new batch compared over 351 tracked files, 0 mismatches; existing tests unchanged; npm run check all steps passed
- 2026-10-01: review requested
- 2026-10-01: done (R011)
