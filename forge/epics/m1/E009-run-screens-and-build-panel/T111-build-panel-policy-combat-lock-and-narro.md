---
id: T111
epic: E009
title: Build panel policy, combat lock and narrow drawer
summary: "Compaction policy select dispatching setPolicy, a read-only icon panel during combat, and an explorer drawer with a toggle button below 1100 px width."
keywords: ["ui", "build-panel", "policy", "drawer", "combat", "responsive"]
type: task
status: backlog
priority: p1
model: sonnet
size: S
depends_on: [T068]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T111: Build panel policy, combat lock and narrow drawer

## Goal

The compaction policy is a build decision, so it lives in the build panel. During combat
the panel stays visible but read-only, and on narrow screens it becomes a drawer so the
editor keeps its width.

## Context

- Epic: [E009](EPIC.md); [Screens: Shell layout](../../../../docs/game/ux/screens.md#shell-layout)
- [Loadout: Build phase](../../../../docs/game/systems/harness-loadout.md#build-phase) (policy 70 / 80 / 90 / never)
- `src/ui/build/` (T068's tree), `src/ui/shell/shell.tsx`, `src/ui/store/ui.ts`
- Out of scope: the `B` key binding (T083 binds it to this drawer's toggle); reorder (T110); preview (T112).

## Acceptance Criteria

- [ ] UI test passes: the policy select offers 70, 80, 90 and never, shows the current policy and dispatches `setPolicy`
- [ ] UI test passes: in combat every editing control is disabled and the panel collapses to icons
- [ ] Playwright passes at 1024 x 640: the explorer is a closed drawer that a toggle button opens and closes; at 1280 x 720 it is always shown

## Subtasks

- [ ] Policy select
- [ ] Combat lock and icon mode
- [ ] Drawer state in the UI store, CSS and e2e

## Notes

- 2026-10-01: Split from T068 (RT005 re-size), ~120 production lines plus CSS. Meets the Definition of Ready; promote when T068 is done.

## Log

- 2026-10-01: created
