---
id: T024
epic: E002
title: Sim determinism property tests and reference goldens
summary: "fast-check property tests for determinism and sim invariants, canonical JSONL serialisation with SHA-256 hashes, and 5 reference golden fights."
keywords: ["sim", "property-tests", "golden-logs", "determinism", "fast-check", "hashing"]
type: task
status: in-progress
priority: p1
model: opus
size: M
depends_on: [T021, T022, T023, T008]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T024: Sim determinism property tests and reference goldens

## Goal

Lock in determinism: the same input always gives the same log, sim invariants hold on random inputs, and any change to reference fights shows up as a readable diff.

## Context

- Epic: [E002](EPIC.md)
- [Testing: Property tests, Golden logs](../../../../docs/architecture/testing.md#property-tests-fast-check)
- [Event log: Canonical serialisation and hashing](../../../../docs/architecture/event-log.md#canonical-serialisation-and-hashing)
- [Simulation core: Determinism rules](../../../../docs/architecture/sim-core.md#determinism-rules-checked-in-review-and-tests)
- Code: `src/sim/**/*.prop.test.ts`, `src/sim/serialise.ts`, `tests/golden/`
- Out of scope: Context invariants (E003), run-level goldens on 20 seeds (E010), fast-forward equivalence (E010).

## Acceptance Criteria

- [ ] Property test `same input twice gives identical logs` passes on 200 random inputs
- [ ] Property tests for testing.md invariants 2, 4, 5 and 8 pass
- [ ] tests/golden holds canonical JSONL plus SHA-256 hash for 5 short reference fights and fails with a readable diff on change
- [ ] src/sim line coverage ≥ 95% in `npm run test:coverage`

## Subtasks

- [ ] Arbitraries for loadouts and encounters
- [ ] Canonical JSONL and hash
- [ ] Golden files and update flag
- [ ] Coverage gaps

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
