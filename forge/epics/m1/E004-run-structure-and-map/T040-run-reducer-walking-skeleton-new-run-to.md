---
id: T040
epic: E004
title: "Run reducer walking skeleton: new run to map"
summary: "RunState, the Action union, newRun, apply with typed errors, legalActions and replay for the setup, promptPick and map modes, with a stub map."
keywords: ["run", "reducer", "actions", "run-state", "replay", "walking-skeleton"]
type: task
status: done
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
- [Run state: Reducer, RunState, Modes, Actions](../../../../docs/architecture/run-state.md)
- [ADR-005 save as action log](../../../../docs/architecture/adr/adr-005-save-action-log.md)
- [Overview: hard rule 2 (run is pure)](../../../../docs/architecture/overview.md#dependency-rules)
- Code: `src/run/state.ts`, `src/run/actions.ts`, `src/run/apply.ts`, `src/run/replay.ts`
- Out of scope: Map generation, fights, rewards, shop, events, meta and saves (later tasks).

## Acceptance Criteria

- [x] Test `new run picks a prompt and reaches map`: pickPrompt lands in mode map with 10 credits and the harness starters equipped
- [x] An illegal action returns ok:false with a typed error and leaves state unchanged (test)
- [x] Property test: every action from legalActions is accepted by apply, over 100 random seeds
- [x] Test: replay(seed, actions) deep-equals the incrementally built state
- [x] RunState survives a JSON round trip unchanged (no Map, Set or undefined)

## Subtasks

- [x] State and action types
- [x] newRun with MetaView stub
- [x] apply and errors
- [x] legalActions and replay

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- Decision: `replay(setup, actions)` takes the `SetupSnapshot` (which holds the seed) instead of a bare seed, because harness, unlocks and lessons are needed to rebuild the start state (ADR-005 saves store `setup`). Returns an `ApplyResult` so a rejected log entry surfaces. run-state.md still says `replay(seed, actions)`; doc fix is outside this task's paths.
- Decision: the Action union and RunState contain only what the setup/promptPick/map skeleton uses (`pickPrompt`, `travel`; no `combat`, `nextFight`, `result`); later E004/E008 tasks add theirs. The prompt offer is the first 3 unlocked prompts in content order (no new fork path). The stub map (`src/run/map-stub.ts`, fork `map/1`, one node per row plus `p1-boss`) is for T041 to replace.
- Production lines: ~305 raw lines (state.ts is mostly types), under task_diff_lines 400.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/run, test 'new run picks a prompt and reaches map' (mode map, 10 credits, terminal_purist starter tools/skills)
- 2026-10-01: AC2 verified: apply.test.ts 'ok false, typed error, state unchanged' (5 cases: notOffered, wrongMode x2, notReachable, unknownAction; structuredClone compare)
- 2026-10-01: AC3 verified: property test 'every action from legalActions is accepted by apply (100 seeds)' (fast-check numRuns 100, checked at every visited state)
- 2026-10-01: AC4 verified: property test 'replay(seed, actions) deep-equals the incrementally built state' (100 runs)
- 2026-10-01: AC5 verified: property test 'RunState survives a JSON round trip unchanged' (toStrictEqual, 100 runs)
- 2026-10-01: npm run check green (tsc, biome, vitest, harness:check); src/run coverage 100% lines, 96.7% branches
- 2026-10-01: review requested
- 2026-10-01: done (R034)
