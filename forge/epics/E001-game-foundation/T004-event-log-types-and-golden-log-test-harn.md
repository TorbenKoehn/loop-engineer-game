---
id: T004
epic: E001
title: Event log types and golden-log test harness
summary: "Define the CombatEvent log types and a golden-log test harness that diffs seed-to-log output against stored snapshots, so sim changes are reviewed as log diffs."
keywords: ["event-log", "golden", "snapshot", "testing", "types", "combat"]
type: task
status: done
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

- [x] CombatEvent is a discriminated union per docs/architecture/event-log.md (time field `t` in integer ms)
- [x] A golden test compares a fixture run to a stored log and fails with a readable diff on change
- [x] An explicit update command regenerates goldens (never silently)
- [x] Log serialization is stable (sorted keys, integers only)

## Subtasks

- [x] Define CombatEvent types in src/sim/events.ts
- [x] Write a tiny stub producer using the RNG for fixtures
- [x] Implement golden file read, write and diff helpers in src/sim/golden (allowed path)
- [x] Add the explicit update flag via env var or script
- [x] Add a first golden test and a hash check and document the workflow in the test file header

## Notes

- Golden harness lives in `src/sim/golden/` (allowed scope), not `tests/golden/` as in
  testing.md; helpers use `node:fs`/`node:crypto` and are test-only.
- Update: `npm run golden:update` runs `tools/golden/update.ts`, which sets
  `GOLDEN_UPDATE=1` for `vitest run src/sim/golden`. Plain `npm test` never writes.
- Goldens are LF; CRLF checkouts are normalised on read.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: src/sim/events.ts union over `kind`, `t` integer ms; tsc narrowing test in events.test.ts
- 2026-10-01: AC2 verified: golden.test.ts; temp START_SEV 30->31 failed with `@@ line N` -/+ diff (reverted)
- 2026-10-01: AC3 verified: missing golden fails with hint and writes nothing; `npm run golden:update` wrote fixtures
- 2026-10-01: AC4 verified: events.test.ts fixed key order, sorted d keys, RangeError on non-integers
- 2026-10-01: npm run check exit 0 (vitest 10 files passed)
- 2026-10-01: review requested
- 2026-10-01: done (R008)
