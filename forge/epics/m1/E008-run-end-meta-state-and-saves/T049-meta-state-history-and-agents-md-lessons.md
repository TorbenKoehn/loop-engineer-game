---
id: T049
epic: E008
title: Meta state, history and AGENTS.md lessons
summary: "MetaState with endRun: history of the last 100 runs, the 3-lesson offer with capacity 1, the brute_force unlock on the first Critical Bug win, and MetaView into newRun."
keywords: ["meta", "history", "lessons", "agents-md", "unlocks"]
type: task
status: backlog
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

- [ ] endRun(meta, run) appends a history entry with the fields of meta-progression.md "Run history", keeps at most 100, and is idempotent by run id
- [ ] The lesson offer follows the three documented sources via `lessons`; pickLesson replaces at capacity 1, skipLesson keeps the old line
- [ ] Winning any Critical Bug once unlocks brute_force for later runs (test)
- [ ] newRun copies unlocked ids and lessons from MetaView; a lesson adds 1 to the baseline (test)

## Subtasks

- [ ] MetaState and endRun
- [ ] Lesson offer
- [ ] Unlock rule
- [ ] MetaView

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
