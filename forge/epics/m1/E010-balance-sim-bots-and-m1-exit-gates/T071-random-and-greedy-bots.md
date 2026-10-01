---
id: T071
epic: E010
title: Random and greedy bots
summary: "Pure seeded bots for tools/balance: random (uniform over legal actions) and greedy (documented heuristic, interest-aware), playing full Phase-1 runs headless."
keywords: ["bots", "balance", "greedy", "random", "headless"]
type: task
status: done
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

- [x] Bots are pure (state, legal) → Action functions seeded by the run seed; the same seed gives the same run (test)
- [x] The random bot completes 200 runs without a throw, each ending in runEnd
- [x] The greedy bot follows the testing.md heuristic and reaches the boss in at least half of 200 runs (sanity check, not a target)

## Subtasks

- [x] Bot interface
- [x] Random bot
- [x] Greedy scoring
- [x] Run driver

## Notes

- 2026-10-01: tools/ runs natively on Node 24 (erasable syntax, `.ts` import extensions); confirm src/ follows the same import style (T001) or add a runner, and record the choice.
- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Runner choice: none. src/ already follows ADR-006 (`.ts` imports, erasable syntax); `node tools/balance/...` imports src/run, src/content and src/sim natively on Node 24 (verified by running the bots with plain `node`).
- 2026-10-01: First measured rates (seeds bot-1..bot-200, harnesses alternating, fresh profile): greedy Terminal Purist boss 87/100, shipped 79/100; IDE Companion boss 93/100, shipped 90/100. Random: shipped 1/200 (mostly abandons; fuzzing only). Greedy wins are far above the 35-65% exit target: tuning input for T077. The lightest-prompt rule matters most (Purist boss 89/200 -> 170/200 on seeds bal-1..200 when switching from the first prompt `senior` to `concise`).
- 2026-10-01: Speed: greedy about 340 runs/s, random about 850 runs/s on one core (logs off).

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: maxTurns hit, resumed
- 2026-10-01: AC1 verified: tools/balance/run.test.ts "the same seed gives the same run, and replay rebuilds it" and "is pure" for both bots (botRng forks the run seed); npx vitest run tools/balance (13 passed)
- 2026-10-01: AC2 verified: tools/balance/run.test.ts "the random bot completes 200 runs, each ending in runEnd" (passed)
- 2026-10-01: AC3 verified: heuristic documented in docs/architecture/testing.md (Balance sim) and unit-tested in tools/balance/bots/greedy.test.ts (6 tests); run.test.ts sanity test: boss reached in 180/200 runs (>= 100)
- 2026-10-01: npm run check exit 0 (84 files, 758 tests; harness lint 0 errors); production lines 362 (untracked new files, counted with wc)
- 2026-10-01: review requested
- 2026-10-01: done (R072)
