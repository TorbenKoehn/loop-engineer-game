---
id: T010
epic: E005
title: Generated plain-English text from templates
summary: "String table src/content/strings/en.ts with one template per effect, trigger, condition, trait and status kind, plus pure describe functions composing item lines from data."
keywords: ["strings", "localisation", "templates", "tooltips", "plain-english", "text"]
type: task
status: done
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
- [Content model: Generated text](../../../../docs/architecture/content-model.md#generated-text)
- [Localisation: Rules 2, 3, 6, 7 and String files](../../../../docs/game/ux/localisation.md)
- [Skills: Trigger semantics (Grep First example line)](../../../../docs/game/content/skills.md#trigger-semantics)
- Code: `src/content/strings/en.ts`, `src/content/text.ts`
- Out of scope: The UI `t()` function and number formatting (E006), pseudo-locale (M2), names and flavour of specific items (other E005 tasks).

## Acceptance Criteria

- [x] Test `describes Grep First` renders "After a Search tool fires, your next Edit tool hits 50% harder." from a rule fixture
- [x] Every Effect, Trigger, Cond and Trait kind in the content types has exactly one template key (test iterates the kind lists)
- [x] Test `describes a tool at each version` renders a dmg tool line with its v1, v2 and v3 values
- [x] en.ts is a flat `as const` record with dotted lower-case keys and named placeholders only (test)

## Subtasks

- [x] String table shape and key naming
- [x] Templates per kind
- [x] describeEffect, describeRule, describeTool, describeEnemy

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Kind templates are `<group>.<snake_kind>` (`effect.dmg`, `trigger.tool_fired`), lower-case clauses; the target is a `{target}` placeholder (`target.front`), not a key variant, so each kind has exactly one key. Trigger/cond templates wrap `{then}`; `text.sentence` plus first-letter upper-casing makes the sentence; lists join via `text.list`/`text.and`.
- 2026-10-01: Follow-up for docs (outside this task's allowed paths): content-model.md "Generated text" and localisation.md rule 6 cite `effect.dmg.front`; the implemented key is `effect.dmg` with `{target}`.
- 2026-10-01: Data-derived keys: `tool.<id>.name`, `enemy.<id>.name` (fall back to the id until content tasks add them), `handler.<id>` (required, render throws if missing). Numbers are plain `String(n)`; Intl formatting stays with E006.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/content/text.test.ts -t "describes Grep First" (rule() fixture renders the exact line)
- 2026-10-01: AC2 verified: src/content/strings/en.test.ts "every Effect, Trigger, Cond, Trait and Verb kind has exactly one template key" iterates EFFECT/TRIGGER/COND/TRAIT/VERB_KINDS; text-kinds.test.ts renders a fixture per kind
- 2026-10-01: AC3 verified: src/content/text.test.ts "describes a tool at each version" (grep dmg 6/9/13 at v1/v2/v3)
- 2026-10-01: AC4 verified: en.test.ts "en.ts is a flat as-const record with dotted lower-case keys" (literal type via expectTypeOf, key regex) and "uses named placeholders only"
- 2026-10-01: npm run check green (tsc, biome, vitest 114+ passed, harness:check)
- 2026-10-01: review requested
- 2026-10-01: done (R013)
