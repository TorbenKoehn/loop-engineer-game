---
id: RT005
title: "Fifth retro: E007, E009, E010 screens, bots and E024 gates"
summary: "15 tasks done, 12/15 approved first round. Worktree merges regenerate generated files and leave task Logs to the agent; reviews flag pinned sim numbers; old UI tasks get re-sized."
keywords: ["retro", "worktree", "generated-files", "e2e", "ui-sizing", "max-turns"]
type: retro
status: active
updated: 2026-10-01
related: ["RT004-fourth-retro-e007-e008-e009-sim-save-and.md", "../epics/m0/E024-harness-upkeep-2/EPIC.md"]
---

# RT005: Fifth retro: E007, E009, E010 screens, bots and E024 gates

Scope: commits after 77f0832 (RT004) up to 2d8f2c8. Done: T036, T047, T065, T066, T037,
T071, T072, T067, T102, T060, T035, T103, T070, T045, T061. Reviews R067-R084.

## Contents

What Went Well · What Went Wrong · Learnings · Actions · Deletions · Budget overrides

## What Went Well

- **Numbers**: 15 tasks done (10 Opus, 5 Sonnet). First pass: 12/15 approved in round 1
  (80%, down from 86%). 18 reviews, 1.2 rounds per task: 1 blocker, 2 majors, 18
  minors, 16 nits. Attempts: 1.0 per task. Escalations to Opus: 0 (2 due, see Also
  seen). Re-plans: 0. Blocked: 3 (T047 pre-existing lint red, T035 nodes.spec outside
  its paths, T061 diff 794). maxTurns hits: 5 of 10 Opus runs, 3 logged. Lint: 0 errors,
  31 warnings (budget 25, over; 22 at RT004). Overrides: 0 in files, 2 in task Logs.
- RT004 actions held:
  - e2e gate: T102 (RT004 P1) put build and e2e into `npm run check`. T035's broken
    `nodes.spec.ts` was caught before review, not by a later task as with T029.
  - CSS cap: T070 (css 260) and T061 (css 190) report CSS separately, within 300.
  - Bookkeeping lint: T103 (RT004 P2) errors on checked AC without evidence. No
    evidence finding in R067-R084 (R059 F1 in RT004).
- Rework was cheap. Two of the three changes-requested were real test gaps: R070 F1
  (assertion inside a branch that never ran) and R076 F1 (skip logic false green).
  The third was the orchestrator's merge (R083). Each closed in one round.
- Keep: real-content tests with logged hashes (T037), deterministic report checks by
  byte-identical output (T072), e2e that reads values from the page (T035 fix).

## What Went Wrong

1. **Worktree merges break a green tree.** Evidence: R083 F1 (blocker). The union merge
   of T061 with T070 put `enLog` out of order in `areas.gen.ts`, and
   `strings-registry.test.ts` failed although the agent's check was green. Main-tree
   commits 2f7e6d6 and b1d734a added `maxTurns hit` lines to the task files of T061 and
   T045 while the worktree agents edited the same Logs, so the patches conflicted.
   → Why: parallel.md excluded INDEX, BOARD and budgets-table from the patch, but not
   `*.gen.ts`. `.gitattributes` union-merged a sorted generated file. The ladder tells
   the orchestrator to log a maxTurns hit, and for a worktree task that writes one file
   in two trees. Root cause: the parallel procedure had no regeneration step for every
   generated file and no single writer for a running task's file.
2. **UI screens stay oversized; the RT003 split rule never reached them.** Evidence:
   production lines (src, no tests, no CSS, `git show --numstat`): T067 395, T070 382,
   T061 645 (override 604). Sonnet S tasks: T060 203, T065 250, against the Sonnet max
   of 200. T067 and T061 hit maxTurns. Every E006 and E009 task was created before
   RT003 (2722ef5, an ancestor of d4a2b36).
   → Why: the split rule lives in plan-epic step 4, which runs only at planning time.
   Delegate pre-flight re-sizes only for Notes added after planning. Root cause: no
   re-size gate for a backlog planned under older rules. Still open and planned before
   RT003: T062, T068, T069, T079, T080, T081, T082, T084.
3. **Tests pin sim numbers and break when balance moves.** Evidence: T067 (started
   7f87f87, after RT004) asserted `Trust 42 → 66` in `nodes.spec.ts`. R075 did not flag
   it, and T035 blocked on it (`40 → 64`). The same thing happened with T029 and
   combat.spec in RT004.
   → Why: RT004 put the rule only in testing.md. Neither forge-task (writer) nor
   forge-review (checker) names it. The companion list allows `combat.spec.ts`, not
   other specs. Root cause: a doc rule with no skill step or check pointing at it.

Also seen:
- **Flakes under load.** T102 Log (cold vitest timeout in `apply.test.ts`), T035 Log
  (5 s property-test timeout under load), and 3 orchestrator check reruns that are not
  logged. Since T102, each parallel worktree runs vitest, build and e2e at the same
  time. Proposal P2.
