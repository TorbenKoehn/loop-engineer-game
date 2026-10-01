---
id: T002
epic: E001
title: Configure Biome with code budgets
summary: "Add Biome 2.5 config for lint and format that mirrors the harness code budgets and keeps src/sim free of nondeterministic APIs."
keywords: ["biome", "lint", "format", "budgets", "determinism"]
type: task
status: ready
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

- [ ] `npm run lint` runs Biome and passes on the scaffold
- [ ] A Math.random call in src/sim fails lint (shown by a fixture or test)
- [ ] `npm run format` leaves a clean tree unchanged
- [ ] biome.json documents each budget it enforces

## Subtasks

- [ ] Add @biomejs/biome and lint, format scripts
- [ ] Write biome.json with formatter, recommended rules and overrides
- [ ] Add restricted-globals/imports rules for src/sim
- [ ] Add complexity or length rules where Biome supports them
- [ ] Add a negative fixture or test proving the sim ban works and document unenforceable budgets as handled by the harness

## Notes

## Log

- 2026-10-01: created
