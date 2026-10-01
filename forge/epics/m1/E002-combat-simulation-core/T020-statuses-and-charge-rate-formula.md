---
id: T020
epic: E002
title: Statuses and charge-rate formula
summary: "Haste, Slow, Throttle and Stun on tools, agent and enemies with timers, stacking, caps and duration mods; the clamped charge-rate formula; status and charge effects with selectors."
keywords: ["sim", "statuses", "charge-rate", "haste", "throttle", "stun"]
type: task
status: done
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

- [x] Test `charge rate formula` covers clamp 10..400, Haste x2, Slow /2 floor, both together x1, and rate 0 under Throttle or Stun with progress kept
- [x] Stacking tests: Haste and Slow add duration up to 10 000 ms; Throttle and Stun take the longer remaining; Stun caps at 5000 ms
- [x] Selectors fastest, leftmost, rightmost, longest remaining charge, tag:<Tag> and all pick tools as statuses.md defines (ties leftmost, rate-0 skipped)
- [x] statusOn and statusOff events carry status and remaining; timers tick in step 1 of the tick order
- [x] A 50% duration modifier shortens a Throttle with floor and a 50 ms minimum (test)

## Subtasks

- [x] Status storage and timers
- [x] Charge-rate function
- [x] Selectors
- [x] status and charge effects

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

- Code lives in `src/sim/combat/status/` (statuses.ts, charge.ts, select.ts, status-effects.ts) to keep `src/sim/combat` under dir_files; `valueAt` moved to state.ts to avoid an import cycle; `createEnemy` extracted for T021 spawns.
- Reading of statuses.md: "rate-0 skipped" applies to `fastest`. For `longestCharge` a rate-0 tool never fires, so it ranks highest (ties leftmost); otherwise `retry_with_backoff` could never clear a Throttle.
- Selectors are evaluated once per activation (cached per selector), so retry_with_backoff clears Throttle and hastes the same tool.
- Haste, Slow and Throttle on the agent go to every tool; Stun stays on the agent and stops all its tools.
- `statusOff`: src `sys` and v 0 on expiry; on clearStatus src is the tool and v is the ms cut short; `remaining` is 0. `charge` v is the requested ms, cause is the source tool def id. Charge effects ignore Throttle/Stun (only pipes are specified to; T022).
- Effect selector `tool` picks nothing (TODO(T032)); the duration-mod sources (throttleDurPct, stunDurPct) arrive with E007 via `StatusApp.mod`.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat/status (charge.test.ts `charge rate formula`: 12 cases incl. clamp 10/400, Haste x2, Slow floor, both x1, Throttle/Stun 0; `rate 0 keeps progress`)
- 2026-10-01: AC2 verified: statuses.test.ts `stacking and caps` (Haste/Slow add to 10 000; Throttle/Stun longer remaining; Throttle cap 10 000, Stun cap 5000)
- 2026-10-01: AC3 verified: select.test.ts `tool selectors` (leftmost, rightmost, tag, all, fastest with ties and rate-0 skip, longestCharge with ties) and effect dispatch tests
- 2026-10-01: AC4 verified: charge.test.ts `statusOn and statusOff carry status and remaining; expiry happens in step 1` (grep fires at 4800 ms) and statuses.test.ts `timers`
- 2026-10-01: AC5 verified: statuses.test.ts `a 50% modifier shortens a Throttle with floor and a 50 ms minimum`
- 2026-10-01: npm run check exit 0 (239 tests, coverage lines 98.43%, harness lint 0 errors)
- 2026-10-01: review requested
- 2026-10-01: done (R025)
