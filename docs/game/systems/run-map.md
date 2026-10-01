---
title: Run structure and map
summary: Phase structure, node types and the seeded StS-style map generation rules (grid, paths, placement constraints), encounter selection and phase transitions.
keywords: [map, run-structure, node-types, generation, encounters, phases]
type: gdd
status: active
updated: 2026-10-01
related_code: [src/run/map/**]
related: [economy.md, combat.md, ../content/events.md, ../content/phase-1-implement.md, ../../architecture/run-state.md]
---

# Run structure and map

## Contents
- Phases
- Node types
- Map generation (seeded)
- Encounter selection
- Rewards per node
- Events
- Run end

## Phases

| # | Phase | Boss | Enemy pool | Theme |
|---|---|---|---|---|
| 1 | Implement | Legacy Monolith | [phase 1](../content/phase-1-implement.md) | Writing code: typos, drift, dependencies |
| 2 | Test | The Flaky CI Pipeline | [phase 2](../content/phase-2-test.md) | Consistency: flaky, conflicts, hallucinations |
| 3 | Deploy | Production Incident | [phase 3](../content/phase-3-deploy.md) | Pressure: loops, leaks, permissions, outages |

Each phase is one map: 7 rows plus the boss. A run visits 8 nodes per phase, 24 total.
Phase transition (after a boss win): restore 50% of **missing** Trust
(`PHASE_HEAL_PCT = 50`), show the phase card, then the next map.

## Node types

| Node | Icon | Content |
|---|---|---|
| Task | `>_` | Normal fight from the phase pool |
| Critical Bug | `!!` | Elite fight |
| Package Registry | `$` | Shop |
| Standup | `?` | Event |
| Idle Cycle | `zz` | Rest: heal 30% max Trust (round up) **or** +1 version on one tool |
| Free Tier | `[]` | Gain one random Memory |
| Release | `##` | Boss fight |

Icons are ASCII so they work in every font and for screen readers (each has an aria label).

## Map generation (seeded)

RNG: `fork(runSeed, 'map/' + phase)`. Grid: 7 rows × 5 columns.

1. **Paths**: draw 4 paths. Each starts at a random column of row 1; the first two
   paths must start at different columns. From row `r` to `r+1` a path moves to column
   `c−1`, `c` or `c+1` (clamped to 0–4, uniform). Reject a step that would cross an
   existing edge (edge `a->b` crosses `c->d` when `a<c` and `b>d` or vice versa); retry
   that step up to 10 times, else go straight.
2. Nodes = all grid cells touched by a path. Edges = all path steps (deduplicated).
3. All row-7 nodes connect to the single boss node.

**Fixed rows:** row 1 all Task (easy pool); row 4 all Free Tier; row 7 all Idle Cycle.

**Weighted rows 2, 3, 5, 6** (weights, tuning knobs):

| Type | Weight | Allowed rows |
|---|---|---|
| Task | 50 | 2, 3, 5, 6 |
| Standup | 22 | 2, 3, 5, 6 |
| Package Registry | 12 | 2, 3, 5, 6 |
| Critical Bug | 12 | 3, 5, 6 |
| Idle Cycle | 4 | 5 |

**Constraints** (re-roll the node's type up to 20 times, then fall back to Task):

- No edge connects two nodes that are both in {Critical Bug, Package Registry, Idle Cycle}
  of the **same** type.
- Two children of the same parent should differ in type (soft: try first).
- At least one Package Registry on rows 2–6 and at least one Critical Bug on rows 3–6.
  If missing after assignment, convert a random Task on an allowed row (re-check the
  same-type adjacency rule).
- Phase 1 of the very first run (tutorial): row 1 is a single node with the tutorial
  encounter, in column 2 (all 4 paths start there; the different-start rule is skipped).
- Replacement when Package Registry or Critical Bug is missing: convert a random Task on
  an allowed row, else a random Standup. No node of that type exists yet, so no
  adjacency re-check is needed.

## Encounter selection

RNG: `fork(runSeed, 'encounter/' + nodeId)`. Each phase has an **easy pool** (used on
rows 1–3) and a **hard pool** (rows 5–6), and an elite pool.

- Draw uniformly from the pool, excluding encounters already fought this phase, defined
  at generation as the encounters of any ancestor node (any node that can precede it on a
  path); reset the exclusion if it would exclude the whole pool.
- The first Task of a run is always drawn from the easy pool's first two entries.
- The same elite never appears twice in one phase once a second elite exists; until then
  (phase 1 has only p1x1) the elite repeats.
- Event modifiers (e.g. "Quick tiny change" adds Scope Creep) append enemies to the back.
- The encounter is chosen when the map is generated, so the map can show it on hover
  ("Task: Context Drift + Typo"). Elites show only "Critical Bug".

## Rewards per node

| Node | Credits | Pick | Extra |
|---|---|---|---|
| Task | 10 + roll 0–4 | 1 of 3 (tool 70% / skill 30%) | |
| Critical Bug | 22 + roll 0–6 | 1 of 3, uncommon or better | + 1 random Memory |
| Release | 40 | 1 of 3, rare | Phase transition |

Rarity odds and interest: [economy](economy.md). Skip a pick: +6 Credits.

## Events

Standup nodes draw one event from the phase's event pool (RNG
`fork(runSeed, 'event/' + nodeId)`), excluding events seen this run. Catalogue:
[events](../content/events.md).

## Run end

- **Win** (phase 3 boss resolved): "Shipped!" screen, Training Data payout, AGENTS.md
  lesson, then optionally Endless ([endless and ascension](endless-ascension.md)).
- **Loss** (Trust 0): "^C" screen with the cause-of-death summary, lesson, payout.
- **Abandon**: counts as a loss without lesson choice.
