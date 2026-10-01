---
id: T002
epic: E001
title: Configure Biome with code budgets
summary: "Add Biome 2.5 config for lint and format that mirrors the harness code budgets and keeps src/sim free of nondeterministic APIs."
keywords: ["biome", "lint", "format", "budgets", "determinism"]
type: task
status: done
priority: p0
model: sonnet
size: S
depends_on: [T001]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T002: Configure Biome with code budgets

## Goal

Configure Biome 2.5 so lint and format run on src, tools and tests. Encode the code budgets (file length, function length, comment limits) where Biome can, and ban Math.random and Date in src/sim.

## Context

- Epic: [E001](EPIC.md)
- Tech stack: [tech-stack.md](../../../docs/research/game/tech-stack.md) (lint/format and enforcement)
- Budgets: [budgets-code.md](../../../docs/research/budgets/budgets-code.md)

## Acceptance Criteria

- [x] `npm run lint` runs Biome and passes on the scaffold
- [x] A Math.random call in src/sim fails lint (shown by a fixture or test)
- [x] `npm run format` leaves a clean tree unchanged
- [x] biome.json documents each budget it enforces

## Subtasks

- [x] Add @biomejs/biome and lint, format scripts
- [x] Write biome.json with formatter, recommended rules and overrides
- [x] Add restricted-globals/imports rules for src/sim
- [x] Add complexity or length rules where Biome supports them
- [x] Add a negative fixture or test proving the sim ban works and document unenforceable budgets as handled by the harness

## Notes

- Config is biome.jsonc (comments document each budget). Biome 2.5.14 pinned (>= 7 days old).
- Not enforceable in Biome, listed in biome.jsonc: nesting_depth, exports_per_module,
  imports_per_module, duplication_pct, ts_expect_error count, eslint_disable count. A harness
  check could take them over (follow-up for the orchestrator). complexity maps to cognitive
  complexity (stricter than cyclomatic), same limit 10.
- Sim ban: GritQL plugin tools/biome/sim-determinism.grit (Math.random, Date.now, new Date,
  performance.now) plus noRestrictedGlobals; tested by tools/biome/sim-ban.test.ts.
- Existing tools/harness code was refactored (behaviour-preserving) to meet complexity,
  params and callback limits; util.check now takes at()/inDoc() locations.
- R002 F1 folded in: tools/check/run.ts fails when Biome is declared but not installed.
- 28 recommended-rule warnings remain (noNonNullAssertion); not errors.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: npm run lint (biome check .) exit 0; npm run check green with Biome step running
- 2026-10-01: AC2 verified: npx vitest run tools/biome (6 passed; Math.random/Date/timers fail in src/sim, pass elsewhere)
- 2026-10-01: AC3 verified: npx biome check . --write changes nothing on a clean tree; format script is biome format --write .
- 2026-10-01: AC4 verified: biome.jsonc comments name each enforced budget and list unenforceable ones
- 2026-10-01: review requested
- 2026-10-01: done (R005)
