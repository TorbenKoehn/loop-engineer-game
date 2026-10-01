---
id: E015
title: M2 Meta progression and unlock tree
summary: "M2 backlog: Training Data receipt, the sidegrade unlock tree, AGENTS.md with 3 lines and all 10 lessons, harness unlock conditions, and M1 save migration."
keywords: ["m2", "meta-progression", "training-data", "unlocks", "agents-md", "migration"]
type: epic
status: backlog
priority: p2
milestone: m2
updated: 2026-10-01
related: ["../../../../docs/game/milestones.md", "../../../../docs/game/systems/meta-progression.md", "../../../../docs/game/content/memories-lessons.md", "../../../../docs/architecture/save.md"]
---

# E015: M2 Meta progression and unlock tree

## Goal

Milestone M2 (backlog, not yet planned into tasks). After this epic runs earn Training Data that buys sidegrade unlocks, AGENTS.md holds 3 lessons, and saves from M1 still load.

## Scope

- Training Data earning and receipt; unlock tree with costs and prerequisites ([meta](../../../../docs/game/systems/meta-progression.md))
- AGENTS.md capacity 3; harness unlock conditions; unlock screen
- Schema 2 migrations for run and meta saves ([save system](../../../../docs/architecture/save.md))

## Out of Scope

- Endless, lint rules and daily seed modes (E016)

## Definition of Done

- [ ] M2 exit criterion 7: M1 saves load via tested migration; replay equals snapshot on 200 bot runs
