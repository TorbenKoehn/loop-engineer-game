---
id: T053
epic: E008
title: Autosave, continue and corrupt-save recovery
summary: "Store autosave after node completion and on pagehide, Continue from the title, backup fallback and le:corrupt keys on failure, memory-only banner, and exportSave/importSave hooks."
keywords: ["autosave", "continue", "corruption", "store", "save"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T051, T063]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T053: Autosave, continue and corrupt-save recovery

## Goal

The player can close the tab at any node and continue exactly where they were, and broken saves never lose progress silently.

## Context

- Epic: [E008](EPIC.md)
- [Save system: Storage (autosave), Corruption handling](../../../../docs/architecture/save.md#storage)
- [UI: Store, Test hooks](../../../../docs/architecture/ui.md#store-signals)
- Code: `src/ui/store/`, `src/save/`, `src/debug/hooks.ts`
- Out of scope: Desync detection (next task), history screen (E017).

## Acceptance Criteria

- [ ] The store autosaves when mode returns to map, phaseEnd or runEnd and on pagehide, never during playback (test with fake storage)
- [ ] The title shows Continue when a run save exists; continuing restores the snapshot (Playwright)
- [ ] On checksum failure the backup loads; if both fail the data is kept under le:corrupt:<timestamp> (max 3) and the export string is shown (tests)
- [ ] A banner shows when saves are memory-only
- [ ] window.__game exposes exportSave and importSave in dev and e2e builds

## Subtasks

- [ ] Autosave scheduling
- [ ] Continue flow
- [ ] Recovery
- [ ] Banner and hooks

## Notes

- Orchestrator 2026-10-01 (R051 F1): wire src/ui/store/meta.ts to build its view with `metaView(meta)` so UI runs get run numbers and history dedup; also add `lastRun` to the MetaState comment in docs/architecture/save.md (R051 F4).

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
