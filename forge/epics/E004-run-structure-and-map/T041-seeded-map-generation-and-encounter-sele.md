---
id: T041
epic: E004
title: Seeded map generation and encounter selection
summary: "7x5 phase map with 4 non-crossing paths, fixed and weighted rows, placement constraints, tutorial row, and encounter selection per node from easy, hard and elite pools."
keywords: ["map", "generation", "encounters", "seeded", "run"]
type: task
status: backlog
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
- [Run and map: Map generation, Encounter selection](../../../docs/game/systems/run-map.md#map-generation-seeded)
- [Run state: RNG fork paths, node ids](../../../docs/architecture/run-state.md#rng-fork-paths)
- [Phase 1: Encounter pools](../../../docs/game/content/phase-1-implement.md#encounter-pools)
- Code: `src/run/map/`
- Out of scope: Phase transitions and Endless prefixes (E012, E016), map UI (E009).

## Acceptance Criteria

- [ ] Over 500 seeds: 7x5 grid, 4 paths, the first two start in different columns, no crossing edges, every row-7 node links to the boss
- [ ] Row 1 is Task, row 4 Free Tier, row 7 Idle Cycle; weighted rows obey the allowed-row table
- [ ] Over 500 seeds: no same-type edge among Critical Bug, Registry and Idle Cycle; at least one Registry in rows 2-6 and one Critical Bug in rows 3-6
- [ ] Encounters: easy pool rows 1-3, hard rows 5-6, elite on Critical Bug; the first Task uses the first two easy entries; no repeats until a pool is exhausted
- [ ] With the tutorial flag row 1 is a single p1e1 node; node ids follow p<phase>-r<row>-c<col> and p1-boss

## Subtasks

- [ ] Paths and crossing check
- [ ] Type assignment and constraints
- [ ] Encounter selection
- [ ] Property tests

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
