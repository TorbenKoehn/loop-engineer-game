---
title: Vertical slice scope (M1)
summary: Exact in- and out-of-scope list for milestone M1 (Phase 1 Implement only) with content ids, slice-specific rule deviations and measurable exit criteria.
keywords: [vertical-slice, scope, milestone, exit-criteria, m1]
type: gdd
status: active
updated: 2026-10-01
related: [milestones.md, content/phase-1-implement.md, content/tools.md, content/harnesses.md, ../architecture/testing.md]
---

# Vertical slice scope (M1)

**Goal:** one 10–15 minute run through Phase 1 (Implement) that proves the context bar is
readable and the harness choice matters. Every system is built for real; content is thin.
The slice run ends after the Legacy Monolith with "Merged to main!" (win) or `^C`.

## In scope

| Area | In scope (exact) |
|---|---|
| Harnesses | Terminal Purist, IDE Companion |
| System prompts | `senior`, `concise`, `step_by_step` |
| Tools (12) | `grep` `cat` `sed` `edit_file` `autocomplete` `lint` `read_file` `run_tests` `retry_with_backoff` `web_search` `summarize` `brute_force` (locked until unlocked) |
| Skills (8) | `unix_philosophy` `inline_suggestions` `grep_first` `lockfile` `summarizer` `long_context_training` `feedback_loop` `rubber_duck` |
| Memories (4) | `gitignore` `cache` `long_context` `keyboard_shortcuts` |
| Enemies | Typo, Context Drift, Rate Limit, Dependency Hell (+ Transitive Dep), Scope Creep, Unreachable Service |
| Elite | Yak Shave (+ 3 tasks, Side Quest) |
| Boss | Legacy Monolith (+ Undocumented Behavior) |
| Encounters | `p1e1`–`p1e5`, `p1h1`–`p1h5`, `p1x1`, `p1b` |
| Events (4) | `quick_tiny_change` `pasted_log` `underflow_answer` `green_locally` |
| Combat | Full sim: tick order, charge rates, pipes, targeting, damage formula, 6 statuses, traits Split/Grow/Outage/Blocked/Armor, Deadline |
| Breakpoints | POSIX, Refactor, Indexed, TDD |
| Context | Full variant A: baseline, outputs, noise, zones, auto and planned compaction, policy |
| Map | 7 rows + boss, all 7 node types, full generation rules |
| Economy | Credits, interest, rewards 1 of 3 with pity, shop with sale, reroll, sell, version bumps, Idle Cycle, Free Tier |
| Meta | Run history (last 100), AGENTS.md with **1** lesson line, one unlock (`brute_force`) |
| UX | Shell layout, all slice screens, combat log, speed 1x/2x/4x/skip, pause, tooltips with plain-English line and formula, tutorial fight, build panel with 6 s preview, run-end summary with one hint |
| Settings | Volume (master, SFX), reduced motion, CRT toggle, basic keys (`Space`, `1`–`4`, `L`, `B`, `Esc`) |
| Juice | Number pops, shake, hit-stop, typed text, zone flash, compaction moment, card flash, SFX via zzfx |
| Art | Crimson theme, ASCII portraits for 2 harnesses and all slice enemies |
| Persistence | Auto-save after every node, export/import save string, meta save |
| Tooling | Balance sim CLI (1000 bot runs per harness), seed replay CLI, golden logs, Playwright smoke |

## Slice-specific deviations

| Rule | Full game | M1 |
|---|---|---|
| Run length | 3 phases | Phase 1 only; boss win ends the run |
| `brute_force` unlock | Unlock tree (40 TD) | Unlocked by winning any Critical Bug once |
| Training Data | Earned and spent | Not shown |
| AGENTS.md capacity | 3 | 1 |
| Phase-1 boss win-rate target | 70–85% | 35–65% |
| Prune service | In shop | Absent |

## Out of scope (M2 or later)

Phases 2–3, Swarm Orchestrator and YOLO Mode, the other 24 tools, 16 skills, 12 memories
and 12 events, Copy-Paste Clone, unlock tree, lint rules, Endless, daily seed,
achievements, music, themes other than Crimson, codex, remappable keys, screen-reader
summaries, text-size setting, pseudo-locale (strings still go through `t()` from day one).

## Exit criteria

| # | Criterion | Measured by |
|---|---|---|
| 1 | Both harnesses win Phase 1 at 35–65% with the greedy bot | `tools/balance`, 1000 runs per harness, fixed seed range |
| 2 | No tool appears in > 40% of winning bot loadouts | balance report |
| 3 | 3 of 5 first-time testers explain the context bar after the tutorial without help | moderated playtest script; if failed, switch the bar to the chunked UI fallback and retest |
| 4 | Same seed + same actions give a byte-identical combat log | golden-log tests on 20 seeds in CI |
| 5 | Median normal-fight length 20–35 s at 1x; elite 30–45 s; boss 40–60 s | balance report |
| 6 | Save at any node, reload, continue: identical result to an uninterrupted run | replay-vs-snapshot test on 50 bot runs |
| 7 | `npm test`, `harness:lint`, type-check and Playwright smoke are green; coverage budgets (`coverage_sim_lines`, `coverage_sim_branches`, `coverage_total_lines`) are met | CI |
| 8 | A scripted Phase-1 run via the UI at skip speed finishes in < 60 s | Playwright smoke |
