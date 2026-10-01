---
id: T029
epic: E003
title: Planned compaction policy and compact effect
summary: "Compaction policy 70/80/90/never with 3000 ms lockout, Stun 1000 ms keeping buffs, the disabled-policy rule, and the compact effect that ignores policy and lockout."
keywords: ["context", "compaction", "policy", "lockout", "planned"]
type: task
status: in-progress
priority: p1
model: opus
size: M
depends_on: [T028]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T029: Planned compaction policy and compact effect

## Goal

Give the player the central build decision of the slice: compact early and lose tempo, or ride Rot.

## Context

- Epic: [E003](EPIC.md)
- [Context: Planned compaction, Worked example](../../../../docs/game/systems/context.md#planned-compaction-policy)
- [Event log: compaction kind planned](../../../../docs/architecture/event-log.md#event-kinds)
- Code: `src/sim/combat/compaction.ts`
- Out of scope: Policy UI (E009), compaction triggers for skills (E007).

## Acceptance Criteria

- [ ] Test `policy 80 compacts at 80%` reproduces the worked example: at F = 48, N = 0, S = 26, Stun 1000 ms, buffs kept
- [ ] No planned compaction within 3000 ms of the last one, nor when the same addition triggered auto-compaction (tests)
- [ ] The policy is disabled when (B + floor(W x 10 / 100)) x 100 ≥ W x p, and fightStart flags it for the UI
- [ ] Policy 0 never compacts; the compact effect compacts ignoring policy and lockout (tests)

## Subtasks

- [ ] Policy trigger
- [ ] Lockout
- [ ] Disabled rule
- [ ] compact effect

## Notes

- Orchestrator 2026-10-01: re-add `policy` and `lastCompactT` to the Ctx row in docs/architecture/sim-core.md when they land (removed by gardening because not yet shipped).

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
