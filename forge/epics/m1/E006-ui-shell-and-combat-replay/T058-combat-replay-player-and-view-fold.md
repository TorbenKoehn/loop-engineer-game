---
id: T058
epic: E006
title: Combat replay player and view fold
summary: "Playback with an injectable clock, cursor, speeds 1x/2x/4x/skip and pause, a pure foldEvent view, 100-event checkpoints for seeking, and hit-stop holds."
keywords: ["replay", "playback", "clock", "view-fold", "seeking", "ui"]
type: task
status: done
priority: p1
model: opus
size: M
depends_on: [T055, T018]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T058: Combat replay player and view fold

## Goal

The UI never computes rules: it plays the recorded event log, so what the player sees always matches the sim.

## Context

- Epic: [E006](EPIC.md)
- [UI: Combat replay player](../../../../docs/architecture/ui.md#combat-replay-player)
- [Event log: kinds, Ordering](../../../../docs/architecture/event-log.md)
- [Overview: Data flow](../../../../docs/architecture/overview.md#data-flow)
- Code: `src/ui/combat/playback.ts`, `src/ui/combat/fold.ts`
- Out of scope: Rendering (next tasks), fx and audio subscribers (E011).

## Acceptance Criteria

- [x] With a manual clock, each frame advances simT by frameMs x speed and applies every event with t ≤ simT (tests at 1x, 2x, 4x)
- [x] skip folds to the end without emitting bus events (test)
- [x] After a full fold the view equals the fightEnd state (Trust, Severities) of a reference fight
- [x] Seeking restores the nearest checkpoint and folds forward to the same view as a straight fold (property over random indices)
- [x] paused stops advancing; a hit-stop request holds 60 ms except at skip

## Subtasks

- [x] Clock interface
- [x] foldEvent
- [x] Checkpoints and seek
- [x] Speed and pause

## Notes

- 2026-10-01: The sandbox view fold was promoted (git mv) to `src/ui/combat/fold.ts` with `SandboxView` renamed to `CombatView`; the sandbox imports it from there. The sandbox player (`src/ui/sandbox/player.ts`) still has its own clock: switching it to `createPlayback` costs about 100 production lines (diff budget) and changes its test semantics, so it is left with `TODO(T059)`; T059 replaces the sandbox anyway.
- 2026-10-01: Frame time is capped at `MAX_FRAME_MS` (100 ms) inside playback, as the sandbox did, so a background tab does not jump; hit-stop counts real ms and is consumed before simT advances. Seek and `finish()` never emit bus events; the store's `speed` signal can be passed in so speed persists between fights.
- 2026-10-01: Production diff 273 lines (checkpoints 37, playback 174, fold rename 37, sandbox/store imports 25); `src/ui/combat/testing/manual-clock.ts` is test support.

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: src/ui/combat/playback.test.ts 'at %ix advances simT by frameMs x speed' (1x, 2x, 4x; 40 frames of 16 ms, view == advanceTo(simT), next event t > simT)
- 2026-10-01: AC2 verified: playback.test.ts 'skip > folds to the end without emitting bus events' and 'finish() mid-fight folds the rest silently' (0 emitted, view == foldAll)
- 2026-10-01: AC3 verified: playback.test.ts 'Trust and Severities of a won / lost reference fight' (view Trust == fightEnd.d.trust, end == fightEnd, Severities == last damage/heal per enemy read from the log)
- 2026-10-01: AC4 verified: playback.test.ts 'seeking' (fast-check over random indices on the ~300-event p1b fight: seek view == straight fold, paused; plus random checkpoint spacing 1..150 and clamped indices)
- 2026-10-01: AC5 verified: playback.test.ts 'pause and hit-stop' (paused frames keep simT and view; hold() keeps simT for 60 ms then resumes; partial-frame hold; hold ignored at skip)
- 2026-10-01: checks: npm run check (tsc, biome, vitest 445 passed, harness 0 errors) and npm run e2e (3 passed) green
- 2026-10-01: review requested
- 2026-10-01: done (R045)
