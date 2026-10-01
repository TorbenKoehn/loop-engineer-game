---
id: E024
title: Harness upkeep 2
summary: "Retro follow-ups from RT003 on: code folders under their dir_files budget, and companion docs flagged by tooling instead of piling up as review follow-ups."
keywords: ["epic", "harness", "upkeep", "dir-files", "doc-drift", "retro"]
type: epic
status: backlog
priority: p1
milestone: m0
updated: 2026-10-01
related: ["../../../retros/RT003-third-retro-e003-e004-e006-run-and-ui-ba.md", "../../../retros/RT004-fourth-retro-e007-e008-e009-sim-save-and.md", "../E023-harness-upkeep/EPIC.md"]
---

# E024: Harness upkeep 2

## Goal

Continues E023 (full at `tasks_per_epic`) with retro follow-ups. After this epic,
feature tasks no longer hit `dir_files` errors in `src/run` and `src/sim/combat`, and a
staged diff names the docs whose `related_code` it touches, so doc drift is caught
before review. Sources: RT003 proposals P1 and P2.

## Scope

- Regroup `src/run` and `src/sim/combat` into topic subfolders, without behaviour change.
- `harness:diff` (T095) lists companion docs for the staged diff.
- Later retro proposals (RT004 on) while this epic has room.

## Out of Scope

- Changing budget values in `harness.config.json`.
- Feature work in `src/`, other than the folder moves above.

## Definition of Done

- [ ] `npm run harness:lint` shows no `dir_files` warning for `src/run` or `src/sim/combat`
- [ ] `npm run harness:diff` prints the companion docs of a staged diff (vitest case)
- [ ] `npm run check` exits 0

Proposals from RT003 (P1, P2) and RT004 (P1-P4, incl. the e2e gate and the done-task
AC lint the orchestrator raised) are listed in each retro's Actions.
