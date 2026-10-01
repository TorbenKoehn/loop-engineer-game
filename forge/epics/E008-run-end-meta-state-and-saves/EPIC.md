---
id: E008
title: Run end, meta state and saves
summary: "Run end (slice win, ^C, abandon) and run stats, meta state with history, AGENTS.md (1 lesson) and the brute_force unlock, versioned saves, export string, migrations, autosave, desync checks (M1)."
keywords: ["save", "meta", "run-end", "agents-md", "migrations", "autosave", "m1"]
type: epic
status: backlog
priority: p1
updated: 2026-10-01
related: ["../../../docs/architecture/save.md", "../../../docs/architecture/run-state.md", "../../../docs/game/systems/meta-progression.md", "../../../docs/game/vertical-slice.md", "../../../docs/architecture/adr/adr-005-save-action-log.md"]
---

# E008: Run end, meta state and saves

## Goal

M1 vertical slice. After this epic a run ends correctly, its result feeds a persistent meta save (history, one AGENTS.md lesson, one unlock), and the player can close the tab at any node, reload and continue with an identical result (exit criterion 6).

## Scope

- Run end modes, M1 deviation (Legacy Monolith win ends the run), RunStats for the summary
- Meta state: history (last 100), lesson offer and capacity 1, `brute_force` unlock ([meta](../../../docs/game/systems/meta-progression.md))
- RunSaveV1/MetaSaveV1, checksum, storage adapter and keys ([save system](../../../docs/architecture/save.md))
- Export/import string `LE1.`, migration framework with frozen fixtures
- Autosave timing, Continue, corrupt-save recovery, desync detection, replay-vs-snapshot test

## Out of Scope

- Training Data, unlock tree, AGENTS.md with 3 lines (E015)
- Run-end and AGENTS.md screens (E009)
- History screen, achievements, lifetime stats (E017)

## Definition of Done

- [ ] All E008 tasks done with approved reviews
- [ ] Replay-vs-snapshot test on 50 bot runs passes (vertical-slice exit criterion 6)
- [ ] decode(encode(save)) round trip and checksum rejection tests pass
- [ ] src/save line coverage ≥ 90%, branches ≥ 85%
