---
id: T028
epic: E003
title: Auto-compaction on overflow
summary: "Overflow at F ≥ W triggers auto-compaction: noise cleared, signal reset to baseline plus 10% of W, Stun 2000 ms, latest temporary buff lost, unfired tools skip the tick."
keywords: ["context", "compaction", "overflow", "stun", "buff-loss"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T026, T027, T022]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T028: Auto-compaction on overflow

## Goal

Overflowing the window is punished in the documented way, the key moment the slice must make readable.

## Context

- Epic: [E003](EPIC.md)
- [Context: Auto-compaction (Overflow)](../../../docs/game/systems/context.md#auto-compaction-overflow)
- [Statuses: Primed (counts as temporary buff)](../../../docs/game/systems/statuses.md#primed-one-shot-modifier)
- [Event log: compaction payload](../../../docs/architecture/event-log.md#event-kinds)
- Code: `src/sim/combat/compaction.ts`
- Out of scope: Planned compaction and policy (next task), compaction moment UI (E011).

## Acceptance Criteria

- [ ] Test `overflow compacts`: after an addition with F ≥ W, a compaction event of kind auto, N = 0 and S = min(B + floor(W x 10 / 100), W - 1)
- [ ] The agent is Stunned 2000 ms and tool progress is kept (test)
- [ ] The most recent positive temporary buff (Haste or prime, ties by highest seq) is removed and named in lostBuff
- [ ] Tools that had not fired yet in the same tick do not fire this tick (test with two full tools)
- [ ] Overflow from noise and from tool output both trigger it (two tests)

## Subtasks

- [ ] Overflow check after additions
- [ ] Reset and stun
- [ ] Buff loss
- [ ] Skip remaining fires

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
