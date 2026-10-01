---
id: T062
epic: E006
title: Tooltips with plain-English lines and formula
summary: "Tooltips for items, enemies, statuses, traits and zones with name, generated line, stats and the damage formula with current numbers, on hover and keyboard focus."
keywords: ["tooltips", "ui", "formula", "plain-english", "accessibility"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T059, T010, T045]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T062: Tooltips with plain-English lines and formula

## Goal

Every effect is explained in plain English with its formula, so players learn the rules from the game itself.

## Context

- Epic: [E006](EPIC.md)
- [Screens: Tooltips](../../../../docs/game/ux/screens.md#tooltips-and-the-combat-log)
- [Content model: Generated text](../../../../docs/architecture/content-model.md#generated-text)
- [Onboarding: Progressive disclosure (Details)](../../../../docs/game/ux/onboarding.md#progressive-disclosure)
- Code: `src/ui/components/tooltip/`
- Out of scope: Codex (E017), screen-reader verbose mode (E020).

## Acceptance Criteria

- [ ] Tools, skills, memories, enemies, statuses, traits and zones show name, plain-English line, stats and the formula with current numbers (e.g. `6 base +3 flat x(100+20+30)% = 14`)
- [ ] Tooltips open after 250 ms hover and on keyboard focus, and close on Esc
- [ ] On the first run the formula is collapsed under Details
- [ ] Tooltip text comes only from generated templates and string keys (test)

## Subtasks

- [ ] Tooltip component
- [ ] Content describers
- [ ] Formula renderer

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
