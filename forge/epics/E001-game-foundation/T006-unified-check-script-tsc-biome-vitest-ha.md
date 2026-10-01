---
id: T006
epic: E001
title: Unified check script (tsc, biome, vitest, harness)
summary: "Add one npm run check that chains tsc, Biome, Vitest and harness:check, fails fast with clear step labels, and is the single gate agents run before review."
keywords: ["check", "tsc", "biome", "vitest", "harness", "gate"]
type: task
status: done
priority: p0
model: sonnet
size: S
depends_on: [T001]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T006: Unified check script (tsc, biome, vitest, harness)

## Goal

Provide a single entry point that runs every static and unit check in order. Agents and the reviewer use it as the definition of green.

## Context

- Epic: [E001](EPIC.md)
- Harness background: [harness-engineering.md](../../../docs/research/harness/harness-engineering.md)

## Acceptance Criteria

- [x] `npm run check` runs typecheck, lint, test and harness:check in that order
- [x] The first failing step stops the run with a nonzero exit and a labelled message
- [x] The existing harness:* scripts keep working unchanged
- [x] A clean tree passes the full check

## Subtasks

- [x] Add the check script (plain shell chaining or a small node script)
- [x] Label each step in the output
- [x] Handle steps whose tool is not yet installed with a clear message
- [x] Add a typecheck script if T001 did not
- [x] Run the check on the scaffold and fix findings

## Notes

- Biome step is skipped with a message until `@biomejs/biome` is installed (T002); it runs automatically afterwards.
- Follow-up: CLAUDE.md Commands section should mention `npm run check` as the single gate (not edited here, out of scope).

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: npm run check ran tsc, biome (skipped, not installed), vitest, harness:check in order (tools/check/run.ts)
- 2026-10-01: AC2 verified: injected type error in src/__failtest.ts -> "[check] FAILED at step 1/4: typecheck (tsc)", nonzero exit, later steps not run (file removed)
- 2026-10-01: AC3 verified: harness:* scripts untouched in package.json; harness:check green
- 2026-10-01: AC4 verified: clean tree npm run check exit 0 (38 tests passed, harness lint no findings)
- 2026-10-01: review requested
- 2026-10-01: done (R002)
