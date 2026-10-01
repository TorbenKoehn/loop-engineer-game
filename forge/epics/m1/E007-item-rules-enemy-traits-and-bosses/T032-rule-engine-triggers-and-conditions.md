---
id: T032
epic: E007
title: "Rule engine: triggers and conditions"
summary: "Executes skill, memory, lesson, prompt and trait rules in the sim: every DSL trigger and condition, ordering per the trigger semantics, no recursion, once-per-run tracking."
keywords: ["rules", "dsl", "triggers", "conditions", "skills", "sim"]
type: task
status: done
priority: p0
model: opus
size: M
depends_on: [T022, T023, T028]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T032: Rule engine: triggers and conditions

## Goal

Items are data, not code: one rule engine turns trigger-condition-effect rules into sim behaviour, so new items rarely need new code.

## Context

- Epic: [E007](EPIC.md)
- [Content model: The DSL](../../../../docs/architecture/content-model.md#the-dsl-rules--trigger---condition---effect)
- [Skills: Trigger semantics](../../../../docs/game/content/skills.md#trigger-semantics)
- [Simulation core: API (usedOncePerRun)](../../../../docs/architecture/sim-core.md#api)
- Code: `src/sim/combat/rules.ts`
- Out of scope: Passive mod stats (next task), behaviour checks of specific items (E007 item tests).

## Acceptance Criteria

- [x] Each trigger kind in content-model.md has a test firing a rule at the right moment
- [x] Each condition kind has one passing and one failing test
- [x] "When X fires" rules run after X's effects and output and before the compaction check; fightStart rules run at t = 0 in slot order (tests)
- [x] A self-triggering rule fixture does not recurse (test)
- [x] oncePerRun rule ids are returned in `CombatResult.agentAfter.usedOncePerRun`

## Subtasks

- [x] Rule collection at fight start
- [x] Trigger dispatch points
- [x] Condition evaluation
- [x] Recursion guard

## Notes

- Engine lives in `src/sim/combat/rules/` (state.ts, conds.ts, engine.ts), not `rules.ts` (combat/ has 14 files).
- Triggers are queued (`raise`) where they happen (damage, guard, auto-compaction) and dispatched at fixed points: fightStart (end of start), tick step 2 (`every`), after each tool's output (toolFired, then compaction check), after each compaction check, after each enemy action, after Deadline damage, fightWon before `fightEnd`.
- Recursion guard: a raised trigger carries the chain of rules that caused it; a rule never sees a trigger from its own chain.
- Choices: item effects are flat (no zone/prime mods) with src `a`; `guardGained` needs gain > 0; `trustBelow` fires on hits that cost Trust (incl. Deadline); `damaged` only on enemy hits (amount before Guardrails); `nth` counts every trigger match. Passive rules never dispatch (T033). compact/summon/mod/custom effects are ignored by rules (T029/E013/T033/T037).
- oncePerRun id format: `<prompt|skill|memory|lesson>:<def id>#<rule index>`.
- CombatInput unchanged; harness trait rules still need a field (T034). No src/run follow-up needed for T032.
- Doc follow-ups (outside allowed paths): event-log.md "Ordering" says skill events come after `pipe?`; they now come after `tokens` and before `compaction?`; `a` is a new src for guard/heal/prime/charge/damage. sim-core.md should mention `Sim.rules` and `rules/**` in related_code.
- Production diff: 288 lines (numstat, tests/testing excluded).

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat/rules (triggers.test.ts: fightStart, fightWon, every, toolFired, compaction, damaged, guardGained, trustBelow, passive)
- 2026-10-01: AC2 verified: conds.test.ts, pass + fail case for each of the 8 cond kinds (31 rule tests passed)
- 2026-10-01: AC3 verified: triggers.test.ts "when X fires" (toolFired, damage, tokens, guard, compaction) and fightStart slot order at t = 0
- 2026-10-01: AC4 verified: triggers.test.ts "recursion guard" (self and mutual guardGained rules)
- 2026-10-01: AC5 verified: triggers.test.ts "oncePerRun" (agentAfter.usedOncePerRun = ['skill:s#0'], skipped next fight)
- 2026-10-01: npm run check green (62 files, 556 tests)
- 2026-10-01: review requested
- 2026-10-01: done (R054)
