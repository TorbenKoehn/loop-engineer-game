---
id: T024
epic: E002
title: Sim determinism property tests and reference goldens
summary: "fast-check property tests for determinism and sim invariants, canonical JSONL serialisation with SHA-256 hashes, and 5 reference golden fights."
keywords: ["sim", "property-tests", "golden-logs", "determinism", "fast-check", "hashing"]
type: task
status: done
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

- [x] Property test `same input twice gives identical logs` passes on 200 random inputs
- [x] Property tests for testing.md invariants 2, 4, 5 and 8 pass
- [x] tests/golden holds canonical JSONL plus SHA-256 hash for 5 short reference fights and fails with a readable diff on change
- [x] src/sim line coverage ≥ 95% in `npm run test:coverage`

## Subtasks

- [x] Arbitraries for loadouts and encounters
- [x] Canonical JSONL and hash
- [x] Golden files and update flag
- [x] Coverage gaps

## Notes

- budget_override task_diff_lines total: 1252 (production 100); reason: 588 lines are generated golden fixtures required by AC, 404 a property test; orchestrator-approved 2026-10-01. RT004: exclude generated fixtures (*.jsonl) from the total.

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Goldens live in `tools/golden/fixtures/` (the path testing.md/event-log.md name since T007/R012; the AC's `tests/golden` predates that move). Reference fights are built from content via run state in `tools/golden/reference.ts` (newRun, pickPrompt, combatInput); the src/sim stub producer (`src/sim/golden/stub-fight.ts`) and its fixture are removed.
- 2026-10-01: Sim property arbitraries use the sim builders, not content data: tests/arch.test.ts forbids src/sim files (tests included) from importing content data. testing.md updated to say so. Grow/split/armor traits are not generated (not in the sim yet, E007); invariant 4 must accept `grow` when it lands.
- 2026-10-01: Goldens were generated from HEAD e018457, before T034 (trait/prompt/lesson effects in combat) merged. After merging, regenerate with `npm run golden:update` and review the fixtures diff (expected: log changes from harness traits, prompts and lessons).
- 2026-10-01: No determinism bug found; no src/sim runtime code changed.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: src/sim/resolve.prop.test.ts 'same input twice gives identical logs' (numRuns 200, serializeLog bytes + result equality) passes; npx vitest run src/sim/resolve.prop.test.ts (7 passed)
- 2026-10-01: AC2 verified: same file, invariants 2, 4 (log replay of Trust/Severity: damage -v, heal +v, spawn only), 5 and 8 at 200 runs each, plus checker self-tests; arbitrary sample of 400 fights gave 96 wins, 280 Trust losses, 24 timeouts
- 2026-10-01: AC3 verified: npx vitest run tools/golden (16 passed): 5 full JSONL fixtures + summary.jsonl with inputHash/logHash (SHA-256); tampering line 10 of purist-typos.jsonl failed with '@@ line 10 / - ... / + ...' and the golden:update hint; in-suite test asserts the same on a changed log
- 2026-10-01: AC4 verified: npm run test:coverage exit 0 (667 passed); src/sim lines 690/692 = 99.71%, branches 98.50%
- 2026-10-01: npm run check: all steps passed
- 2026-10-01: review requested
- 2026-10-01: orchestrator: goldens regenerated with npm run golden:update after T034 merge (traits/prompts/lessons change purist/ide logs)
- 2026-10-01: done (R066)
