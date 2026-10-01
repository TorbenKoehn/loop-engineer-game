---
id: T025
epic: E003
title: Context bar quantities, baseline and zones
summary: "Ctx state W, B, S, N, F with baseline from the loadout, integer zone tests, Focused bonus and Cold penalty in the damage formula, and the Rot charge-rate multiplier."
keywords: ["context", "zones", "baseline", "window", "focused", "rot"]
type: task
status: in-progress
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

- [ ] Test `baseline sums loadout weights` gives B = 20 (33%, Focused) for the context.md worked-example loadout
- [ ] Zone tests at the integer boundaries 25% and 70% and at F ≥ W for W 60 and W 100 emit zoneChanged with from, to, F and W
- [ ] Focused adds +20 and Cold subtracts the accuracy penalty (15/25/35) in the damage formula for tool damage, guard and heal, never for tokens
- [ ] Rot multiplies the agent's tool charge rate by 70/100 (floor); enemies are unaffected
- [ ] fightStart carries W, B, S, N and zone; W never drops below 40

## Subtasks

- [ ] Ctx state and baseline
- [ ] Zone function and events
- [ ] Zone pct in damage formula
- [ ] Rot rate

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
