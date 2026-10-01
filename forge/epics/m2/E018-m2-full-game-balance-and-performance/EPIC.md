---
id: E018
title: M2 Full-game balance and performance
summary: "M2 backlog: balance CLI over all phases and harnesses, M2 targets in CI, full-run win-rate tuning, and sim speed of at least 200 full runs per second per core."
keywords: ["m2", "balance", "performance", "bots", "targets", "tuning"]
type: epic
status: backlog
priority: p2
milestone: m2
updated: 2026-10-01
related: ["../../../../docs/game/milestones.md", "../../../../docs/architecture/testing.md", "../../../../docs/architecture/sim-core.md"]
---

# E018: M2 Full-game balance and performance

## Goal

Milestone M2 (backlog, not yet planned into tasks). After this epic the complete three-phase game meets its balance and simulation-speed exit criteria, measured in CI.

## Scope

- Balance targets for all phases and harnesses ([testing](../../../../docs/architecture/testing.md))
- Full-run tuning for Terminal Purist and IDE Companion; GDD numbers updated with the sim
- Sim throughput ≥ 200 full runs per second per core

## Out of Scope

- Lint-level difficulty curve and human playtests (E022)

## Definition of Done

- [ ] M2 exit criteria 1 (35–65% for the two starters) and 8 (≥ 200 runs/s/core)
