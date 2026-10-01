---
id: T110
epic: E009
title: Build panel tool reorder by drag and Alt+Arrow
summary: "Tools in the build panel reorder by pointer drag and by Alt+Arrow on a focused tool, both dispatching the same moveTool action, with focus kept on the moved tool."
keywords: ["ui", "build-panel", "reorder", "drag-drop", "keyboard", "moveTool"]
type: task
status: backlog
priority: p1
model: sonnet
size: S
depends_on: [T068]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T110: Build panel tool reorder by drag and Alt+Arrow

## Goal

Tool order decides firing ties and pipes, so reordering must be quick by mouse and by
keyboard. Both inputs dispatch the same `moveTool` action, keeping one code path.

## Context

- Epic: [E009](EPIC.md); [UI: Input (drag and keyboard equivalents)](../../../../docs/architecture/ui.md#input)
- [Loadout: Build phase](../../../../docs/game/systems/harness-loadout.md#build-phase)
- `src/ui/build/` (T068's tree), `src/run/build/build.ts` (`moveTool`; path after T105)
- Out of scope: reordering skills or memory; drag between tools and stash; remappable keys (E020).

## Acceptance Criteria

- [ ] UI test passes: dragging a tool onto another slot with pointer events dispatches `moveTool` with the source and target slots
- [ ] UI test passes: Alt+ArrowUp and Alt+ArrowDown on a focused tool dispatch `moveTool` and focus stays on the moved tool
- [ ] Playwright passes: Alt+ArrowDown on the first tool swaps the first two tool names in the explorer (names read from the page)

## Subtasks

- [ ] Pointer drag with drop target
- [ ] Alt+Arrow handler and focus
- [ ] e2e

## Notes

- 2026-10-01: Split from T068 (RT005 re-size), ~120 production lines. Meets the Definition of Ready; promote when T068 is done.

## Log

- 2026-10-01: created
