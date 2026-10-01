---
id: T045
epic: E004
title: Build actions and loadout selectors
summary: "moveTool, equip, unequip, swap and setPolicy with the 80% baseline limit, plus selectors for baseline, starting zone and breakpoints shared by sim and UI."
keywords: ["build", "loadout", "equip", "selectors", "baseline", "policy"]
type: task
status: done
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

- [x] moveTool, equip, unequip and swap work between slots and stash and are legal in map, reward, shop and event modes
- [x] Equipping fails with baselineOverLimit when B x 100 > W x 80, using the modified window
- [x] setPolicy accepts 70, 80, 90 and 0
- [x] selectBaseline, selectStartZone and selectBreakpoints equal the values in the fightStart event of a resolved fight (test)
- [x] Property test: baseline ≤ 80% of W after every build action over random sequences

## Subtasks

- [x] Build actions
- [x] Baseline check
- [x] Selectors
- [x] Property test

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Files live in `src/run/build/` (`build.ts`, `selectors.ts`): `src/run` is at its file limit.
- 2026-10-01: `swap` is a new Action (`{ stashIx, slot }`); `equip` inserts into a free slot only.
  Unequip and swap get the same limit check as equip (a window memory such as long_context
  cannot be unequipped while the loadout needs it).
- 2026-10-01: Build actions are not in `legalActions` (random walks with always-legal
  moveTool/setPolicy would not end); `buildActions(state)` lists them for bots and tests.
- 2026-10-01: To keep the invariant over every path, `gain` equips only within the limit (else
  stash), `sell` refuses with baselineOverLimit, and `discardRefs(agent, kind, state?)` drops
  removals that break it (state is optional so `src/ui/screens/discard.tsx` still compiles; it
  should pass `state` once T070 touches it). shop.test fixture switched fake skill ids to real
  ones because gain now resolves content.
- 2026-10-01: `combatInput` now spreads `loadoutInput(state)`, the shared loadout part, so
  selectors and fights use one input builder; `loadoutBreakpoints` became `selectBreakpoints`.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: maxTurns hit (90), resumed
- 2026-10-01: AC1 verified: npx vitest run src/run/build/build.test.ts ("are legal in map/reward/shop/event mode" x4, "are refused in ... mode" x6, bad indices/full slots/lastTool; 17 passed)
- 2026-10-01: AC2 verified: build.test.ts "allows B x 100 = W x 80 and refuses B x 100 > W x 80" (B 40 = 80% of W 50 ok, +2 refused) and "uses the modified window" (senior -10 vs concise, long_context +40)
- 2026-10-01: AC3 verified: build.test.ts "setPolicy accepts 70, 80, 90 and 0 only" (50, 100, 85, -1 -> notOffered)
- 2026-10-01: AC4 verified: npx vitest run src/run/build/selectors.test.ts (24 cases: 2 harnesses x 3 prompts x plain/startNoise/startSignal/long_context; B, W, zone, breakpoints equal the resolved fight's fightStart; 27 passed)
- 2026-10-01: AC5 verified: build.test.ts "baseline <= 80% of W after every build action over random sequences" (fast-check 40 runs x 150 steps, 2/3 build actions, checked after every action; fails with the limit check removed)
- 2026-10-01: npm run check exit 0 (856 tests, 21 e2e); npm run harness:diff production=268 total=641
- 2026-10-01: review requested
- 2026-10-01: done (R082)
