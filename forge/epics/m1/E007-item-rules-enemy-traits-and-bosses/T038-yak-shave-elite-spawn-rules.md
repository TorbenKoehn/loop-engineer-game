---
id: T038
epic: E007
title: Yak Shave elite spawn rules
summary: "Yak Shave elite p1x1: Blocked at the back behind three tasks, and the Another Thing First Side Quest spawn limited by alive count and per-fight maximum."
keywords: ["elite", "yak-shave", "spawn", "handlers", "encounter"]
type: task
status: backlog
priority: p2
model: opus
size: S
depends_on: [T037]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T038: Yak Shave elite spawn rules

## Goal

The M1 elite plays as designed: order and AoE first, burst once the tasks fall.

## Context

- Epic: [E007](EPIC.md)
- [Phase 1: Elites, Yak Shave (M1)](../../../../docs/game/content/phase-1-implement.md#yak-shave-m1)
- [Statuses: Blocked](../../../../docs/game/systems/statuses.md#enemy-traits)
- Code: `src/sim/handlers/`
- Out of scope: Copy-Paste Clone (E012).

## Acceptance Criteria

- [ ] In p1x1 Yak Shave stands at the back and takes no damage while the three tasks live (test)
- [ ] Another Thing First spawns Side Quest at the front only if fewer than 3 other enemies are alive, at most 2 per fight (tests for both limits)
- [ ] Test `elite fight resolves` runs p1x1 with a fixed loadout to a deterministic outcome pinned by hash

## Subtasks

- [ ] Conditional spawn handler
- [ ] Elite fight test

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
