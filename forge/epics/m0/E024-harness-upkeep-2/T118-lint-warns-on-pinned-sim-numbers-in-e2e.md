---
id: T118
epic: E024
title: Lint warns on pinned sim numbers in e2e specs
summary: "Harness lint rule e2e_pinned_number warns on string or regex literals in e2e text assertions that pin fight numbers next to Trust, Credits, dmg or an arrow; templates and digit patterns pass."
keywords: ["lint", "e2e", "playwright", "pinned-numbers", "balance", "harness"]
type: task
status: ready
priority: p1
model: sonnet
size: S
updated: 2026-10-01
related: ["EPIC.md", "../../../retros/RT005-fifth-retro-e007-e009-e010-screens-bots.md"]
---

# T118: Lint warns on pinned sim numbers in e2e specs

## Goal

Specs that pin fight numbers break whenever balance moves (T067/T035 `Trust 42 → 66`, T029
in RT004). The rule lives only in testing.md and a review step (RT005 What Went Wrong 3).
After this task the harness lint warns on such literals before review.

## Context

- Epic: [E024](EPIC.md); [RT005 proposal P1](../../../retros/RT005-fifth-retro-e007-e009-e010-screens-bots.md)
- `tools/harness/budgets/code/code.ts` (existing code rules), `harness.config.json` (budget entries)
- `docs/architecture/testing.md` (pinned-number rule), `tests/e2e/nodes.spec.ts`, `tests/e2e/combat.spec.ts`
- Out of scope: unit tests and goldens; changing other budgets' values; rewriting specs beyond replacing a flagged literal.

## Acceptance Criteria

- [ ] Vitest case passes: `'Trust 42 → 66'` and `/Trust 40 → 64/` in a `tests/e2e/**/*.spec.ts` text assertion produce an `e2e_pinned_number` warning
- [ ] Vitest case passes: `` `Trust ${a} → ${b}` ``, `/-\d+ Trust/` and the same literal in a file outside `tests/e2e/` produce no warning
- [ ] `npm run harness:lint` reports no `e2e_pinned_number` finding on the current specs; each spec line changed for it reads the number from the page or content (Log lists them)
- [ ] `docs/harness/budgets-table.md` lists `e2e_pinned_number` after `npm run harness:budgets`, and testing.md links the rule
- [ ] `npm run check` exits 0

## Subtasks

- [ ] Rule and config entry
- [ ] Vitest cases
- [ ] Run on current specs and fix or narrow

## Notes

- 2026-10-01: Source: RT005 P1. Current `nodes.spec.ts` holds content numbers such as `'Restore 20 Trust'` and `'+5 Credits'`; decide per literal whether it is a fight number (replace) or content data (keep and let the rule pass, e.g. by matching only `→`, `N/N` and `N dmg` shapes). Record the choice in the Log.
- 2026-10-01: If a spec must change, wait for T105 to finish (it may move e2e paths). Adds a config entry, which E024 Out of Scope allows for new rules.
- 2026-10-01: Meets the Definition of Ready.

## Log

- 2026-10-01: created
