---
id: T035
epic: E007
title: Tag breakpoints POSIX, Refactor, Indexed, TDD
summary: "Pure breakpoint counting over equipped tool tags and the M1 breakpoint effects POSIX, Refactor, Indexed and TDD, exported for run selectors and the build panel."
keywords: ["breakpoints", "tags", "synergy", "build", "sim"]
type: task
status: done
priority: p1
model: opus
size: S
depends_on: [T033]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T035: Tag breakpoints POSIX, Refactor, Indexed, TDD

## Goal

Tag synergies reward coherent builds and are shown in the build panel from the same function the sim uses.

## Context

- Epic: [E007](EPIC.md)
- [Harness and loadout: Tag breakpoints](../../../../docs/game/systems/harness-loadout.md#tag-breakpoints)
- [Vertical slice: Breakpoints row](../../../../docs/game/vertical-slice.md#in-scope)
- Code: `src/sim/breakpoints.ts`
- Out of scope: Always Online and Orchestration (E014), breakpoint chips UI (E009).

## Acceptance Criteria

- [x] A pure `breakpoints(tools)` counts equipped tool tags (dual-tag tools count for both) and returns progress per breakpoint
- [x] POSIX pipes +500 ms, Refactor Edit +15%, Indexed Search output -1, TDD Test fire restores 2 Trust: one test each
- [x] Breakpoint modifiers appear in why lists as `bp:<id>`

## Subtasks

- [x] Counting function
- [x] Effects via mods and rules
- [x] Tests

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- Scope extension (orchestrator, 2026-10-01): tests/e2e/nodes.spec.ts may be edited. The Idle Cycle heal test now reads Trust from the status bar and asserts the heal relation (after = min(max, before + ceil(30% of max)), max 80) instead of fixed numbers, so sim balance changes no longer break it. Resolves the earlier block (POSIX moved purist Trust 42 -> 40).

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: src/sim/breakpoints.ts holds the 4 M1 defs (rules in the item DSL) and `breakpoints(tools)`; rules/state.ts appends active ones to the rule list as `bp:<id>` (after lessons), so passive mods and the TDD toolFired rule run through the T032/T033 engine. Exported via src/sim/index.ts; run selector `loadoutBreakpoints(state)` in src/run/combat.ts
- 2026-10-01: fight outcomes moved for Shell-heavy loadouts (terminal_purist: POSIX active, pipes 1000 -> 1500 ms). `npm run golden:update`: only purist-typos/noise/low-trust and summary changed (companion fights identical); boss.test p1b fixed loadout now wins at 36250 ms, 226 events (new hash). planned.test and mods.test pipeMs fixtures use tags that stay below every breakpoint so they keep testing their own stat
- 2026-10-01: AC1 verified: npx vitest run src/sim/breakpoints.test.ts "counts every tag of a tool and returns progress per breakpoint" (grep Search+Shell counts for both; count/need/active per breakpoint) + src/run/combat.test.ts "breakpoints" (terminal_purist Shell 3/3, Edit 1/3, Search 2/3, Test 0/2)
- 2026-10-01: AC2 verified: src/sim/breakpoints.test.ts one test each: POSIX pipe v 1500 vs 1000 control; Refactor pct 35 vs 20; Indexed output tokens 1 vs 2; TDD heal 2 at every Test activation, none with 1 Test tool (6 passed)
- 2026-10-01: AC3 verified: Refactor damage why `['zone:focused', 'bp:refactor']`; collected mod ids `['bp:posix', 'bp:indexed']` (only damage events carry why lists in the sim, T033)
- 2026-10-01: harness:diff production=88 total=570
- 2026-10-01: checks: npm run check exit 0; npm run build exit 0; CI=1 npm run e2e exit 1: 19 passed, 1 failed (nodes.spec.ts:110 Idle Cycle Heal, received `Trust 40 → 64`, expected `42 → 66`; deterministic on rerun). combat.spec.ts green. Cause: POSIX moves the purist fights before the Idle Cycle; spec is outside allowed paths
- 2026-10-01: blocked: e2e nodes.spec.ts expectations need updating (see Notes); all AC implemented and verified by vitest
- 2026-10-01: final npm run check exit 0 (one earlier run hit a 5 s timeout in apply.test property test under load; passes alone and on rerun); harness:diff production=68 total=549
- 2026-10-01: unblocked by orchestrator (scope: tests/e2e/nodes.spec.ts); Idle Cycle heal test asserts the heal relation from the page's Trust; CI=1 npx playwright test tests/e2e/nodes.spec.ts (4 passed)
- 2026-10-01: npm run check exit 0 (4 steps here, 798 tests), npm run build exit 0, CI=1 npm run e2e 20 passed
- 2026-10-01: review requested
- 2026-10-01: done (R079)
