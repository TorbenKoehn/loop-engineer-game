---
id: T112
epic: E009
title: Build panel shows the 6 s firing order preview
summary: "The build panel lists the next 6 s firing order from previewFiring and refreshes it after every build action, with a Playwright check that unequipping changes the preview."
keywords: ["ui", "build-panel", "preview", "firing-order", "previewFiring"]
type: task
status: backlog
priority: p2
model: sonnet
size: S
depends_on: [T068, T069]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T112: Build panel shows the 6 s firing order preview

## Goal

Players see the predicted firing order of their build before the fight and watch it change
as they edit, which makes order, pipes and cooldowns learnable.

## Context

- Epic: [E009](EPIC.md); [Loadout: Build phase (preview)](../../../../docs/game/systems/harness-loadout.md#build-phase)
- `previewFiring` from T069 (see `docs/architecture/sim-core.md#api`)
- `src/ui/build/` (T068's tree), `src/run/build/selectors.ts` (`loadoutInput`; path after T105)
- Out of scope: enemy-aware previews; animating the preview; changes to the sim preview API.

## Acceptance Criteria

- [ ] UI test passes: the build panel lists the firing order returned by `previewFiring` for 6000 ms, in order with timestamps
- [ ] UI test passes: after `moveTool`, equip and unequip the shown order is recomputed from the new state
- [ ] Playwright passes: unequipping a tool on the map removes its name from the preview (names read from the page)

## Subtasks

- [ ] Preview list component
- [ ] Recompute on state change
- [ ] e2e

## Notes

- 2026-10-01: Split from T069 (RT005 re-size), ~80 production lines. Meets the Definition of Ready; promote when T068 and T069 are done.

## Log

- 2026-10-01: created
