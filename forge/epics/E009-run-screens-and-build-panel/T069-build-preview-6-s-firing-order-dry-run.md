---
id: T069
epic: E009
title: "Build preview: 6 s firing order dry run"
summary: "A pure sim preview function running a 6 s dry run with no enemies, documented in sim-core.md, and the build panel showing the predicted firing order after every change."
keywords: ["preview", "build-panel", "sim", "dry-run", "firing-order"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T068, T033]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T069: Build preview: 6 s firing order dry run

## Goal

Players see the effect of tool order before the fight, which makes pipes and cooldowns learnable.

## Context

- Epic: [E009](EPIC.md)
- [Loadout: Build phase (preview)](../../../docs/game/systems/harness-loadout.md#build-phase)
- [Simulation core: API](../../../docs/architecture/sim-core.md#api)
- Code: `src/sim/preview.ts`, `src/ui/build/preview.tsx`
- Out of scope: Enemy-aware previews, lookahead bots.

## Acceptance Criteria

- [ ] previewFiring(input, 6000) returns the firing order for 6 s with no enemies and no early win (sim unit test), and sim-core.md documents it
- [ ] The build panel shows the next 6 s firing order and updates after each build action
- [ ] A 6-tool preview computes in under 5 ms (benchmark in a unit test)

## Subtasks

- [ ] Sim preview API
- [ ] Doc update
- [ ] Panel rendering

## Notes

- 2026-10-01: sim-core.md defines no preview API yet; this task adds it and updates the doc.
- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
