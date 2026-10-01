---
id: T054
epic: E008
title: Desync detection and replay-vs-snapshot test
summary: "Dev and e2e replay of seed + actions after each autosave with a desync report, the 50-bot-run save-reload-continue equivalence test, and contentVersion checks."
keywords: ["desync", "replay", "save", "determinism", "exit-criteria"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T053, T071]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T054: Desync detection and replay-vs-snapshot test

## Goal

Prove M1 exit criterion 6: saving and reloading at any node gives the same result as an uninterrupted run, and catch any desync in development.

## Context

- Epic: [E008](EPIC.md)
- [Save system: Desync detection, Content changes and replays](../../../docs/architecture/save.md#desync-detection)
- [Vertical slice: Exit criterion 6](../../../docs/game/vertical-slice.md#exit-criteria)
- Code: `src/ui/store/desync.ts`, `tests/save/`
- Out of scope: The 200-run and 10 000-save soaks (E015, E022).

## Acceptance Criteria

- [ ] In dev and e2e builds a replay after each autosave is deep-compared with the snapshot; a mismatch reports the first differing path, the last 5 actions and the export string
- [ ] Test `save reload continue equals uninterrupted` passes on 50 greedy-bot runs saving and reloading at every node
- [ ] Exact replay refuses saves with another contentVersion, reporting "content changed since save"

## Subtasks

- [ ] Microtask replay check
- [ ] Bot equivalence test
- [ ] Version guard

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
