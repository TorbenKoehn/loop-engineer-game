---
id: T006
epic: E001
title: Unified check script (tsc, biome, vitest, harness)
summary: "Add one npm run check that chains tsc, Biome, Vitest and harness:check, fails fast with clear step labels, and is the single gate agents run before review."
keywords: ["check", "tsc", "biome", "vitest", "harness", "gate"]
type: task
status: ready
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

- [ ] `npm run check` runs typecheck, lint, test and harness:check in that order
- [ ] The first failing step stops the run with a nonzero exit and a labelled message
- [ ] The existing harness:* scripts keep working unchanged
- [ ] A clean tree passes the full check

## Subtasks

- [ ] Add the check script (plain shell chaining or a small node script)
- [ ] Label each step in the output
- [ ] Handle steps whose tool is not yet installed with a clear message
- [ ] Add a typecheck script if T001 did not
- [ ] Run the check on the scaffold and fix findings

## Notes

## Log

- 2026-10-01: created
