---
id: T045
epic: E004
title: Build actions and loadout selectors
summary: "moveTool, equip, unequip, swap and setPolicy with the 80% baseline limit, plus selectors for baseline, starting zone and breakpoints shared by sim and UI."
keywords: ["build", "loadout", "equip", "selectors", "baseline", "policy"]
type: task
status: in-progress
priority: p1
model: opus
size: M
depends_on: [T040, T025, T035]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T045: Build actions and loadout selectors

## Goal

Players reshape their loadout between fights and the UI shows exactly the numbers the sim will use.

## Context

- Epic: [E004](EPIC.md)
- [Loadout: Slots and stash, Build phase](../../../../docs/game/systems/harness-loadout.md#build-phase)
- [Context: Quantities (build-phase limit)](../../../../docs/game/systems/context.md#quantities)
- [Run state: Invariants](../../../../docs/architecture/run-state.md#invariants-property-tested-over-random-legal-action-sequences)
- Code: `src/run/build.ts`, `src/run/selectors.ts`
- Out of scope: Build panel UI and preview (E009).

## Acceptance Criteria

- [ ] moveTool, equip, unequip and swap work between slots and stash and are legal in map, reward, shop and event modes
- [ ] Equipping fails with baselineOverLimit when B x 100 > W x 80, using the modified window
- [ ] setPolicy accepts 70, 80, 90 and 0
- [ ] selectBaseline, selectStartZone and selectBreakpoints equal the values in the fightStart event of a resolved fight (test)
- [ ] Property test: baseline ≤ 80% of W after every build action over random sequences

## Subtasks

- [ ] Build actions
- [ ] Baseline check
- [ ] Selectors
- [ ] Property test

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
