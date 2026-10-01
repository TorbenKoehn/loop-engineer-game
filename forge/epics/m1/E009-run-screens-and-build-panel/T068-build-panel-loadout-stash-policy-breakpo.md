---
id: T068
epic: E009
title: "Build panel: loadout, stash, policy, breakpoints"
summary: "Explorer build panel with tools, skills, memory and stash, baseline and start zone, breakpoint chips, drag and Alt+Arrow reorder, equip/unequip, policy select and drawer mode."
keywords: ["ui", "build-panel", "loadout", "drag-drop", "policy", "breakpoints"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T064, T045]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T068: Build panel: loadout, stash, policy, breakpoints

## Goal

All build decisions happen in one always-available panel that shows the context cost of every change.

## Context

- Epic: [E009](EPIC.md)
- [Loadout: Build phase, Tag breakpoints](../../../../docs/game/systems/harness-loadout.md#build-phase)
- [Screens: Shell layout (explorer)](../../../../docs/game/ux/screens.md#shell-layout)
- [UI: Input (drag and keyboard equivalents)](../../../../docs/architecture/ui.md#input)
- Code: `src/ui/build/`
- Out of scope: The 6 s preview (next task), first-time tips (E020).

## Acceptance Criteria

- [ ] The explorer shows tools, skills, memory and stash with baseline, starting zone and breakpoint chips (e.g. Shell 2/3) from run selectors
- [ ] Tools reorder by drag and by Alt+Arrow, both dispatching moveTool
- [ ] A refused equip shows "Context full: unequip something"
- [ ] The policy select dispatches setPolicy; editing is disabled and the panel collapses to icons in combat
- [ ] Below 1100 px width the explorer becomes a drawer toggled with B

## Subtasks

- [ ] Tree view
- [ ] Reorder
- [ ] Equip and stash
- [ ] Policy and chips
- [ ] Drawer

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
