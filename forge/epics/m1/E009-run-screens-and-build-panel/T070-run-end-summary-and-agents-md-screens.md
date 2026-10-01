---
id: T070
epic: E009
title: Run end summary and AGENTS.md screens
summary: "Run-end screen (^C or Merged to main!) with cause, top-3 damage sources, time per zone, compactions and one rule-picked hint, then the AGENTS.md lesson screen."
keywords: ["ui", "run-end", "summary", "hints", "agents-md", "lessons"]
type: task
status: done
priority: p2
model: opus
size: M
depends_on: [T064, T049]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T070: Run end summary and AGENTS.md screens

## Goal

A finished run explains why it ended and turns that into one lesson, closing the M1 loop.

## Context

- Epic: [E009](EPIC.md)
- [Onboarding: Why did I lose?](../../../../docs/game/ux/onboarding.md#why-did-i-lose-run-end-summary)
- [Screens: Run end and AGENTS.md rows](../../../../docs/game/ux/screens.md#other-screens)
- [Meta: AGENTS.md lessons](../../../../docs/game/systems/meta-progression.md#agentsmd-lessons)
- Code: `src/ui/screens/run-end.tsx`, `src/ui/screens/agents-md.tsx`, `src/run/hints.ts`
- Out of scope: Training Data receipt (E015), history screen (E017), more hint rules (E020).

## Acceptance Criteria

- [x] A loss shows ^C and a win shows "Merged to main!" in 64 px --brand, with cause, top-3 damage sources as text bars, time per zone and compaction count
- [x] Exactly one hint is chosen by the onboarding.md rules (Rot > 40%, > 3 Throttles, died to Deadline) or a default (tests per rule)
- [x] The AGENTS.md screen renders as a Markdown file with frontmatter and offers 3 lessons; pick, replace or skip dispatches and returns to the title
- [x] No Training Data appears anywhere in M1

## Subtasks

- [x] Summary layout
- [x] Hint rules (pure; in src/ui/screens/run-end/summary.ts, see Notes)
- [x] AGENTS.md screen

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Hint rules live in `src/ui/screens/run-end/summary.ts` (pure, unit-tested), not `src/run/hints.ts`: src/run was outside this attempt's allowed paths (T045 in parallel). Moving it to src/run later is a pure `git mv`.
- 2026-10-01: Rule order when several match: Rot, Throttles, Deadline (onboarding.md order). Zone time, compactions and Throttles are from the last fight (onboarding.md "Time per zone in the last fight"); Throttles count `statusOn` throttle on `a` or `t<slot>`.
- 2026-10-01: AC text wins over screens.md: "Merged to main!" (screens.md says `Shipped!`) and no TD receipt in M1. An abandoned run shows `^C` and returns to the title without an offer. `closeRun` copies the written lessons into the `meta` signal so the next run carries them (saves: E008).
- 2026-10-01: Diff: production=645 total=879 from harness:diff, incl. css=260 (run-end.css 259 + shell.css 1). Without CSS: production=385, total=619.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: tests/e2e/run-end.spec.ts "a loss shows ^C ..." (64px, rgb(217, 30, 54) = --brand, cause, 3 damage bars, Cold/Focused/Rot rows, compactions 2) and "a win shows Merged to main!" (npm run check: 25 e2e passed)
- 2026-10-01: AC2 verified: npx vitest run src/ui/screens/run-end (8 passed: one test per rule with boundaries, default, first-match-wins); e2e shows hint `default` (S28) and the Deadline hint (S28 with a lesson)
- 2026-10-01: AC3 verified: e2e "AGENTS.md: a Markdown file with frontmatter; write, then replace when full" (frontmatter lines, 3 lessons, write -> title, second run replace line 1 -> title) and the win test's Keep as it is -> title
- 2026-10-01: AC4 verified: every run-end e2e asserts the body has no `Training Data` or `TD`; grep finds no Training Data string in src/content/strings or src/ui
- 2026-10-01: npm run check: all steps passed (tsc, biome, vitest 820 passed, build, e2e 25 passed, harness lint 0 errors)
- 2026-10-01: review requested
- 2026-10-01: done (R081)
