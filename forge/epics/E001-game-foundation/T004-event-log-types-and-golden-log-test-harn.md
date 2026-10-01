---
id: T004
epic: E001
title: Event log types and golden-log test harness
summary: "Define the CombatEvent log types and a golden-log test harness that diffs seed-to-log output against stored snapshots, so sim changes are reviewed as log diffs."
keywords: ["event-log", "golden", "snapshot", "testing", "types", "combat"]
type: task
status: backlog
priority: p0
model: opus
size: M
depends_on: [T003]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T004: Event log types and golden-log test harness

## Goal

Define the typed event log (toolFired, damage, noise, zone, compaction and so on) and a harness that runs a fixture input and compares its log to a stored golden file. This gives all later sim work a regression net.

## Context

- Epic: [E001](EPIC.md)
- Tech stack: [tech-stack.md](../../../docs/research/game/tech-stack.md) (combat event log, tests/golden)
- Design: [game-design-proposal.md](../../../docs/research/game/game-design-proposal.md) (pillar 1: logs explain losses)

## Acceptance Criteria

- [ ] CombatEvent is a discriminated union per docs/architecture/event-log.md (time field `t` in integer ms)
- [ ] A golden test compares a fixture run to a stored log and fails with a readable diff on change
- [ ] An explicit update command regenerates goldens (never silently)
- [ ] Log serialization is stable (sorted keys, integers only)

## Subtasks

- [ ] Define CombatEvent types in src/sim/events.ts
- [ ] Write a tiny stub producer using the RNG for fixtures
- [ ] Implement golden file read, write and diff helpers in tests/golden
- [ ] Add the explicit update flag via env var or script
- [ ] Add a first golden test and a hash check and document the workflow in the test file header

## Notes

## Log

- 2026-10-01: created
