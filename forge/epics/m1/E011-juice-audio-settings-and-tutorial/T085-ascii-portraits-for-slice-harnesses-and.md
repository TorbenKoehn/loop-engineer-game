---
id: T085
epic: E011
title: ASCII portraits for slice harnesses and enemies
summary: "ASCII portraits as content data for both M1 harnesses and every slice enemy, add, elite and the boss, within the art-direction size and character limits."
keywords: ["ascii-art", "portraits", "content", "art", "enemies"]
type: task
status: backlog
priority: p2
model: sonnet
size: S
depends_on: [T014, T101]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T085: ASCII portraits for slice harnesses and enemies

## Goal

Every slice unit has a recognisable portrait in the house style.

## Context

- Epic: [E011](EPIC.md)
- [Art direction: ASCII art](../../../../docs/game/ux/art-direction.md#ascii-art)
- [Phase 1: enemy list](../../../../docs/game/content/phase-1-implement.md)
- Code: `src/content/enemies/`, `src/content/harnesses.ts`
- Out of scope: Logo, title art, glyph sets (E021).

## Acceptance Criteria

- [ ] Both M1 harnesses and all slice enemies, adds, elites and the boss have portraits within the documented line, column and character limits (validation test)
- [ ] Portraits render on harness cards and combat cards with aria labels
- [ ] Content validation fails for an enemy with empty art

## Subtasks

- [ ] Agent portraits
- [ ] Enemy portraits
- [ ] Validation rule

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
