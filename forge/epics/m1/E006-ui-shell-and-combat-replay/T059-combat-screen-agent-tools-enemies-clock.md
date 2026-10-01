---
id: T059
epic: E006
title: "Combat screen: agent, tools, enemies, clock"
summary: "Combat screen with agent card, tool row with cooldown bars and next values, enemy line with intent chips and countdowns, Deadline clock, speed controls and the result strip."
keywords: ["combat-view", "ui", "tools", "enemies", "intents", "clock"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T058, T056]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T059: Combat screen: agent, tools, enemies, clock

## Goal

A fight is readable at a glance: who fires next, what each enemy will do and when, and how close the Deadline is.

## Context

- Epic: [E006](EPIC.md)
- [Screens: Combat screen](../../../../docs/game/ux/screens.md#combat-screen)
- [UI: Performance budgets](../../../../docs/architecture/ui.md#performance-budgets)
- [Combat: Readability rules](../../../../docs/game/systems/combat.md#readability-rules)
- Code: `src/ui/combat/`
- Out of scope: Context bar, log and tooltips (other E006 tasks), juice (E011), final portraits (E011).

## Acceptance Criteria

- [ ] Playwright: a replayed fight shows the agent card (Trust, Guardrails, status chips), tool cards in slot order (version, cooldown bar, next value, output) and enemy cards with intent chip and countdown
- [ ] The clock shows mm:ss.mmm, turns amber 10 s before deadlineMs and red after it
- [ ] Pause, 1x, 2x, 4x and skip work and the speed persists between fights
- [ ] After fightEnd a result strip shows time, Trust delta and compactions, and Continue dispatches continue
- [ ] Bars use transform: scaleX and each unit writes at most one signal per frame

## Subtasks

- [ ] Agent card
- [ ] Tool row
- [ ] Enemy line
- [ ] Clock and controls
- [ ] Result strip

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
