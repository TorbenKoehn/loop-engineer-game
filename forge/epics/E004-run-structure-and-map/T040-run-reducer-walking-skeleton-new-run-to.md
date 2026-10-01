---
id: T040
epic: E004
title: "Run reducer walking skeleton: new run to map"
summary: "RunState, the Action union, newRun, apply with typed errors, legalActions and replay for the setup, promptPick and map modes, with a stub map."
keywords: ["run", "reducer", "actions", "run-state", "replay", "walking-skeleton"]
type: task
status: backlog
priority: p0
model: opus
size: M
depends_on: [T003, T009, T011]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T040: Run reducer walking skeleton: new run to map

## Goal

Establish the one dispatch path every consumer shares: a run is a fold of serialisable actions over serialisable state, testable without a browser.

## Context

- Epic: [E004](EPIC.md)
- [Run state: Reducer, RunState, Modes, Actions](../../../docs/architecture/run-state.md)
- [ADR-005 save as action log](../../../docs/architecture/adr/adr-005-save-action-log.md)
- [Overview: hard rule 2 (run is pure)](../../../docs/architecture/overview.md#dependency-rules)
- Code: `src/run/state.ts`, `src/run/actions.ts`, `src/run/apply.ts`, `src/run/replay.ts`
- Out of scope: Map generation, fights, rewards, shop, events, meta and saves (later tasks).

## Acceptance Criteria

- [ ] Test `new run picks a prompt and reaches map`: pickPrompt lands in mode map with 10 credits and the harness starters equipped
- [ ] An illegal action returns ok:false with a typed error and leaves state unchanged (test)
- [ ] Property test: every action from legalActions is accepted by apply, over 100 random seeds
- [ ] Test: replay(seed, actions) deep-equals the incrementally built state
- [ ] RunState survives a JSON round trip unchanged (no Map, Set or undefined)

## Subtasks

- [ ] State and action types
- [ ] newRun with MetaView stub
- [ ] apply and errors
- [ ] legalActions and replay

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
