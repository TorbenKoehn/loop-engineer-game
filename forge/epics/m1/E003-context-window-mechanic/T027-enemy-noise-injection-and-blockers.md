---
id: T027
epic: E003
title: Enemy noise injection and blockers
summary: "The noise verb with phase noise scale, Rot doubling and per-fight blockers, plus startNoise and startSignal fight modifiers applied at fight start."
keywords: ["context", "noise", "blockers", "gitignore", "modifiers"]
type: task
status: done
priority: p1
model: opus
size: S
depends_on: [T025, T021]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T027: Enemy noise injection and blockers

## Goal

Enemies fill the context with noise, the main pressure of Context Drift and the boss, with blockers and event modifiers working as documented.

## Context

- Epic: [E003](EPIC.md)
- [Context: Noise, Quantities (fight start)](../../../../docs/game/systems/context.md#noise)
- [Events: Next-fight modifiers](../../../../docs/game/content/events.md#next-fight-modifiers-data)
- Code: `src/sim/combat/context.ts`, `src/sim/combat/verbs.ts`
- Out of scope: Context lesson -25% (E007), noise source labels in the UI (E006).

## Acceptance Criteria

- [x] Test `noise verb` applies n x phaseNoiseScale / 100, then x2 in Rot, then subtracts blockers, then N += n' with a tokens event of kind noise and the enemy ref
- [x] Test `blocker budget per fight`: a 12-token blocker absorbs only the first 12 noise across several injections
- [x] startNoise and startSignal modifiers apply at fight start through blockers, then the overflow check runs once

## Subtasks

- [x] Noise verb
- [x] Blocker budget
- [x] Fight-start modifiers

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: CombatInput unchanged (`modifiers`, `memories` already present). `Ctx` gains `block` (blocker budget left this fight).
- 2026-10-01: Phase noise scale uses the same ratio as Severity and damage (combat.md): `n x PHASE_NOISE_SCALE[phase] / PHASE_NOISE_SCALE[home]`, floor. Identical to `n x phaseNoiseScale / 100` for home-phase-1 enemies (all M1 noise enemies). A home-2 enemy in P3 gets 150/125; flag if the GDD meant 150/100.
- 2026-10-01: `ContextHooks.noise` now receives the acting `EnemyRt` instead of its ref (the bar needs its home phase); the default hook is the real bar (`CONTEXT`, was the `NO_CONTEXT` stub). verbs.test asserts the enemy and the real default tokens event instead of the stub's no-op.
- 2026-10-01: Blocker budget = sum of passive `mod noiseBlock` effects over prompt, skills, memories, lessons (`passiveMod` in ctx.ts); E007 may generalise passive mods. Fully blocked noise emits no tokens event (as removal emits only non-zero changes).
- 2026-10-01: Overflow check = one `updateZone` after `fightStart` (resolve.ts) and after each injection; T028 adds compaction at those call sites. Test proves the single fight-start call via a pass-through `vi.mock` of zone.ts. No golden or UI test changed.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat/context/noise.test.ts -t "noise verb" (9 passed: phase 1/2/3 and home 2 scale, Rot x2 after scale floor, blockers after Rot, tokens event kind noise src e1)
- 2026-10-01: AC2 verified: npx vitest run src/sim/combat/context/noise.test.ts -t "blocker budget" (2 passed: 4 x 5 noise -> N 0, 0, 3, 8; block 7, 2, 0, 0)
- 2026-10-01: AC3 verified: npx vitest run src/sim/combat/context/noise.test.ts -t "fight-start modifiers" (3 passed: S = B + startSignal, startNoise 20 - 12 blocked = N 8, fightStart carries it, updateZone called once in a fight with no other additions)
- 2026-10-01: npm run check green; production diff 86 lines (git diff --numstat, non-test src)
- 2026-10-01: review requested
- 2026-10-01: done (R047)
