---
id: T101
epic: E006
title: Combat screen route, dev-only sandbox and e2e
summary: "Second half of the split T059: the combat screen route in the real app, dev-only sandbox, result strip with Continue, and e2e through a real run fight."
keywords: ["task", "combat", "screen", "route", "only", "sandbox"]
type: task
status: backlog
priority: p1
model: opus
size: M
updated: 2026-10-01
related: ["EPIC.md"]
depends_on: [T100]
---

# T101: Combat screen route, dev-only sandbox and e2e

## Goal

Wire the combat view into the app: a CombatScreen for mode combatReview (loadFight from run.combat.input, createPlayback with the store speed, dispose), the sandbox rewritten on top of it and reachable only in dev builds, and e2e that plays a real fight from the title screen.

## Context

- Epic: [E006](EPIC.md)
- Split of T059 (cancelled): its Notes hold the full plan and orchestrator items
- docs/game/ux/screens.md, docs/architecture/ui.md, src/ui/combat/**, src/run/combat.ts

## Acceptance Criteria

- [ ] Playwright: a replayed fight shows the agent card (Trust, Guardrails, status chips), tool cards in slot order (version, cooldown bar, next value, output) and enemy cards with intent chip and countdown
- [ ] Pause, 1x, 2x, 4x and skip work, the speed persists between fights, and the status bar labels skip correctly
- [ ] After fightEnd a result strip shows time, Trust delta and compactions, and Continue dispatches continue
- [ ] `?sandbox` works only in dev builds; e2e drives New run -> pick -> travel -> fight -> Continue on the production build; bars use transform: scaleX
- [ ] The JSX-text lint exemption for src/ui/sandbox is removed and docs/architecture/ui.md is updated

## Subtasks

- [ ] CombatScreen + App mode
- [ ] Sandbox rewrite, dev-only guard
- [ ] e2e rewrite
- [ ] Lint exemption removal, CSS trim, ui.md

## Notes

## Log

- 2026-10-01: created
