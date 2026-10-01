---
id: T061
epic: E006
title: Combat log with why lines and seeking
summary: "Terminal-panel combat log: one t()-rendered line per event in the fixed format with why modifiers, filters, virtualisation to 200 rows, and click-to-seek with highlights."
keywords: ["combat-log", "ui", "why", "seeking", "virtualisation"]
type: task
status: done
priority: p1
model: opus
size: M
depends_on: [T101, T010]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T061: Combat log with why lines and seeking

## Goal

The log is the show: every number in the fight can be traced to its cause, which is pillar one of the design.

## Context

- Epic: [E006](EPIC.md)
- [Screens: Tooltips and the combat log](../../../../docs/game/ux/screens.md#tooltips-and-the-combat-log)
- [Event log: kinds and why ids](../../../../docs/architecture/event-log.md#event-kinds)
- [UI: Combat replay player (seeking)](../../../../docs/architecture/ui.md#combat-replay-player)
- Code: `src/ui/combat/log/`
- Out of scope: Run-end summary (E009), screen-reader summaries (E020).

## Acceptance Criteria

- [x] Each event renders as `[mm:ss.mmm] source -> target: verb value (why)`, e.g. `[00:12.350] grep v2 -> Context Drift: 14 dmg (Focused +20%, piped +30%)` (unit test)
- [x] Filters All, Damage, Context and Enemies work
- [x] A 600-event fight renders at most 200 log rows in the DOM
- [x] Clicking a line seeks to it, pauses and highlights the involved units

## Subtasks

- [x] Line formatter
- [x] Filters
- [x] Virtual list
- [x] Seek and highlight

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Item mods are named by their item (`Unix Philosophy +30%`), not by their condition
  (`piped` in the AC example); values come from primeUsed `v`, zone constants and the item's
  passive mod effects. The log lives in the shell terminal (screens.md "Shell layout").
- budget_override task_diff_lines: 604 production TS lines (+190 CSS within its cap); reason:
  cohesive combat-log panel delivered and verified as one unit; split would be ceremony;
  orchestrator-approved 2026-10-01
- 2026-10-01: Naming item mods by item (`Unix Philosophy +30%`) instead of the condition
  (`piped +30%`) is accepted by the orchestrator.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: maxTurns hit (90), resumed
- 2026-10-01: AC1 verified: npx vitest run src/ui/combat/log (14 passed); format.test.ts asserts
  `[00:12.350] grep v2 -> Context Drift: 14 dmg (Focused +20%, Unix Philosophy +30%)`, primes,
  armor, Guardrails, Cold, and every event of two real fights in the format with no raw keys
- 2026-10-01: AC2 verified: list.test.ts filter test; tests/e2e/combat-log.spec.ts clicks All,
  Damage, Context, Enemies and checks every listed row's kind and the line count
- 2026-10-01: AC3 verified: list.test.ts renders `Rows` for a 600-event fight at 4 scroll
  positions and heights (<= 200 option rows each); e2e: rendered rows < min(200, 155 lines)
- 2026-10-01: AC4 verified: combat-log.spec.ts clicks a damage line: aria-selected, clock at
  its time, Pause pressed, result strip gone, source tool and target enemy `.is-picked`;
  ArrowUp and Home seek by keyboard; resuming clears the highlight
- 2026-10-01: CI=1 npm run check exit 0 (816 unit, 22 e2e passed; harness lint 0 errors);
  combat specs --repeat-each=4: 12 passed
- 2026-10-01: blocked: production diff 794 > 400 (see Notes)
- 2026-10-01: budget override approved by orchestrator (see Notes); review requested
- 2026-10-01: R083 changes-requested (1 blocker: areas.gen.ts merge artefact from union-merge with T070); orchestrator regenerated with npm run content:index; check green
- 2026-10-01: done (R084)
