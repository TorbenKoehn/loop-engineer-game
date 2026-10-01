---
id: T064
epic: E009
title: Map screen with reachable nodes and travel
summary: "Vertical bottom-to-top map DAG with ASCII node icons and aria labels, current and reachable nodes, encounter preview on hover or focus, travel dispatch and breadcrumb."
keywords: ["ui", "map", "navigation", "nodes", "screens"]
type: task
status: done
priority: p1
model: opus
size: M
depends_on: [T063, T041]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T064: Map screen with reachable nodes and travel

## Goal

The player sees the whole phase and picks a route with full information about upcoming fights.

## Context

- Epic: [E009](EPIC.md)
- [Screens: Map row](../../../../docs/game/ux/screens.md#other-screens)
- [Run and map: Node types (icons), Encounter selection (preview)](../../../../docs/game/systems/run-map.md#node-types)
- Code: `src/ui/screens/map/`
- Out of scope: Node screens (other E009 tasks), map juice.

## Acceptance Criteria

- [x] The map renders the generated DAG bottom to top with box-drawing edges, ASCII icons and an aria label per node type
- [x] The current node is red, reachable nodes pulse, and clicking or Enter on one dispatches travel
- [x] Hover or focus shows the encounter ("Task: Context Drift + Typo"); elites show only "Critical Bug"
- [x] The top-bar breadcrumb shows phase and row

## Subtasks

- [x] Layout and edges
- [x] Node component
- [x] Preview
- [x] Breadcrumb

## Notes

- budget_override task_diff_lines: 712 production lines (measured by R063; ~260 CSS); reason: player-facing map screen polish, split would be ceremony; orchestrator-approved 2026-10-01. Follow-up (R063 F3): lazyScreen should show an error when the map chunk fails to load.

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

- 2026-10-01: Breadcrumb now follows screens.md (`phase-1/implement › row 3`) instead of `phase-{n}/{mode}`; e2e specs that used the mode in the banner now assert headings, the Fight region or placeholder text (no assertion removed). The map test id is `node-<id>`; combat.spec travels via it.
- 2026-10-01: MapScreen is the first lazy screen (signal loader; `preact/compat` lazy cost +3 kB gzip in the main chunk). Main chunk 38.13 -> 38.81 kB gzip, map chunk 2.3 kB.
- 2026-10-01: Abandon stays on the map as a small button below the legend (legal map action, run-map.md "Run end").
- 2026-10-01: Pre-existing, not from this task: T051 is committed with a done Log but frontmatter still in-progress (counts toward wip_in_progress); combat.spec expected -18 Trust; T029 changed it to -20 Trust / 3 compactions. On orchestrator request combat.spec now asserts the result strip format (`/-\d+ Trust/`, `/\d+ compactions?/`).
- 2026-10-01: Production diff ~ +560 lines incl. ~270 lines CSS (map.css) and 40 strings; over 400 because of the polish requested (states by border style, preview, legend, reduced motion).

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx playwright test map (bottom-to-top boxes, icons + aria labels per type, link text only box-drawing); vitest layout.test.ts (7 passed)
- 2026-10-01: AC2 verified: map.spec (current aria-current + rgb(217,30,54) fill, reachable animation node-pulse, Enter and click travel, reduced motion static ring)
- 2026-10-01: AC3 verified: map.spec (focus preview "Task: Typo + Context Drift", hover elite heading exactly "Critical Bug", boss "Release: Legacy Monolith")
- 2026-10-01: AC4 verified: map.spec breadcrumb "phase-1/implement" -> "phase-1/implement › row 1" -> "› row 2"
- 2026-10-01: checks: tsc, biome, vitest (628 passed) green; build green; e2e 7/8 (combat.spec -18 vs -20 Trust, pre-existing); npm run check exit 0 after status review (wip_in_progress cleared)
- 2026-10-01: review requested
- 2026-10-01: orchestrator follow-up: combat.spec result strip asserts format, Abandon button restored on the map (map.spec covers it); npm run e2e 8 passed, npm run check exit 0
- 2026-10-01: review requested
- 2026-10-01: done (R063)
