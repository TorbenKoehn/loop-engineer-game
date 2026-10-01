---
id: T021
epic: E002
title: Enemy intent cycles, action verbs and phase scaling
summary: "Enemy opening and cycle intents with windups, the action verbs hit, multiHit, throttle, slow, stun, guard, heal, spawn and a noise hook, the 5-enemy cap and phase scaling."
keywords: ["sim", "enemies", "intents", "verbs", "spawn", "phase-scaling"]
type: task
status: done
priority: p0
model: opus
size: M
depends_on: [T019, T020]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T021: Enemy intent cycles, action verbs and phase scaling

## Goal

Enemies telegraph and execute their intents on time, using only the documented verbs, so every enemy threat is visible and predictable.

## Context

- Epic: [E002](EPIC.md)
- [Combat: Enemy intents and phase scaling, Readability rule 1](../../../../docs/game/systems/combat.md#enemy-intents-and-phase-scaling)
- [Statuses: Enemy action verbs](../../../../docs/game/systems/statuses.md#enemy-action-verbs)
- [Event log: intentSet, enemyActed, spawn](../../../../docs/architecture/event-log.md#event-kinds)
- Code: `src/sim/combat/enemies.ts`, `src/sim/combat/verbs.ts`
- Out of scope: Noise effect on the context bar (E003, here only a hook), redirect and custom verbs, traits (E007).

## Acceptance Criteria

- [x] Test `intent cycle` resolves opening then cycle intents in order with intentSet and enemyActed events and progress reset
- [x] Verbs hit, multiHit, throttle, slow, stun, guard, heal and spawn each have a test; noise(n) calls a context hook
- [x] spawn respects its max and the 5-enemy cap, and dropped spawns are logged
- [x] Test `phase scaling`: a homePhase-1 enemy in phase 2 has Severity x170/100 and damage x150/100 (floor)
- [x] In the same tick the agent acts before enemies (test)

## Subtasks

- [x] Intent progress and cycle
- [x] Verb handlers
- [x] Spawn insertion and cap
- [x] Phase scaling constants

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Code lives in `src/sim/combat/enemy/` (act, cycle, verbs, spawn, phase) instead of `combat/enemies.ts` and `combat/verbs.ts`, to keep `src/sim/combat` under the dir_files budget; `enemies.ts` was moved there.
- 2026-10-01: `intentIx` indexes opening ++ cycle; after the last cycle entry it wraps to the first cycle entry. `intentSet.d.ix` uses the same index.
- 2026-10-01: Spawn defs not in the starting line arrive via the new optional `EncounterSetup.spawnDefs` (run/encounter builders must fill it, e.g. Side Quest). An unknown spawn id throws. `docs/architecture/sim-core.md` API block does not list the field yet (doc outside this task's allowed paths).
- 2026-10-01: Spawn without `at` goes to the back (not documented in the GDD). A blocked spawn (max living copies, perFight, maxOthers or the 5-enemy cap) is logged as a `spawn` event with src = spawner, no dst, v 0, index -1, reason `intent`; no new event kind, so no LOG_VERSION bump. `docs/architecture/event-log.md` should document this convention.
- 2026-10-01: Phase scaling applies only when the encounter phase is later than homePhase; damage scaling is on the base of hit/multiHit (floor), guard and heal are unscaled. Noise passes the raw n to `ContextHooks.noise` (phase noise scale is T027). Endless loop scaling: E016. redirect and custom are no-ops (M2, E007).

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat/enemy/act.test.ts, describe `intent cycle` (opening once then cycle, enemyActed and intentSet with ix, progress reset without carry-over)
- 2026-10-01: AC2 verified: src/sim/combat/enemy/verbs.test.ts has one test each for hit, multiHit, throttle, slow, stun, guard, heal; spawn in spawn.test.ts; `noise(n) calls the context hook` uses a vi.fn hook
- 2026-10-01: AC3 verified: src/sim/combat/enemy/spawn.test.ts `respects max living copies and logs dropped spawns`, `never exceeds 5 living enemies` (dropped spawn event, index -1)
- 2026-10-01: AC4 verified: act.test.ts `phase scaling` - homePhase 1 in phase 2: Sev 30 -> 51, hit 7 -> 10 (floor of 10.5)
- 2026-10-01: AC5 verified: act.test.ts `agent acts before enemies in the same tick` (toolFired seq < enemyActed seq at 3000 ms; an enemy resolved in that tick never acts)
- 2026-10-01: npm run check green (tsc, biome, vitest 13 sim files / 128 sim tests, harness:check 0 errors)
- 2026-10-01: review requested
- 2026-10-01: done (R028)
