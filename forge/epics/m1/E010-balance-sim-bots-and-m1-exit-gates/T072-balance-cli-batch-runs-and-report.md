---
id: T072
epic: E010
title: Balance CLI batch runs and report
summary: "tools/balance/cli.ts running batches by harness, bot, phase and seed range, writing deterministic JSON and Markdown reports with win rates, pick rates and fight lengths."
keywords: ["balance", "cli", "report", "win-rate", "statistics"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T071]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T072: Balance CLI batch runs and report

## Goal

One command produces the numbers the M1 exit criteria are judged by.

## Context

- Epic: [E010](EPIC.md)
- [Testing: Balance sim (CLI, Report)](../../../../docs/architecture/testing.md#balance-sim-toolsbalance)
- [Vertical slice: Exit criteria 1, 2, 5](../../../../docs/game/vertical-slice.md#exit-criteria)
- Code: `tools/balance/cli.ts`, `tools/balance/report.ts`
- Out of scope: Targets gate (next task), M2 metrics (E018).

## Acceptance Criteria

- [ ] `node tools/balance/cli.ts --runs 1000 --harness all --bot greedy --phase 1 --seed-from 1 --out reports/balance.json --md reports/balance.md` writes both files
- [ ] The report has win rate per harness and prompt with 95% interval, pick and win-when-picked rates per item, winning-loadout share per tool, fight-length median and p90 per encounter type, Trust lost per fight, credits curve and compactions per fight
- [ ] The same arguments produce byte-identical JSON (test)
- [ ] Runtime for 1000 runs per harness is recorded in the Log

## Subtasks

- [ ] Argument parsing
- [ ] Batch runner
- [ ] Metrics
- [ ] JSON and Markdown writers

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
