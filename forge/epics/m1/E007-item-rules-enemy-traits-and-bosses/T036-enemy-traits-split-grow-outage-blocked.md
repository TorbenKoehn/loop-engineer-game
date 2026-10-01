---
id: T036
epic: E007
title: Enemy traits Split, Grow, Outage, Blocked
summary: "Enemy traits Split (spawn children at index), Grow (timed Severity and damage growth), Outage (disabled tag effects) and Blocked (immune while others live), with trait events."
keywords: ["traits", "enemies", "split", "grow", "outage", "blocked"]
type: task
status: done
priority: p1
model: opus
size: M
depends_on: [T021, T023]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T036: Enemy traits Split, Grow, Outage, Blocked

## Goal

Each phase-1 enemy teaches its mechanic through its trait, implemented exactly as the trait catalogue states.

## Context

- Epic: [E007](EPIC.md)
- [Statuses: Enemy traits (Split, Grow, Outage, Blocked)](../../../../docs/game/systems/statuses.md#enemy-traits)
- [Combat: Tick order steps 2 and 8](../../../../docs/game/systems/combat.md#tick-order)
- [Phase 1: Enemies](../../../../docs/game/content/phase-1-implement.md#enemies)
- Code: `src/sim/combat/traits.ts`
- Out of scope: Armor and bosses (next tasks), M2 traits (E012), Cache and Always Online Outage exceptions beyond a mod hook.

## Acceptance Criteria

- [x] Split(2, 50): resolving Dependency Hell spawns 2 Transitive Deps at its index at 50% of the parent's max Severity (spawn reason split)
- [x] Grow(4000, 6, 1): every 4000 ms Scope Creep gains +6 max and current Severity and +1 attack, with trait events
- [x] Outage(Web): Web tools fire and add output but their effects do nothing while the enemy lives
- [x] Blocked: 0 damage while any non-Blocked enemy lives; Deadline damage still applies
- [x] Timed traits tick in step 2 of the tick order (test)

## Subtasks

- [x] Trait state
- [x] On-death traits
- [x] Timed traits
- [x] Damage gates

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Code lives in `src/sim/combat/enemy/traits.ts` (not `combat/traits.ts`: `src/sim/combat/` is at 14 of 15 files).
- 2026-10-01: Decisions. Grow `sev`/`dmg` are not phase-scaled; the attack bonus is added after phase scaling. The Grow timer counts each enemy's own ms in the fight (spawned enemies start at 0). "Alive" for Blocked/Outage is Severity > 0 at that moment, so a task killed earlier in the same step no longer shields Yak Shave. Timed-out activations still consume primes, run `toolFired` rules and pipe; only `tool.def.effects` are skipped. Split children beyond the 5-enemy cap are dropped and logged like intent spawns. Step 5 no longer wins when on-death spawns refill the line.
- 2026-10-01: Fight logs change for every fight with Split, Grow, Outage or Blocked enemies (e.g. p1x1 Yak Shave, p1h1, p1e4, p1e5); T024 goldens/property fixtures over these must be regenerated after merge. No kind or field was added, so `LOG_VERSION` stays 2; the existing `tools/golden` fixtures are unchanged.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat/enemy/traits.test.ts ("Split(n, pct)" 4 tests: index, phase-scaled 50%, 5-cap drop, no early win) and src/run/combat.test.ts "Split(2, 50): Dependency Hell resolves into 2 Transitive Deps at its index" (real p1h1, v 60, reason split)
- 2026-10-01: AC2 verified: traits.test.ts "every ms: max and current Severity +sev and attack +dmg, with trait events" (sev/maxSev 112 after 8000 ms, hit base 2/3/4) and combat.test.ts "Grow(4000, 6, 1)" over real Scope Creep (p1e4)
- 2026-10-01: AC3 verified: traits.test.ts "tools with the tag fire and add output but their effects do nothing while it lives" (+ Cache hook test) and combat.test.ts "Outage(Web): web_search fires and adds output but does nothing; Cache exempts it" (real p1e5, real cache memory)
- 2026-10-01: AC4 verified: traits.test.ts Blocked (3 tests: 0 while a task lives, Guardrails untouched, Deadline hits, only-Blocked left take damage) and combat.test.ts "Blocked: Yak Shave takes 0 while its tasks live; Deadline still hits it" (real p1x1, sed AoE)
- 2026-10-01: AC5 verified: traits.test.ts "ticks in step 2: before every rules (same step) and tool fire (step 4)" (t 4000 order trait, trait, guard (every rule), toolFired; damage d.sev 105)
- 2026-10-01: production diff 178 lines (git diff --numstat, src non-test incl. new traits.ts); npm run check: all steps passed (699 tests, harness lint 0 errors)
- 2026-10-01: review requested
- 2026-10-01: done (R067)
