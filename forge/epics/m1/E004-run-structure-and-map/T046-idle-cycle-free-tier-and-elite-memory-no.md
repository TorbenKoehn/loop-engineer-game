---
id: T046
epic: E004
title: Idle Cycle, Free Tier and elite memory nodes
summary: "Idle Cycle rest (heal 30% rounded up or +1 tool version), Free Tier random memory, the elite memory reward, and discard when memory slots and stash are full."
keywords: ["rest", "idle-cycle", "free-tier", "memories", "nodes"]
type: task
status: done
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
- [Run and map: Node types, Rewards per node](../../../../docs/game/systems/run-map.md#node-types)
- [Run state: treasure and elite-memory fork paths](../../../../docs/architecture/run-state.md#rng-fork-paths)
- Code: `src/run/nodes.ts`
- Out of scope: Coffee Mug heal bonus (E014), node screens (E009).

## Acceptance Criteria

- [x] restHeal heals ceil(30% of max Trust); restUpgrade gives +1 version to a chosen tool below v3 (tests)
- [x] Free Tier grants one random unowned memory from the unlocked pool via `treasure/<nodeId>`
- [x] A Critical Bug win adds one random memory via `elite-memory/<nodeId>`
- [x] With memory slots and stash full the gain enters discard mode (test)

## Subtasks

- [x] Rest actions
- [x] Memory grants
- [x] Discard path

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: nodes.test.ts 'restHeal heals ceil(30%)' and 'restUpgrade gives +1 version' (+ v3 rejection)
- 2026-10-01: AC2 verified: nodes.test.ts 'takeTreasure grants the memory rolled from treasure/<nodeId>'
- 2026-10-01: AC3 verified: nodes.test.ts 'a win adds one memory rolled from elite-memory/<nodeId>'
- 2026-10-01: AC4 verified: nodes.test.ts Free Tier 'memory slots and stash full enters discard mode' and elite 'full loadout discards, then resumes the reward pick'
- 2026-10-01: combat.test.ts seed search now continues until both a ship and a loss are found (assertions unchanged)
- 2026-10-01: R059 changes-requested (1 major: missing Log evidence); resumed same agent for the fix
- 2026-10-01: addressed R059 (2 findings): Log evidence added; empty-pool tests for Free Tier and elite
- 2026-10-01: npm run check exit 0 (633 tests passed, lint 0 errors)
- 2026-10-01: review requested
- 2026-10-01: done (R060)
