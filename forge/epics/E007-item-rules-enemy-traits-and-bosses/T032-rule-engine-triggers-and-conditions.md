---
id: T032
epic: E007
title: "Rule engine: triggers and conditions"
summary: "Executes skill, memory, lesson, prompt and trait rules in the sim: every DSL trigger and condition, ordering per the trigger semantics, no recursion, once-per-run tracking."
keywords: ["rules", "dsl", "triggers", "conditions", "skills", "sim"]
type: task
status: backlog
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
- [Content model: The DSL](../../../docs/architecture/content-model.md#the-dsl-rules--trigger---condition---effect)
- [Skills: Trigger semantics](../../../docs/game/content/skills.md#trigger-semantics)
- [Simulation core: API (usedOncePerRun)](../../../docs/architecture/sim-core.md#api)
- Code: `src/sim/combat/rules.ts`
- Out of scope: Passive mod stats (next task), behaviour checks of specific items (E007 item tests).

## Acceptance Criteria

- [ ] Each trigger kind in content-model.md has a test firing a rule at the right moment
- [ ] Each condition kind has one passing and one failing test
- [ ] "When X fires" rules run after X's effects and output and before the compaction check; fightStart rules run at t = 0 in slot order (tests)
- [ ] A self-triggering rule fixture does not recurse (test)
- [ ] oncePerRun rule ids are returned in `CombatResult.agentAfter.usedOncePerRun`

## Subtasks

- [ ] Rule collection at fight start
- [ ] Trigger dispatch points
- [ ] Condition evaluation
- [ ] Recursion guard

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
