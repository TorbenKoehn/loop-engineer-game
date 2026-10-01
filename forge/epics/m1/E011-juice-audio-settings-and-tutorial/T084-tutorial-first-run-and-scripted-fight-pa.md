---
id: T084
epic: E011
title: Tutorial first run and tutorial map row
summary: "First-run flow: intro card, recommended harness, prompt tip and a run started with the tutorial row 1, with tutorial state in the meta save and a reset row in Settings."
keywords: ["tutorial", "onboarding", "first-run", "meta-save", "settings"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T064, T116]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T084: Tutorial first run and tutorial map row

## Goal

A new player is led into a first run whose first fight is the tutorial, which M1 exit
criterion 3 tests with people. The scripted pauses inside that fight are T117.

## Context

- Epic: [E011](EPIC.md); [Onboarding: First-run flow](../../../../docs/game/ux/onboarding.md#first-run-flow)
- `src/ui/screens/title.tsx`, `src/ui/screens/harness-select.tsx`, `src/ui/screens/prompt-pick.tsx` (paths after T105)
- `src/run/map/generate.ts` (the `tutorial` flag already makes row 1 a single p1e1 node), `src/ui/settings/` (T116)
- New files in `src/ui/tutorial/`
- Out of scope: scripted pauses (T117); first-time tips and progressive disclosure beyond the formula toggle (E020).

## Acceptance Criteria

- [ ] UI test passes: on the first run, New run shows the three-line intro card before harness select
- [ ] UI test passes: on the first run the prompt pick shows "Prompts cost context. Smaller is leaner." and the run starts with `tutorial: true`
- [ ] Playwright passes: a first run reaches a map whose row 1 is a single Tutorial node, and a second run has no intro card and a normal row 1
- [ ] UI test passes: Settings shows Tutorial tips reset, and after it the next New run shows the intro card again

## Subtasks

- [ ] First-run detection from the meta save
- [ ] Intro card and prompt tip
- [ ] Tutorial flag into startRun
- [ ] Reset row in Settings

## Notes

- 2026-10-01 (RT005 re-size): narrowed to the first-run flow (~150 production lines, 6+ files); scripted pauses, Continue/Skip and the determinism test moved to T117.
- 2026-10-01: Meets the Definition of Ready; promote when all depends_on are done.

## Log

- 2026-10-01: created
