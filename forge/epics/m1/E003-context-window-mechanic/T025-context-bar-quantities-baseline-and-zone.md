---
id: T025
epic: E003
title: Context bar quantities, baseline and zones
summary: "Ctx state W, B, S, N, F with baseline from the loadout, integer zone tests, Focused bonus and Cold penalty in the damage formula, and the Rot charge-rate multiplier."
keywords: ["context", "zones", "baseline", "window", "focused", "rot"]
type: task
status: done
priority: p0
model: opus
size: M
depends_on: [T019, T020]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T025: Context bar quantities, baseline and zones

## Goal

Make the context bar part of every fight: the loadout sets the baseline, the fill decides the zone, and zones change damage and charge rate.

## Context

- Epic: [E003](EPIC.md)
- [Context: Quantities, Zones, Tuning knobs](../../../../docs/game/systems/context.md)
- [Combat: Charge rate (Rot), Damage formula (zone pct)](../../../../docs/game/systems/combat.md#charge-rate)
- [Simulation core: Entities (Ctx)](../../../../docs/architecture/sim-core.md#entities)
- Code: `src/sim/combat/context.ts`
- Out of scope: Outputs and noise (other E003 tasks), compaction, window modifiers from items.

## Acceptance Criteria

- [x] Test `baseline sums loadout weights` gives B = 20 (33%, Focused) for the context.md worked-example loadout
- [x] Zone tests at the integer boundaries 25% and 70% and at F ≥ W for W 60 and W 100 emit zoneChanged with from, to, F and W
- [x] Focused adds +20 and Cold subtracts the accuracy penalty (15/25/35) in the damage formula for tool damage, guard and heal, never for tokens
- [x] Rot multiplies the agent's tool charge rate by 70/100 (floor); enemies are unaffected
- [x] fightStart carries W, B, S, N and zone; W never drops below 40

## Subtasks

- [x] Ctx state and baseline
- [x] Zone function and events
- [x] Zone pct in damage formula
- [x] Rot rate

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Context code lives in `src/sim/combat/context/` (ctx.ts pure, zone.ts emits). Zone index in events: 0 Cold, 1 Focused, 2 Rot, 3 Overflow; `damage.zone` is the zone at the hit. `updateZone` has no production caller yet: T026/T027 call it after F changes.
- 2026-10-01: Docs not edited (delegation limited paths to src/sim): event-log.md needs the zone index convention and `context/zone.ts` in related_code; sim-core.md needs `coldPenalty` in the Ctx row and `context/ctx.ts` in related_code.
- 2026-10-01: No CombatInput/AgentSetup field changes. Ctx is derived from existing input: model.window/accuracy/baseWeight, prompt.weight, tool/skill/memory weights and lessons.length, so run-side combatInput (T042) must pass the real prompt, skills, memories and lessons for B to be right.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: test builder default window 200 -> 60 so builder fights start Focused (B 23, 38%); updated expectations in damage, effects, targeting, primes tests (+20% Focused) and derived the grep hit amount in src/ui/sandbox/replay.test.ts from the sim's damage event. No golden change (goldens use the stub fight).
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat/context/ctx.test.ts, `baseline sums loadout weights` (B = 20, zone focused at W 60)
- 2026-10-01: AC2 verified: context/zone.test.ts `W 60` / `W 100` cases emit zoneChanged {from,to,F,W} at 25%, 70%, F >= W and back; ctx.test.ts `zoneOf` boundary table (18 cases)
- 2026-10-01: AC3 verified: context/effects.test.ts `Focused adds +20...` (12/12/12), `Cold with high/normal/low accuracy` (9/8/7 for dmg, guard, heal), `Rot and enemy hits get no zone %`. Tokens: zone mods only enter Activation.mods for computeAmount (fire.ts); no token amount passes through it
- 2026-10-01: AC4 verified: context/effects.test.ts `Rot charge rate` (formula cases with floor, toolRate 70 vs enemyRate 100, Rot fight fires at 4300/8600 while Typo acts at 3000/6000)
- 2026-10-01: AC5 verified: ctx.test.ts `fightStart carries W, B, S, N and the zone index` and `W never drops below 40` (10, 39 -> 40)
- 2026-10-01: production diff 125 lines (numstat per forge-task step 5); npm run check exit 0 (406 tests)
- 2026-10-01: review requested
- 2026-10-01: done (R041)
