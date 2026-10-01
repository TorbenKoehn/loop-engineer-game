---
id: T014
epic: E005
title: Phase-1 enemies, elite, boss and encounter pools
summary: "Phase-1 enemies, Yak Shave elite with its tasks and Side Quest, Legacy Monolith with stages and add, and encounters p1e1-p1e5, p1h1-p1h5, p1x1, p1b as data."
keywords: ["content", "enemies", "phase-1", "boss", "encounters", "elite"]
type: task
status: done
priority: p1
model: opus
size: M
depends_on: [T010]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T014: Phase-1 enemies, elite, boss and encounter pools

## Goal

Provide every slice enemy and encounter as data with exact stat blocks, intents and traits, so maps can pick encounters and the sim can fight them.

## Context

- Epic: [E005](EPIC.md)
- [Phase 1: Enemies, Elites (Yak Shave), Boss, Encounter pools](../../../../docs/game/content/phase-1-implement.md)
- [Statuses: Enemy traits, Enemy action verbs](../../../../docs/game/systems/statuses.md#enemy-traits)
- [Combat: Deadline table](../../../../docs/game/systems/combat.md#deadline-and-fight-end)
- Code: `src/content/enemies/`, `src/content/encounters/`, `src/content/strings/en.ts`
- Out of scope: Trait and handler behaviour (E007); final ASCII portraits (E011, one-line placeholder art is fine); Copy-Paste Clone and p1x2 (E012).

## Acceptance Criteria

- [x] Test `phase-1 enemies match the GDD` asserts family, Severity, traits and intent cycles (verbs, values, windupMs) of all seven phase-1 enemies
- [x] Yak Shave, its three tasks and Side Quest, and Legacy Monolith with stages A/B/C and Undocumented Behavior are defined; their handler ids are listed in Notes
- [x] Encounters p1e1-p1e5, p1h1-p1h5, p1x1 and p1b list enemies front to back as in the pools table, with deadlineMs 45000 / 50000 / 75000 by pool
- [x] Copy-Paste Clone and p1x2 are absent

## Subtasks

- [x] Enemy defs
- [x] Elite and boss defs
- [x] Encounter pools
- [x] Strings incl. intent names

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Handler ids: `legacy_monolith.handler = 'monolith_stage'` (stage switch on armor-layer break, cycle index reset; string `handler.monolith_stage`). Yak Shave needs no handler: Another Thing First is a `spawn` verb with `at: 'front'`, `perFight: 2`, `maxOthers: 3`, `max: 2`. No other enemy uses a handler.
- 2026-10-01: Layout: `src/content/enemies/` (phase1.ts, yak-shave.ts, legacy-monolith.ts, intent.ts builders, index.ts registry `enemies` + `DefinedEnemyId`), `src/content/encounters/phase1.ts` (`phase1Encounters`). Strings live in `src/content/strings/en-enemies.ts`, spread into `en` (one import + one spread line in en.ts to limit merge conflicts with T012/T013).
- 2026-10-01: Monolith data choices for E007: top-level `cycle` equals stage A's cycle (the current sim reads `def.cycle`; an empty cycle would break it), stages `a` [3,3], `b` [1,2], `c` [0,0]. describeEnemy therefore lists stage A intents twice; the boss tooltip should show the active stage. Stage B's add spawn keeps the stage A cap `max: 2` (GDD states it only for A). Add spawns `at: 'front'`.
- 2026-10-01: Not in the GDD, named here: intents of Install Dependency (`install`), Update Toolchain (`upgrade`), Fix Unrelated Bug (`detour`), Side Quest (`distraction`); stage names `enemy.legacy_monolith.stage.a/b/c` = Stage A / Stage B / Rewrite. Art is a one-line placeholder (E011). No enemy flavour lines exist in the GDD, so none were added.
- 2026-10-01: text.test.ts expected the raw id `transitive_dep` (fallback until names existed); it now expects "Transitive Dep" and keeps the fallback asserted with a table lacking the key.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/content/enemies (describe `phase-1 enemies match the GDD`: 7 enemies, family/sev/traits/cycle per row)
- 2026-10-01: AC2 verified: enemies.test.ts `Yak Shave elite matches the GDD` and `Legacy Monolith matches the GDD` (stages a/b/c, add, handler monolith_stage); handler ids in Notes
- 2026-10-01: AC3 verified: encounters/phase1.test.ts `lists p1e1-p1e5, p1h1-p1h5, p1x1 and p1b ...` and `sets deadlineMs 45000 / 50000 / 75000 by pool` (src/content/enemies + encounters: 20 passed)
- 2026-10-01: AC4 verified: test `Copy-Paste Clone and p1x2 are absent` and registry test (no copy_paste_clone)
- 2026-10-01: npm run check exit 0 (tsc, biome, vitest, harness:check 0 errors)
- 2026-10-01: review requested
- 2026-10-01: done (R018)
