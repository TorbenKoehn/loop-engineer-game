---
id: T041
epic: E004
title: Seeded map generation and encounter selection
summary: "7x5 phase map with 4 non-crossing paths, fixed and weighted rows, placement constraints, tutorial row, and encounter selection per node from easy, hard and elite pools."
keywords: ["map", "generation", "encounters", "seeded", "run"]
type: task
status: done
priority: p1
model: opus
size: M
depends_on: [T040, T014]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T041: Seeded map generation and encounter selection

## Goal

Every run gets a fair, seeded map whose nodes already know their encounter, so the map can preview fights and runs replay exactly.

## Context

- Epic: [E004](EPIC.md)
- [Run and map: Map generation, Encounter selection](../../../../docs/game/systems/run-map.md#map-generation-seeded)
- [Run state: RNG fork paths, node ids](../../../../docs/architecture/run-state.md#rng-fork-paths)
- [Phase 1: Encounter pools](../../../../docs/game/content/phase-1-implement.md#encounter-pools)
- Code: `src/run/map/`
- Out of scope: Phase transitions and Endless prefixes (E012, E016), map UI (E009).

## Acceptance Criteria

- [x] Over 500 seeds: 7x5 grid, 4 paths, the first two start in different columns, no crossing edges, every row-7 node links to the boss
- [x] Row 1 is Task, row 4 Free Tier, row 7 Idle Cycle; weighted rows obey the allowed-row table
- [x] Over 500 seeds: no same-type edge among Critical Bug, Registry and Idle Cycle; at least one Registry in rows 2-6 and one Critical Bug in rows 3-6
- [x] Encounters: easy pool rows 1-3, hard rows 5-6, elite on Critical Bug; the first Task uses the first two easy entries; no repeats until a pool is exhausted
- [x] With the tutorial flag row 1 is a single p1e1 node; node ids follow p<phase>-r<row>-c<col> and p1-boss

## Subtasks

- [x] Paths and crossing check
- [x] Type assignment and constraints
- [x] Encounter selection
- [x] Property tests

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Code in `src/run/map/` (paths, node-types, encounters, graph, generate); `map-stub.ts` removed, `reachable` moved to `map/graph.ts`. `MapNode` gains `type` (`NodeType`, boss = `release` on row 8) and `encounter` (null on non-fight nodes).
- 2026-10-01: Decision: "excluding encounters already fought this phase" is applied at generation as "excluding encounters of any ancestor node" (every node that can precede it on some path), reset to the full eligible pool when that excludes all. So a path never repeats an encounter unless its pool is exhausted; the single phase-1 elite (p1x1) repeats by design until p1x2 lands.
- 2026-10-01: Decision: the tutorial row-1 node sits in column 2 (all 4 paths start there; the different-start rule applies only without the flag). The first-Task rule (first two easy entries) applies to phase-1 row 1. Retry counts: 1 draw + 10 retries per path step, 1 roll + 20 re-rolls per type; the soft sibling rule is enforced on the first 10 rolls only.
- 2026-10-01: Decision: a missing Registry / Critical Bug converts a random Task, else a Standup, on its allowed rows. The adjacency re-check is implicit: no node of that type exists yet. Possible doc follow-up for run-map.md (not edited, outside allowed paths).

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: production diff 297 lines (new src/run/map 248 + state/apply/new-run/map-stub 49); tests in src/run/map/generate.test.ts. Mutation check: disabling the crossing retry, the same-type rule, ensureType, the ancestor exclusion or the different-start rule each fails exactly one test.
- 2026-10-01: AC1 verified: npx vitest run src/run/map ("paths > 500 seeds: 4 paths over 7 rows, unit steps, first two start apart"; "500 seeds: 7x5 grid ..."; "500 seeds: edges go one row down, never cross, row 7 links to the boss"; 10 passed)
- 2026-10-01: AC2 verified: npx vitest run src/run/map ("500 seeds: fixed rows 1/4/7 and weighted types only on allowed rows")
- 2026-10-01: AC3 verified: npx vitest run src/run/map ("500 seeds: no same-type spaced edge, a Registry in rows 2-6, a Critical Bug in rows 3-6")
- 2026-10-01: AC4 verified: npx vitest run src/run/map ("500 seeds: encounters come from the pool of the node type and row"; "an encounter repeats an ancestor only once its pool is exhausted"; "the first Task draws both of the first two easy entries across seeds")
- 2026-10-01: AC5 verified: npx vitest run src/run/map ("tutorial: row 1 is a single p1e1 node"; "7x5 grid with p<phase>-r<row>-c<col> ids and p1-boss")
- 2026-10-01: npm run check exit 0 (tsc, biome, vitest, harness); src/run coverage 99% lines, 95% branches
- 2026-10-01: review requested
- 2026-10-01: done (R038)
