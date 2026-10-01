---
id: T046
epic: E004
title: Idle Cycle, Free Tier and elite memory nodes
summary: "Idle Cycle rest (heal 30% rounded up or +1 tool version), Free Tier random memory, the elite memory reward, and discard when memory slots and stash are full."
keywords: ["rest", "idle-cycle", "free-tier", "memories", "nodes"]
type: task
status: backlog
priority: p2
model: sonnet
size: S
depends_on: [T043]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T046: Idle Cycle, Free Tier and elite memory nodes

## Goal

The non-combat recovery nodes work, so the map offers real routing choices.

## Context

- Epic: [E004](EPIC.md)
- [Run and map: Node types, Rewards per node](../../../docs/game/systems/run-map.md#node-types)
- [Run state: treasure and elite-memory fork paths](../../../docs/architecture/run-state.md#rng-fork-paths)
- Code: `src/run/nodes.ts`
- Out of scope: Coffee Mug heal bonus (E014), node screens (E009).

## Acceptance Criteria

- [ ] restHeal heals ceil(30% of max Trust); restUpgrade gives +1 version to a chosen tool below v3 (tests)
- [ ] Free Tier grants one random unowned memory from the unlocked pool via `treasure/<nodeId>`
- [ ] A Critical Bug win adds one random memory via `elite-memory/<nodeId>`
- [ ] With memory slots and stash full the gain enters discard mode (test)

## Subtasks

- [ ] Rest actions
- [ ] Memory grants
- [ ] Discard path

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
