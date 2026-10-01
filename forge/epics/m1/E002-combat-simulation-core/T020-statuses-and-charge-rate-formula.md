---
id: T020
epic: E002
title: Statuses and charge-rate formula
summary: "Haste, Slow, Throttle and Stun on tools, agent and enemies with timers, stacking, caps and duration mods; the clamped charge-rate formula; status and charge effects with selectors."
keywords: ["sim", "statuses", "charge-rate", "haste", "throttle", "stun"]
type: task
status: ready
priority: p0
model: opus
size: M
depends_on: [T018]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T020: Statuses and charge-rate formula

## Goal

Implement the four timed statuses and the charge-rate formula so tools and enemies speed up, slow down and freeze exactly as the GDD states.

## Context

- Epic: [E002](EPIC.md)
- [Statuses: The six statuses and rules](../../../../docs/game/systems/statuses.md#the-six-statuses)
- [Combat: Charge rate, Tick order step 1](../../../../docs/game/systems/combat.md#charge-rate)
- [Event log: statusOn, statusOff, charge](../../../../docs/architecture/event-log.md#event-kinds)
- Code: `src/sim/combat/statuses.ts`, `src/sim/combat/charge.ts`
- Out of scope: Rot zone rate (E003), Noise (E003), Guardrails (S2), sources of duration mods (E007).

## Acceptance Criteria

- [ ] Test `charge rate formula` covers clamp 10..400, Haste x2, Slow /2 floor, both together x1, and rate 0 under Throttle or Stun with progress kept
- [ ] Stacking tests: Haste and Slow add duration up to 10 000 ms; Throttle and Stun take the longer remaining; Stun caps at 5000 ms
- [ ] Selectors fastest, leftmost, rightmost, longest remaining charge, tag:<Tag> and all pick tools as statuses.md defines (ties leftmost, rate-0 skipped)
- [ ] statusOn and statusOff events carry status and remaining; timers tick in step 1 of the tick order
- [ ] A 50% duration modifier shortens a Throttle with floor and a 50 ms minimum (test)

## Subtasks

- [ ] Status storage and timers
- [ ] Charge-rate function
- [ ] Selectors
- [ ] status and charge effects

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
