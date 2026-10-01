---
id: T071
epic: E010
title: Random and greedy bots
summary: "Pure seeded bots for tools/balance: random (uniform over legal actions) and greedy (documented heuristic, interest-aware), playing full Phase-1 runs headless."
keywords: ["bots", "balance", "greedy", "random", "headless"]
type: task
status: in-progress
priority: p1
model: opus
size: M
depends_on: [T044, T046, T047, T048]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T071: Random and greedy bots

## Goal

Bots play thousands of runs so balance and regressions are measured, not guessed.

## Context

- Epic: [E010](EPIC.md)
- [Testing: Balance sim (Bots)](../../../../docs/architecture/testing.md#balance-sim-toolsbalance)
- [Run state: Reducer (legalActions)](../../../../docs/architecture/run-state.md#reducer)
- [Economy: Economy targets](../../../../docs/game/systems/economy.md#economy-targets-balance-sim-checks)
- Code: `tools/balance/bots/`
- Out of scope: Expert bot (E022), CLI and reports (next task).

## Acceptance Criteria

- [ ] Bots are pure (state, legal) → Action functions seeded by the run seed; the same seed gives the same run (test)
- [ ] The random bot completes 200 runs without a throw, each ending in runEnd
- [ ] The greedy bot follows the testing.md heuristic and reaches the boss in at least half of 200 runs (sanity check, not a target)

## Subtasks

- [ ] Bot interface
- [ ] Random bot
- [ ] Greedy scoring
- [ ] Run driver

## Notes

- 2026-10-01: tools/ runs natively on Node 24 (erasable syntax, `.ts` import extensions); confirm src/ follows the same import style (T001) or add a runner, and record the choice.
- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: maxTurns hit, resumed
