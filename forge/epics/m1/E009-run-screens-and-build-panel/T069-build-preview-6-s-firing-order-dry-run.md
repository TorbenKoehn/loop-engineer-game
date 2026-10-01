---
id: T069
epic: E009
title: "Sim preview: 6 s firing order dry run"
summary: "A pure sim function previewFiring(input, ms) that dry-runs a loadout with no enemies and returns the firing order, documented in sim-core.md and fast enough to run after every build action."
keywords: ["preview", "sim", "dry-run", "firing-order", "previewFiring"]
type: task
status: in-progress
priority: p2
model: opus
size: S
depends_on: [T033]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T069: Sim preview: 6 s firing order dry run

## Goal

Players see the effect of tool order before the fight, which makes pipes and cooldowns
learnable. This task adds the sim side: a pure, fast dry run that the build panel (T112)
shows after every change.

## Context

- Epic: [E009](EPIC.md); [Loadout: Build phase (preview)](../../../../docs/game/systems/harness-loadout.md#build-phase)
- [Simulation core: API](../../../../docs/architecture/sim-core.md#api)
- `src/run/build/selectors.ts` (`loadoutInput` builds the `CombatInput`; path after T105)
- New file in a subfolder of `src/sim/` (e.g. `src/sim/preview/`; `src/sim` is at the `dir_files` warn_at)
- Out of scope: UI rendering (T112); enemy-aware previews; lookahead bots.

## Acceptance Criteria

- [ ] Sim unit test passes: `previewFiring(input, 6000)` returns the firing order for 6 s with no enemies and no early win
- [ ] Unit test passes: the same input gives the same order twice, and the input is not mutated
- [ ] Benchmark unit test passes: a 6-tool preview computes in under 5 ms
- [ ] `docs/architecture/sim-core.md` section API documents `previewFiring` (harness lint shows no `related_code` drift)

## Subtasks

- [ ] Sim preview API
- [ ] Tests and benchmark
- [ ] Doc update

## Notes

- 2026-10-01: sim-core.md defines no preview API yet; this task adds it and updates the doc.
- 2026-10-01 (RT005 re-size): narrowed to the sim API (~100 production lines); panel rendering moved to T112. No longer waits for T068.
- 2026-10-01: Meets the Definition of Ready; all depends_on done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
