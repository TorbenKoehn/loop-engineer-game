---
id: T077
epic: E010
title: M1 balance tuning to exit targets
summary: "Tune M1 content numbers until both harnesses win 35-65%, no tool exceeds 40% of winning loadouts and fight lengths hit their medians, updating the GDD alongside."
keywords: ["balance", "tuning", "win-rate", "content", "exit-criteria"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T073, T075, T039]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T077: M1 balance tuning to exit targets

## Goal

Meet M1 exit criteria 1, 2 and 5 with evidence from the balance CLI, keeping the GDD the source of truth for numbers.

## Context

- Epic: [E010](EPIC.md)
- [Vertical slice: Exit criteria 1, 2, 5](../../../../docs/game/vertical-slice.md#exit-criteria)
- [Milestones: Order of work (GDD updated with the sim)](../../../../docs/game/milestones.md#order-of-work-inside-each-milestone)
- [Phase 1: Balance expectations](../../../../docs/game/content/phase-1-implement.md#balance-expectations-phase-1)
- Code: `src/content/`, `tools/balance/targets.json`, `tests/golden/`
- Out of scope: Rule or system changes (report them as questions instead), M2 targets.

## Acceptance Criteria

- [ ] The balance report shows both harnesses winning Phase 1 at 35-65% with the greedy bot over 1000 runs each
- [ ] No tool appears in more than 40% of winning loadouts
- [ ] Median fight length is 20-35 s for normal, 30-45 s for elite and 40-60 s for boss fights at 1x
- [ ] Every changed number is updated in the GDD content docs, CONTENT_VERSION is bumped and goldens are updated with the reason
- [ ] `npm run balance:check` passes

## Subtasks

- [ ] Baseline report
- [ ] Tuning iterations
- [ ] GDD and golden updates

## Notes

- Orchestrator 2026-10-01 (R074): after T037 (boss armor) `npm run balance` greedy: Terminal Purist 42.8% wins, IDE Companion 87.8%, boss median 41.4 s. IDE is too strong. Start tuning from fresh numbers; archetype win rates are not reported yet (R074 F3).

- Orchestrator 2026-10-01: T071 measured greedy-bot win rates of ~80% (Terminal Purist) and ~90% (IDE Companion) on 100 seeds each - far above the 35-65% M1 target; random bot ~0%. The earlier "1 in 30" note was a naive default-pick walk.

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