- **maxTurns.** The cap of 90 took effect only after a session restart: T037, T071
  and T067 ran at 60. At 90, 2 of 4 runs hit it: T045 (297 lines) and T061 (645,
  oversized). Every resumed run was approved in round 1, so a hit costs one resume.
  Decision: keep 90, and reduce hits through sizing (action 3).
- **Ladder vs practice.** T066 and T102 (Sonnet, one major each) were reworked by the
  same Sonnet agent and passed round 2. T046 went the same way in RT004, so the count
  is 3 of 3. The ladder says to start a fresh run on Opus. Decision pending for the
  orchestrator: follow the ladder, or amend it so that a small major-only fix resumes
  the same agent.
- **Pre-existing red.** The R066 lint error (b6a267d) blocked T047, and T065 noted it.
  T107 (commit gate) is still `ready`.
- **Claims vs files.** T103 now enforces evidence lines. The claim in R083 was true in
  the worktree and false after the merge, which action 1 fixes.
- **Stale numbers.** R074 F1: T072's balance headline was outdated by the parallel T037.
- **Open doc follow-ups:** R067 F1 (statuses.md), R073 F2 (event-log.md), R075 F1
  (events.md), R081 F1 (screens.md).

## Learnings

- A rule placed at one step does not reach work that already passed that step. Plan-time
  rules need a start-time check for older backlog.
- Generated files must be regenerated, never merged. A merge driver hides the error
  until a test catches it.
- A doc rule that no skill step or check points at does not change behaviour. RT004's
  testing.md line was in force when T067 broke it.
- 80% first pass with only 1 blocker (from the orchestrator) means implementer quality
  held. The frictions sit in orchestration: merges, sizing and scheduling.

## Actions

- [x] Worktree merges regenerate generated files and keep one writer per task file.
  parallel.md excludes `**/*.gen.ts` from the patch and runs `npm run content:index`
  after each apply. While a task runs in a worktree, its Log lines go into the resume
  message (the workflow ladder row says so too). `.gitattributes` union merge removed.
  New delegate tests.md scenario 7. | form: skill (template) | evidence: R083 F1/T061,
  2f7e6d6, b1d734a | applied: yes
- [x] Pinned sim numbers are a review major. forge-review step 5 names pinned fight
  numbers outside goldens as a major; forge-task step 5 says to assert relations. New
  forge-review tests.md scenario 6. | form: skill (lint form: P1) | evidence: T067/T035,
  R075, T029 | applied: yes
- [x] Old UI tasks are re-sized before start. Delegate pre-flight: a UI task created
  before RT003 goes to the planner, which re-sizes it against plan-epic step 4. Delegate
  tests.md scenario 5 adds T950 and drops scenario 6's stale must-not. | form: skill |
  evidence: T067, T070, T061, T060, T065 | applied: yes

Proposed tasks for E024 (T104-T108 are still ready):
- P1 (p1, sonnet, S) **Lint warns on pinned sim numbers in e2e specs.** AC: rule
  `e2e_pinned_number` warns on a string or regex literal in a `tests/e2e/**/*.spec.ts`
  text assertion that holds a digit literal next to `Trust`, `Credits`, `dmg` or `→`;
  vitest cases flag `'Trust 42 → 66'` and let `` `Trust ${a} → ${b}` `` and
  `/-\d+ Trust/` pass. Current specs get no warning, fixed if needed. Evidence: T067/T035,
  T029.
- P2 (p1, sonnet, S) **check stays green under parallel load.** AC: check passes
  Playwright `--workers` from `CHECK_E2E_WORKERS` (default 2); fast-check property tests
  in `src/run/apply.test.ts` get an explicit timeout of at least 20 s; three concurrent
  `npm run check` runs in separate worktrees pass twice in a row (Log). Evidence: T102
  and T035 Logs, 3 reruns.
- P3 (no new task): raise T107 (commit gate) to p0 and run it next. Pre-existing red
  blocked T047.
- Orchestrator, once: send T062, T068, T069, T079-T082 and T084 to the planner in one
  re-size run instead of one at a time (action 3).

## Deletions

- `.gitattributes`: removed `src/content/strings/areas.gen.ts merge=union`. Regeneration
  after each apply replaces it, and the union merge produced R083's broken file.
- delegate tests.md scenario 6: replaced the must-not "send to review on `npm run check`
  alone". It has been stale since T102 put build and e2e into check.
- No skill retired: all five were used. plan-epic planned E024 (ac036aa).

## Budget overrides

None in frontmatter or code headers. Log-only:
- T061 `task_diff_lines` 604 TS: expired (task done). The reason ("one cohesive panel")
  is the sizing miss of What Went Wrong 2.
- T024 total 1252: the reason (generated goldens) still holds until T104 lands.
- T016 651 and T098 2309: expired earlier (RT003, RT004).
