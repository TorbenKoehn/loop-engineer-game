---
id: T010
epic: E005
title: Generated plain-English text from templates
summary: "String table src/content/strings/en.ts with one template per effect, trigger, condition, trait and status kind, plus pure describe functions composing item lines from data."
keywords: ["strings", "localisation", "templates", "tooltips", "plain-english", "text"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T009]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T010: Generated plain-English text from templates

## Goal

Every tooltip and plain-English line is generated from content data so text cannot drift from numbers (combat readability rule 4). Content data tasks then only add name, line and flavour keys.

## Context

- Epic: [E005](EPIC.md)
- [Content model: Generated text](../../../docs/architecture/content-model.md#generated-text)
- [Localisation: Rules 2, 3, 6, 7 and String files](../../../docs/game/ux/localisation.md)
- [Skills: Trigger semantics (Grep First example line)](../../../docs/game/content/skills.md#trigger-semantics)
- Code: `src/content/strings/en.ts`, `src/content/text.ts`
- Out of scope: The UI `t()` function and number formatting (E006), pseudo-locale (M2), names and flavour of specific items (other E005 tasks).

## Acceptance Criteria

- [ ] Test `describes Grep First` renders "After a Search tool fires, your next Edit tool hits 50% harder." from a rule fixture
- [ ] Every Effect, Trigger, Cond and Trait kind in the content types has exactly one template key (test iterates the kind lists)
- [ ] Test `describes a tool at each version` renders a dmg tool line with its v1, v2 and v3 values
- [ ] en.ts is a flat `as const` record with dotted lower-case keys and named placeholders only (test)

## Subtasks

- [ ] String table shape and key naming
- [ ] Templates per kind
- [ ] describeEffect, describeRule, describeTool, describeEnemy

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
