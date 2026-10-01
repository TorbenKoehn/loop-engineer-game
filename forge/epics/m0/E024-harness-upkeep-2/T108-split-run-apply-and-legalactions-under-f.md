---
id: T108
epic: E024
title: Split run apply and legalActions under fn_lines
summary: "apply() and legalActions() in the run reducer drop below the fn_lines warn_at of 30 via handler tables, with unchanged behaviour, tests and goldens."
keywords: ["apply", "legalActions", "fn-lines", "run-reducer", "refactor", "dispatch"]
type: task
status: backlog
priority: p2
model: sonnet
size: S
depends_on: [T105]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T108: Split run apply and legalActions under fn_lines

## Goal

`apply` (41 lines) and `legalActions` (36 lines) in the run reducer are above the
`fn_lines` warn_at of 30 and grow with every new `Action` variant or run mode. After this
task both are short dispatchers over per-variant and per-mode handler tables, so new
variants add a table entry instead of lengthening a switch, with no behaviour change.

## Context

- Epic: [E024](EPIC.md)
- `src/run/apply.ts` (path after T105; see T105's Log for the move map), `src/run/actions.ts`
- `src/run/apply.test.ts`, `docs/architecture/run-state.md`
- Out of scope: new actions or modes; changing handler functions' behaviour or signatures used elsewhere; moving files.

## Acceptance Criteria

- [ ] `npm run harness:lint` shows no `fn_lines` finding for `apply` or `legalActions`
- [ ] Unknown action types decoded from saves still return `unknownAction`: `npx vitest run apply` passes with test files unchanged
- [ ] `npx vitest run tools/golden` passes without `npm run golden:update`
- [ ] `npm run check` exits 0

## Subtasks

- [ ] Typed handler map keyed by `Action['t']` that keeps exhaustiveness checked by tsc
- [ ] Mode-to-actions map for `legalActions`

## Notes

- 2026-10-01: Requested by the orchestrator (fn_lines warnings). Waits for T105, which may move `apply.ts`.
- 2026-10-01: Definition of Ready holds; kept in backlog only because `wip_ready` (8) is full. Move to ready when T105 is done.

## Log

- 2026-10-01: created
