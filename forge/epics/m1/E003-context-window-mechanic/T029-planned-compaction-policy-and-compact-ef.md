---
id: T029
epic: E003
title: Planned compaction policy and compact effect
summary: "Compaction policy 70/80/90/never with 3000 ms lockout, Stun 1000 ms keeping buffs, the disabled-policy rule, and the compact effect that ignores policy and lockout."
keywords: ["context", "compaction", "policy", "lockout", "planned"]
type: task
status: done
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

- [x] Test `policy 80 compacts at 80%` reproduces the worked example: at F = 48, N = 0, S = 26, Stun 1000 ms, buffs kept
- [x] No planned compaction within 3000 ms of the last one, nor when the same addition triggered auto-compaction (tests)
- [x] The policy is disabled when (B + floor(W x 10 / 100)) x 100 ≥ W x p, and fightStart flags it for the UI
- [x] Policy 0 never compacts; the compact effect compacts ignoring policy and lockout (tests)

## Subtasks

- [x] Policy trigger
- [x] Lockout
- [x] Disabled rule
- [x] compact effect

## Notes

- Orchestrator (GDD owner) 2026-10-01 (R061 minor): confirmed - after a planned compaction, tools that have not fired this tick still fire (planned is the lighter, controlled variant).

- Orchestrator 2026-10-01: re-add `policy` and `lastCompactT` to the Ctx row in docs/architecture/sim-core.md when they land (removed by gardening because not yet shipped).

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Code in `src/sim/combat/context/compaction.ts` (as T028). `Ctx` gained `policy` (from `CombatInput.policy`) and `lastCompactT?` (any compaction kind); sim-core.md Ctx row re-added. CombatInput unchanged: `policy` already existed and src/run/combat.ts already passes `agent.policy`, so real fights now compact by policy (default 80); test builder default stays 0.
- 2026-10-01: "After an addition" taken literally: `outputTokens` returns the tokens added; removals and output 0 never trigger the policy. The fight-start check counts as an addition.
- 2026-10-01: Planned compaction does not skip the remaining tools of the tick (GDD lists that only for auto); documented in context.md.
- 2026-10-01: The `compact` effect logs `compaction {kind:'tool'}` (the existing third kind), Stun 1000 ms, buffs kept, raises `compaction` rules; zone update stays with the caller.
- 2026-10-01: Log format: `fightStart.d.policyOff?: 1` added, LOG_VERSION 1 -> 2 (not part of any golden payload: goldens unchanged, no golden:update needed).

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat/context/planned.test.ts `policy 80 compacts at 80% (worked example)` (F 21 -> 27 with 6 noise -> 42 Rot -> 48: planned, S 26, N 0, Stun 1000, Haste kept)
- 2026-10-01: AC2 verified: planned.test.ts `lockout` (no compaction at +2950 ms, one at +3000 ms; auto starts the lockout; the overflow addition yields only `auto`; removal does not trigger)
- 2026-10-01: AC3 verified: planned.test.ts `disabled policy` (fightStart policyOff at B 36/p 70, absent at B 35, p 80 and p 0; integer boundary W 45/p 90; disabled policy never compacts at 90%)
- 2026-10-01: AC4 verified: planned.test.ts `policy never and the compact effect` (policy 0 at F 59/60 no compaction; compact tool within lockout and policy 0: kind tool, S 26, Stun 1000, Haste kept; compact as rule effect raises compaction rules)
- 2026-10-01: npm run check: all steps passed (633 tests); production diff 126 lines
- 2026-10-01: review requested
- 2026-10-01: done (R061)
