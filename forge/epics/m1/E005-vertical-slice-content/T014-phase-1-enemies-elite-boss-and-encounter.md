---
id: T014
epic: E005
title: Phase-1 enemies, elite, boss and encounter pools
summary: "Phase-1 enemies, Yak Shave elite with its tasks and Side Quest, Legacy Monolith with stages and add, and encounters p1e1-p1e5, p1h1-p1h5, p1x1, p1b as data."
keywords: ["content", "enemies", "phase-1", "boss", "encounters", "elite"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T010]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T014: Phase-1 enemies, elite, boss and encounter pools

## Goal

Provide every slice enemy and encounter as data with exact stat blocks, intents and traits, so maps can pick encounters and the sim can fight them.

## Context

- Epic: [E005](EPIC.md)
- [Phase 1: Enemies, Elites (Yak Shave), Boss, Encounter pools](../../../../docs/game/content/phase-1-implement.md)
- [Statuses: Enemy traits, Enemy action verbs](../../../../docs/game/systems/statuses.md#enemy-traits)
- [Combat: Deadline table](../../../../docs/game/systems/combat.md#deadline-and-fight-end)
- Code: `src/content/enemies/`, `src/content/encounters/`, `src/content/strings/en.ts`
- Out of scope: Trait and handler behaviour (E007); final ASCII portraits (E011, one-line placeholder art is fine); Copy-Paste Clone and p1x2 (E012).

## Acceptance Criteria

- [ ] Test `phase-1 enemies match the GDD` asserts family, Severity, traits and intent cycles (verbs, values, windupMs) of all seven phase-1 enemies
- [ ] Yak Shave, its three tasks and Side Quest, and Legacy Monolith with stages A/B/C and Undocumented Behavior are defined; their handler ids are listed in Notes
- [ ] Encounters p1e1-p1e5, p1h1-p1h5, p1x1 and p1b list enemies front to back as in the pools table, with deadlineMs 45000 / 50000 / 75000 by pool
- [ ] Copy-Paste Clone and p1x2 are absent

## Subtasks

- [ ] Enemy defs
- [ ] Elite and boss defs
- [ ] Encounter pools
- [ ] Strings incl. intent names

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
