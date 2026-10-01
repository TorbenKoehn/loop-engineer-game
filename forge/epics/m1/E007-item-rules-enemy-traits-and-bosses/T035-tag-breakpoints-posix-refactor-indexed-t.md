---
id: T035
epic: E007
title: Tag breakpoints POSIX, Refactor, Indexed, TDD
summary: "Pure breakpoint counting over equipped tool tags and the M1 breakpoint effects POSIX, Refactor, Indexed and TDD, exported for run selectors and the build panel."
keywords: ["breakpoints", "tags", "synergy", "build", "sim"]
type: task
status: in-progress
priority: p1
model: opus
size: S
depends_on: [T033]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T035: Tag breakpoints POSIX, Refactor, Indexed, TDD

## Goal

Tag synergies reward coherent builds and are shown in the build panel from the same function the sim uses.

## Context

- Epic: [E007](EPIC.md)
- [Harness and loadout: Tag breakpoints](../../../../docs/game/systems/harness-loadout.md#tag-breakpoints)
- [Vertical slice: Breakpoints row](../../../../docs/game/vertical-slice.md#in-scope)
- Code: `src/sim/breakpoints.ts`
- Out of scope: Always Online and Orchestration (E014), breakpoint chips UI (E009).

## Acceptance Criteria

- [ ] A pure `breakpoints(tools)` counts equipped tool tags (dual-tag tools count for both) and returns progress per breakpoint
- [ ] POSIX pipes +500 ms, Refactor Edit +15%, Indexed Search output -1, TDD Test fire restores 2 Trust: one test each
- [ ] Breakpoint modifiers appear in why lists as `bp:<id>`

## Subtasks

- [ ] Counting function
- [ ] Effects via mods and rules
- [ ] Tests

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
