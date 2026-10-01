---
id: T078
epic: E010
title: Playwright full-run smoke and save round trip
summary: "Scripted Phase-1 run through the UI at skip speed with fx off finishing under 60 s, plus export-at-shop, reload, import and continue matching the uninterrupted summary."
keywords: ["playwright", "e2e", "smoke", "save", "exit-criteria"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T065, T066, T067, T068, T070, T053, T057]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T078: Playwright full-run smoke and save round trip

## Goal

Prove M1 exit criterion 8 and the save round trip end to end through the real UI.

## Context

- Epic: [E010](EPIC.md)
- [Testing: Playwright](../../../docs/architecture/testing.md#playwright)
- [Vertical slice: Exit criterion 8](../../../docs/game/vertical-slice.md#exit-criteria)
- [UI: Test hooks, URL flags](../../../docs/architecture/ui.md#test-hooks-windowgame-dev-and-e2e-builds-only)
- Code: `tests/e2e/`
- Out of scope: Visual, accessibility and keyboard-only suites (E020, E022).

## Acceptance Criteria

- [ ] A scripted Phase-1 run via clicks and keys with ?fx=off&speed=skip and a fixed seed reaches the run-end screen in under 60 s
- [ ] Exporting at a shop, reloading, importing and continuing ends with the same summary as an uninterrupted run
- [ ] The specs assert on roles and text, not screenshots, and run via `npm run e2e`

## Subtasks

- [ ] Scripted policy via legal()
- [ ] Full-run spec
- [ ] Round-trip spec

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
