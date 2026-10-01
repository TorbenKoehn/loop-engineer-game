---
id: T064
epic: E009
title: Map screen with reachable nodes and travel
summary: "Vertical bottom-to-top map DAG with ASCII node icons and aria labels, current and reachable nodes, encounter preview on hover or focus, travel dispatch and breadcrumb."
keywords: ["ui", "map", "navigation", "nodes", "screens"]
type: task
status: in-progress
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

- [ ] The map renders the generated DAG bottom to top with box-drawing edges, ASCII icons and an aria label per node type
- [ ] The current node is red, reachable nodes pulse, and clicking or Enter on one dispatches travel
- [ ] Hover or focus shows the encounter ("Task: Context Drift + Typo"); elites show only "Critical Bug"
- [ ] The top-bar breadcrumb shows phase and row

## Subtasks

- [ ] Layout and edges
- [ ] Node component
- [ ] Preview
- [ ] Breadcrumb

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
