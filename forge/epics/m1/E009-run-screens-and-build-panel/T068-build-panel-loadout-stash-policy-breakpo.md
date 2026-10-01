---
id: T068
epic: E009
title: "Build panel tree: loadout, stash, equip and chips"
summary: "Explorer build panel with tools, skills, memory and stash, baseline, start zone and breakpoint chips from run selectors, and equip, unequip and swap with the context-full message."
keywords: ["ui", "build-panel", "loadout", "stash", "equip", "breakpoints"]
type: task
status: ready
priority: p1
model: opus
size: M
depends_on: [T064, T045]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T068: Build panel tree: loadout, stash, equip and chips

## Goal

All build decisions happen in one always-available panel that shows the context cost of
every change. This task replaces the explorer placeholder with the loadout tree and the
equip actions; reorder (T110), policy and drawer (T111) and the preview (T112) build on it.

## Context

- Epic: [E009](EPIC.md); [Loadout: Build phase, Tag breakpoints](../../../../docs/game/systems/harness-loadout.md#build-phase)
- [Screens: Shell layout (explorer)](../../../../docs/game/ux/screens.md#shell-layout)
- `src/ui/shell/shell.tsx` (`Explorer` placeholder), `src/run/build/selectors.ts`, `src/run/build/build.ts` (paths after T105, see its Log)
- New files in `src/ui/build/`; the stylesheet goes with the other screen stylesheets under `src/ui/theme/`
- Out of scope: reorder (T110); policy select, combat lock and drawer (T111); the 6 s preview (T112); tooltips (T062); first-time tips (E020).

## Acceptance Criteria

- [ ] UI test passes: the explorer shows tools, skills, memory and stash with baseline, starting zone and breakpoint chips (e.g. `Shell 2/3`) taken from the run selectors
- [ ] UI test passes: equip, unequip and swap controls dispatch the build actions and the shown baseline follows the new state
- [ ] UI test passes: a refused equip shows "Context full: unequip something" and leaves the state unchanged
- [ ] Playwright passes: on the map, unequipping a tool moves it to the stash and the baseline shown in the explorer drops (relation read from the page, no pinned numbers)

## Subtasks

- [ ] Tree view with sections
- [ ] Baseline, zone and breakpoint chips
- [ ] Equip, unequip, swap and the refusal message
- [ ] e2e

## Notes

- Orchestrator 2026-10-01 (T045 follow-up): src/ui/screens/discard.tsx must pass `state` to `discardRefs` so it never offers a discard that apply refuses (baseline cap).
- 2026-10-01 (RT005 re-size): narrowed to tree, chips and equip (~250 production lines); reorder moved to T110, policy, combat lock and drawer to T111. Report CSS separately (at most 300).
- 2026-10-01: Meets the Definition of Ready; all depends_on done.

## Log

- 2026-10-01: created
