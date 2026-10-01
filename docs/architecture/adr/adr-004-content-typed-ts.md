---
title: ADR-004 Content as typed TS data
summary: Define all game content as typed TypeScript data with define helpers and a small trigger-condition-effect DSL, plus named handlers as an escape hatch.
keywords: [adr, content, dsl, typescript, data-driven, validation]
type: adr
status: active
updated: 2026-10-01
related: [../content-model.md, adr-002-deterministic-sim.md, ../../game/content/tools.md]
---

# ADR-004: Content as typed TypeScript data

Status: accepted, 2026-10-01.

## Context

The full game has about 36 tools, 24 skills, 16 memories, 10 lessons, 30+ enemies, 6
elites, 3 bosses, 16 events, 4 harnesses and 6 system prompts, all tuned repeatedly by the
balance sim. Content is authored by AI agents. Typos in ids, out-of-range numbers and text
that drifts from behaviour are the main risks.

## Decision

- Content lives in `src/content` as TypeScript modules using `defineTool`, `defineSkill`,
  `defineEnemy`… helpers with `satisfies` and literal-typed ids, so references are
  compile-checked and autocompleted.
- Behaviour is expressed in a small declarative DSL: rules of
  **trigger -> conditions -> effects** with a fixed set of verbs
  ([content model](../content-model.md)).
- Logic the DSL cannot express goes into named, unit-tested handlers in `src/sim/handlers`
  (target ≤ 10, bosses mostly).
- Tooltips and plain-English lines are generated from the DSL via string templates; names
  and flavour are string keys.
- `validate.ts` checks ids, references, number budgets and text keys in tests.
- `CONTENT_VERSION` is bumped on every content change and stored in saves.

## Consequences

- Wrong ids fail type-checking; wrong numbers fail validation tests.
- Text cannot drift from behaviour for DSL-expressed effects.
- The sim stays generic: it interprets rules and never imports content data.
- The DSL must grow carefully; each new verb needs sim support, a template, tests and a
  GDD entry.
- Content is bundled as code (tree-shaken, minified); there is no runtime content
  loading or modding in M1–M3.

## Alternatives considered

- **JSON/YAML files**: no compile-time checks, no comments in JSON, needs schema tooling.
- **Free-form code per item** (each item a function): flexible, but tooltips cannot be
  generated and effects become hard to balance and test.
- **A spreadsheet pipeline**: good for designers, but adds a build step and a second source
  of truth for agents.
