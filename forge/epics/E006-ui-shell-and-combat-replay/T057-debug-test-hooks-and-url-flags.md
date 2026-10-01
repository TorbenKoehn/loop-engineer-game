---
id: T057
epic: E006
title: Debug test hooks and URL flags
summary: "window.__game hooks (state, dispatch, legal, seed, newRun, playback) in dev and e2e builds only, and the URL flags seed, harness, fx, speed and tutorial."
keywords: ["debug", "test-hooks", "playwright", "url-flags", "e2e"]
type: task
status: backlog
priority: p1
model: sonnet
size: S
depends_on: [T055]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T057: Debug test hooks and URL flags

## Goal

Let Playwright and developers drive deterministic runs without clicking through every screen.

## Context

- Epic: [E006](EPIC.md)
- [UI: Test hooks](../../../docs/architecture/ui.md#test-hooks-windowgame-dev-and-e2e-builds-only)
- [Overview: src/debug](../../../docs/architecture/overview.md#module-map)
- Code: `src/debug/hooks.ts`, `src/ui/app.tsx`
- Out of scope: exportSave/importSave hooks (E008 autosave task), locale flag (E017).

## Acceptance Criteria

- [ ] In dev and e2e builds window.__game exposes state, dispatch, legal, seed, newRun and playback; the production bundle contains no `__game` (build grep)
- [ ] Playwright starts a run with ?seed=K7Q2-M9XA&harness=terminal_purist and reads the seed from __game.state()
- [ ] fx, speed and tutorial flags are applied to settings for the session

## Subtasks

- [ ] Hook module
- [ ] Build-time gating
- [ ] URL flag parsing

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
