---
id: T055
epic: E006
title: UI store, shell layout and i18n walking skeleton
summary: "Signals store with dispatch over the run reducer, App switching on mode inside the IDE shell (top bar, explorer, editor, terminal, status bar) and t() i18n."
keywords: ["ui", "store", "signals", "shell", "i18n", "walking-skeleton"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T001, T005, T040, T010]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T055: UI store, shell layout and i18n walking skeleton

## Goal

Prove the browser path end to end: a run state lives in signals, actions go through the same apply as tests and bots, and the shell renders text only through t().

## Context

- Epic: [E006](EPIC.md)
- [UI: Store, Screens, i18n](../../../docs/architecture/ui.md#store-signals)
- [Screens: Shell layout](../../../docs/game/ux/screens.md#shell-layout)
- [Localisation: Rules 1-5](../../../docs/game/ux/localisation.md#rules)
- Code: `src/ui/app.tsx`, `src/ui/store/`, `src/ui/i18n.ts`, `src/ui/shell/`
- Out of scope: Theme styling, test hooks, every screen except a placeholder per mode, combat view.

## Acceptance Criteria

- [ ] Playwright: starting a run with a fixed seed shows the shell and a status bar with Trust, credits, ctx and P1 from RunState
- [ ] dispatch applies actions via apply; a rejected action sets lastError and leaves run unchanged (UI unit test)
- [ ] t(key, params) reads en.ts with named placeholders; a missing key renders the key and fails a dev assertion (test)
- [ ] A lint test fails on JSX text nodes with letters outside t() (localisation rule 1)

## Subtasks

- [ ] Store modules run, meta, playback, ui
- [ ] App mode switch
- [ ] Shell regions
- [ ] t() and formatClock

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
