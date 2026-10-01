---
id: T008
epic: E001
title: Per-area coverage gates in Vitest
summary: "Vitest v8 coverage with per-area thresholds from the testing strategy (sim 95/90, run 90/85, save 90/85, content 90, ui logic 70) and a test:coverage script."
keywords: ["coverage", "vitest", "thresholds", "quality-gate", "testing"]
type: task
status: in-progress
priority: p1
model: sonnet
size: S
depends_on: [T006]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T008: Per-area coverage gates in Vitest

## Goal

Make the coverage budgets enforceable from the first sim commit, so vertical-slice exit criterion 7 (src/sim line coverage ≥ 95%) is measured by a command rather than by hand.

## Context

- Epic: [E001](EPIC.md)
- [Testing strategy: Coverage budgets](../../../docs/architecture/testing.md#coverage-budgets-vitest-v8-coverage-enforced-in-ci)
- [Vertical slice: Exit criteria (criterion 7)](../../../docs/game/vertical-slice.md#exit-criteria)
- Code: `vitest.config.ts`, `package.json`, `.gitignore`
- Out of scope: CI pipeline files, e2e coverage, changing any threshold value from the testing doc.

## Acceptance Criteria

- [ ] `npm run test:coverage` runs Vitest with v8 coverage and exits 0 on the current tree
- [ ] `vitest.config.ts` declares per-glob thresholds exactly as in testing.md "Coverage budgets"
- [ ] A sim file with an untested branch makes `npm run test:coverage` exit non-zero (shown in the Log, then reverted)
- [ ] Coverage output directories are git-ignored

## Subtasks

- [ ] Add @vitest/coverage-v8
- [ ] Configure per-glob thresholds and the script
- [ ] Demonstrate the failure mode and revert

## Notes

- Orchestrator 2026-10-01: coverage thresholds must be read from harness.config.json (coverage_sim_lines, coverage_sim_branches, coverage_total_lines); config is the single source of truth, docs only reference the ids.

- 2026-10-01: budgets-table.md lists coverage_sim_lines 90 / branches 85 while testing.md and vertical-slice.md say 95 / 90; implement testing.md and report the mismatch.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
