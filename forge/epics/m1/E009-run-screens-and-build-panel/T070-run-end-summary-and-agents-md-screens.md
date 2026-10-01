---
id: T070
epic: E009
title: Run end summary and AGENTS.md screens
summary: "Run-end screen (^C or Merged to main!) with cause, top-3 damage sources, time per zone, compactions and one rule-picked hint, then the AGENTS.md lesson screen."
keywords: ["ui", "run-end", "summary", "hints", "agents-md", "lessons"]
type: task
status: backlog
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

- [ ] A loss shows ^C and a win shows "Merged to main!" in 64 px --brand, with cause, top-3 damage sources as text bars, time per zone and compaction count
- [ ] Exactly one hint is chosen by the onboarding.md rules (Rot > 40%, > 3 Throttles, died to Deadline) or a default (tests per rule)
- [ ] The AGENTS.md screen renders as a Markdown file with frontmatter and offers 3 lessons; pick, replace or skip dispatches and returns to the title
- [ ] No Training Data appears anywhere in M1

## Subtasks

- [ ] Summary layout
- [ ] Hint rules (pure, in src/run)
- [ ] AGENTS.md screen

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
