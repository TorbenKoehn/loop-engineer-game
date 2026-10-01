---
id: T028
epic: E003
title: Auto-compaction on overflow
summary: "Overflow at F ≥ W triggers auto-compaction: noise cleared, signal reset to baseline plus 10% of W, Stun 2000 ms, latest temporary buff lost, unfired tools skip the tick."
keywords: ["context", "compaction", "overflow", "stun", "buff-loss"]
type: task
status: done
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
- [Context: Auto-compaction (Overflow)](../../../../docs/game/systems/context.md#auto-compaction-overflow)
- [Statuses: Primed (counts as temporary buff)](../../../../docs/game/systems/statuses.md#primed-one-shot-modifier)
- [Event log: compaction payload](../../../../docs/architecture/event-log.md#event-kinds)
- Code: `src/sim/combat/compaction.ts`
- Out of scope: Planned compaction and policy (next task), compaction moment UI (E011).

## Acceptance Criteria

- [x] Test `overflow compacts`: after an addition with F ≥ W, a compaction event of kind auto, N = 0 and S = min(B + floor(W x 10 / 100), W - 1)
- [x] The agent is Stunned 2000 ms and tool progress is kept (test)
- [x] The most recent positive temporary buff (Haste or prime, ties by highest seq) is removed and named in lostBuff
- [x] Tools that had not fired yet in the same tick do not fire this tick (test with two full tools)
- [x] Overflow from noise and from tool output both trigger it (two tests)

## Subtasks

- [x] Overflow check after additions
- [x] Reset and stun
- [x] Buff loss
- [x] Skip remaining fires

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Code lives in `src/sim/combat/context/compaction.ts`, not `src/sim/combat/compaction.ts`: the combat dir would hit 16 files (dir_files budget 15).
- 2026-10-01: Event order: `tokens`, `compaction` (+ `statusOn` Stun, lost Haste `statusOff`), then one `zoneChanged` from the zone before the addition; Overflow never appears in `zoneChanged`. event-log.md "Ordering" updated (was `zoneChanged?` before `compaction?`, which would need a second zoneChanged after the reset). No new event field, LOG_VERSION unchanged, goldens unchanged.
- 2026-10-01: `lostBuff` format: `<tool ref>:haste` or `<tool ref>:<prime id>` (e.g. `t2:prime:read_file`). Recency: new `seq` on `StatusRt` (last statusOn) and `PrimeRt` (its prime event); select.test.ts expectation gained `seq: expect.any(Number)`.
- 2026-10-01: CombatInput unchanged. `addOutput` now returns whether it auto-compacted; fire.ts stops the step on it. The fight-start overflow check compacts too (GDD "then the overflow check runs once").

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat/context/compaction.test.ts, `overflow compacts` x3 (F = W, F > W, cap at W - 1; N 0, kind auto, v 2000)
- 2026-10-01: AC2 verified: compaction.test.ts `stuns the agent for 2000 ms; tool progress is kept` (agent stun remaining 2000, chargeAll keeps progress)
- 2026-10-01: AC3 verified: compaction.test.ts `buff loss` (5 tests: later prime vs Haste both orders, agent-wide Haste ties by seq, re-apply, Slow/negative prime not lost)
- 2026-10-01: AC4 verified: compaction.test.ts `skips tools that had not fired yet this tick; they stay full` (two full tools, one toolFired)
- 2026-10-01: AC5 verified: compaction.test.ts `overflow sources` (tool output and noise, two tests)
- 2026-10-01: npm run check: all steps passed (513 tests); production diff 92 lines
- 2026-10-01: review requested
- 2026-10-01: done (R049)
