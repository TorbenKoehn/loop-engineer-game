---
title: Achievements and run statistics
summary: The 30 local achievements with exact unlock conditions, per-run statistics and lifetime statistics, all derived from run history and event logs.
keywords: [achievements, statistics, run-history, meta, retention]
type: gdd
status: active
updated: 2026-10-01
related: [../systems/meta-progression.md, ../systems/endless-ascension.md, onboarding.md, ../../architecture/save.md]
---

# Achievements and run statistics

Achievements are local (meta save), cosmetic only (no power, no TD) and checked at run
end from run history and the run's event logs. Each has an id, a name, a one-line
condition and a parody-safe joke. Hidden achievements show `???` until earned.

## Achievements

| Id | Name | Condition |
|---|---|---|
| `first_fight` | Hello, World | Win your first fight |
| `first_phase` | Merged | Beat the Legacy Monolith |
| `first_ship` | Shipped! | Beat Production Incident |
| `ship_purist` | Pipe Dream | Ship with Terminal Purist |
| `ship_companion` | Pair Programmed | Ship with IDE Companion |
| `ship_swarm` | Management Material | Ship with Swarm Orchestrator |
| `ship_yolo` | Works on My Machine | Ship with YOLO Mode |
| `lint_5` | Strict Mode | Ship at lint level ≥ 5 |
| `lint_10` | Pedantic | Ship at lint level ≥ 10 |
| `lint_15` | Zero Warnings | Ship at lint level ≥ 15 |
| `lint_23` | Lint Is Life | Ship with all lint rules on |
| `endless_3` | It's a Loop | Complete 3 Endless loops in one run |
| `never_compact` | Unbounded | Win a boss fight with policy `never` and no compaction |
| `always_focused` | In the Zone | Win a fight spending 100% of its time Focused |
| `cold_win` | Vibe Coding | Win a fight spending 100% of its time Cold |
| `big_hit` | Force Push | Deal ≥ 150 damage in a single hit |
| `pipe_chain` | Pipeline | Trigger a chain of 5 pipes within 1000 ms |
| `v3_three` | Major Release | Own three v3 tools at once |
| `no_guardrails` | No Seatbelt | Ship without ever gaining Guardrails |
| `low_trust` | Hanging by a Thread | Win a boss fight with 1 Trust left |
| `full_trust` | Spotless | Beat a boss without losing Trust |
| `rich` | Venture Funded | Hold 150 Credits at once |
| `frugal` | Free Tier Hero | Ship without buying anything |
| `yak_fast` | Clean Shave | Beat Yak Shave in under 20 s |
| `flaky_first` | Green on First Try | Beat the Flaky CI Pipeline with no stage re-run |
| `incident_fast` | Mean Time to Resolve | Beat Production Incident in under 40 s |
| `lessons_3` | Well Documented | Fill AGENTS.md with 3 lessons |
| `unlock_all` | Full Stack | Unlock every unlock-tree node |
| `daily_7` | Standup Regular | Complete 7 daily seeds |
| `hidden_ctrlc` | ^C (hidden) | Lose with exactly 0 Credits and 0 Trust on the same tick as the Deadline starts |

Earning one shows a toast in the status bar (`✓ Achievement: Merged`), no modal.

## Per-run statistics (run summary and history)

| Stat | Source |
|---|---|
| Result, phase reached, duration (wall clock and sim time) | run state |
| Harness, system prompt, lint rules, seed | run state |
| Final loadout with versions | run state |
| Damage dealt by tool, damage taken by enemy family | event logs |
| Time per zone (Cold, Focused, Rot), compactions (auto/planned) | event logs |
| Biggest hit, longest pipe chain | event logs |
| Credits earned / spent / interest, items bought, rerolls | run actions |
| Trust lost per fight, healing received | event logs |
| TD earned (receipt) | run end |

## Lifetime statistics

Runs, wins, win rate per harness, best lint level shipped, fastest Ship, most loops,
total enemies resolved by type, favourite tool (most activations), total tokens output,
total compactions, total Deadline seconds survived. Shown on the History screen.

## Implementation notes

- Every stat is derivable from the save string (seed + actions) by replay, so a stats
  bug fix can recompute history.
- Achievement checks are pure functions `(RunSummary, MetaState) -> AchievementId[]`
  with a unit test each.
- No external platform integration in the browser build; ids are stable so a desktop
  wrapper could map them later.
