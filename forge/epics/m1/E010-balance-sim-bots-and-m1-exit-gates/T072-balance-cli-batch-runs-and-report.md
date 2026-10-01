---
id: T072
epic: E010
title: Balance CLI batch runs and report
summary: "tools/balance/cli.ts running batches by harness, bot, phase and seed range, writing deterministic JSON and Markdown reports with win rates, pick rates and fight lengths."
keywords: ["balance", "cli", "report", "win-rate", "statistics"]
type: task
status: done
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

- [x] `node tools/balance/cli.ts --runs 1000 --harness all --bot greedy --phase 1 --seed-from 1 --out reports/balance.json --md reports/balance.md` writes both files
- [x] The report has win rate per harness and prompt with 95% interval, pick and win-when-picked rates per item, winning-loadout share per tool, fight-length median and p90 per encounter type, Trust lost per fight, credits curve and compactions per fight
- [x] The same arguments produce byte-identical JSON (test)
- [x] Runtime for 1000 runs per harness is recorded in the Log

## Subtasks

- [x] Argument parsing (`cli.ts` parseCli)
- [x] Batch runner (`batch.ts` recordRun, runBatch)
- [x] Metrics (`report.ts` buildReport)
- [x] JSON and Markdown writers (`report.ts` reportJson, `markdown.ts`)

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Encounter types are the exit-criterion-5 classes: normal (easy and hard pools), elite, boss. Seeds are `String(n)`; `--runs` counts per harness. `npm run balance -- <args>` added. `reports/` is not gitignored and not committed; T073 decides whether CI writes it.
- 2026-10-01: For T073/T077: winning-loadout share counts starting tools (autocomplete 70.7%, edit_file 66.3% on seeds 1-1000), so exit criterion 2 needs a decision on whether starters count. Archetype win rates (testing.md) are not reported yet.
- 2026-10-01: Headline (greedy, phase 1, seeds 1-1000): win ide_companion 93.3% [91.6, 94.7], terminal_purist 78.2% [75.5, 80.7]; boss reach 95.1% / 85.8%; median fight normal 20.0 s, elite 38.6 s, boss 28.6 s. Criterion 1 and boss length fail today; tuning is T077.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: the exact AC command exited 0 and wrote reports/balance.json (8472 B) and reports/balance.md (3351 B); files removed afterwards
- 2026-10-01: AC2 verified: report.test.ts 'the report holds every exit-criteria metric' (winRate.byHarness and byHarnessPrompt with ci95, items pickRate and winWhenPicked, winningLoadoutShare, fights all/normal/elite/boss medianMs/p90Ms/trustLostMean/compactionsMean, creditsCurve)
- 2026-10-01: AC3 verified: npx vitest run tools/balance (24 passed) incl. 'the same arguments write byte-identical JSON and Markdown'; the 1000-run JSON had sha256 0de28d97... on three CLI runs
- 2026-10-01: AC4 runtime, 1000 greedy runs per harness: terminal_purist 2.4 s, ide_companion 3.3-3.4 s (one run under load: 6.1 s / 3.1 s); about 6 s wall for both
- 2026-10-01: review requested
- 2026-10-01: done (R074)
