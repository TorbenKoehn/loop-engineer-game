---
id: T075
epic: E010
title: Run-level golden logs on 20 seeds
summary: "Golden files for 20 bot-run seeds covering both harnesses and every slice encounter, storing per-fight input and log hashes, checked byte-identically in npm test."
keywords: ["golden-logs", "determinism", "regression", "seeds", "exit-criteria"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T071, T024]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T075: Run-level golden logs on 20 seeds

## Goal

Prove M1 exit criterion 4: the same seed and actions give a byte-identical combat log, across whole runs.

## Context

- Epic: [E010](EPIC.md)
- [Testing: Golden logs](../../../../docs/architecture/testing.md#golden-logs)
- [Event log: Canonical serialisation and hashing](../../../../docs/architecture/event-log.md#canonical-serialisation-and-hashing)
- [Vertical slice: Exit criterion 4](../../../../docs/game/vertical-slice.md#exit-criteria)
- Code: `tests/golden/`
- Out of scope: Phase 2-3 and Endless goldens (E016).

## Acceptance Criteria

- [ ] tests/golden/<seed>.json exists for 20 seeds covering both harnesses and every slice encounter, with nodeId, inputHash, logHash and events per fight
- [ ] `npx vitest run tests/golden` passes, and a changed fight fails naming the first differing fight
- [ ] Updating goldens needs an explicit `-u`, documented in the test header

## Subtasks

- [ ] Seed selection for coverage
- [ ] Golden writer
- [ ] Comparison test

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
