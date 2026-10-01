---
id: T049
epic: E008
title: Meta state, history and AGENTS.md lessons
summary: "MetaState with endRun: history of the last 100 runs, the 3-lesson offer with capacity 1, the brute_force unlock on the first Critical Bug win, and MetaView into newRun."
keywords: ["meta", "history", "lessons", "agents-md", "unlocks"]
type: task
status: done
priority: p1
model: opus
size: M
depends_on: [T048, T015]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T049: Meta state, history and AGENTS.md lessons

## Goal

Runs leave a trace: history, one AGENTS.md lesson that costs context next run, and the single M1 unlock.

## Context

- Epic: [E008](EPIC.md)
- [Meta: AGENTS.md lessons, Run history](../../../../docs/game/systems/meta-progression.md#agentsmd-lessons)
- [Run state: Meta state, Reducer (MetaView)](../../../../docs/architecture/run-state.md#meta-state)
- [Vertical slice: deviations (unlock, capacity 1, no TD)](../../../../docs/game/vertical-slice.md#slice-specific-deviations)
- Code: `src/run/meta/`
- Out of scope: Training Data and the unlock tree (E015), achievements (E017), the AGENTS.md screen (E009).

## Acceptance Criteria

- [x] endRun(meta, run) appends a history entry with the fields of meta-progression.md "Run history", keeps at most 100, and is idempotent by run id
- [x] The lesson offer follows the three documented sources via `lessons`; pickLesson replaces at capacity 1, skipLesson keeps the old line
- [x] Winning any Critical Bug once unlocks brute_force for later runs (test)
- [x] newRun copies unlocked ids and lessons from MetaView; a lesson adds 1 to the baseline (test)

## Subtasks

- [x] MetaState and endRun
- [x] Lesson offer
- [x] Unlock rule
- [x] MetaView

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Run id = `SetupSnapshot.run`, numbered by `metaView` (`lastRun + 1`); `MetaView.run` is optional so the UI stub in src/ui/store/meta.ts (out of scope) still compiles, and run 0 (unnumbered) is always recorded. The UI must build its MetaView with `metaView(meta)` once saves load meta (E008 save/continue tasks).
- 2026-10-01: History `wallMs` and `save` come from the caller via `endRun(meta, run, extras)` (pure core has no clock or codec; default null). Lint is stored as rule ids (no lint content in M1); sim time is the new run-wide `RunStats.zoneMs`.
- 2026-10-01: Lesson source 2 ("ended the run") uses `stats.cause` for wins too; source 1 counts enemy defs only (Deadline is Process only for source 2, memories-lessons.md).
- 2026-10-01: T048 tests that asserted `pending: null` / no legal actions at ctrlc and shipped run end now assert the lesson offer, then no legal actions after skipLesson; the 2000-action property loops until no action is legal (same final assertions).

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/run/meta (meta.test.ts "appends a history entry with the run-history fields", "keeps the last 100 runs", "is idempotent by run id" passed)
- 2026-10-01: AC2 verified: npx vitest run src/run/meta (lessons.test.ts 9 passed: three sources, seen fallback, duplicates, lessons fork, abandon no offer, capacity 1 replace/skip; meta.test.ts AGENTS.md in meta 2 passed)
- 2026-10-01: AC3 verified: npx vitest run src/run/meta (meta.test.ts "winning any Critical Bug once unlocks brute_force for later runs", "losing the Critical Bug fight unlocks nothing" passed)
- 2026-10-01: AC4 verified: npx vitest run src/run/meta (meta.test.ts "newRun copies unlocked ids, lessons and the run number", "a lesson adds 1 to the baseline" passed)
- 2026-10-01: npm run check exit 0 (tsc, biome, vitest, harness:check); production diff 283 lines (numstat, tests and docs excluded)
- 2026-10-01: review requested
- 2026-10-01: done (R051)
