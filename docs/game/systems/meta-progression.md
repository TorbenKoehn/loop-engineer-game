---
title: Meta-progression
summary: Training Data earning, the sidegrade-only unlock tree with costs and prerequisites, persistent AGENTS.md lessons, run history and daily seed.
keywords: [meta-progression, unlocks, training-data, agents-md, lessons, daily-seed]
type: gdd
status: active
updated: 2026-10-01
related: [endless-ascension.md, economy.md, ../content/memories-lessons.md, ../content/harnesses.md, ../ux/achievements-stats.md]
---

# Meta-progression

Rule: meta progress adds **options**, never raw power. Unlocking a tool adds it to the
pool, which dilutes offers; the player gets stronger only by knowing more. The single
exception is AGENTS.md lessons, which are small, capped, and cost context.

## Training Data (TD)

Earned at run end (win, loss or abandon), shown as an itemised receipt.

| Source | TD |
|---|---|
| Each node cleared | 2 |
| Each Critical Bug won | +8 |
| Each boss won | +20 |
| Shipped | +30 |
| Each Endless loop completed | +40 |
| First win with a harness | +25 (once per harness) |

Multiplier: `× (100 + 10 × lintPoints) / 100` (floor). A typical first loss earns 15–30,
a full win about 120. TD never decays; there is no cap.

## Unlock tree

Four branches. A node needs its listed prerequisite and the TD cost. Costs are tuning
knobs; total ≈ 2900 TD ≈ 25–35 runs.

| Branch | Node | Cost | Requires | Adds |
|---|---|---|---|---|
| Harness | Swarm Orchestrator | 150 | reach Phase 2 once | harness + `spawn_subagent` + Delegation |
| Harness | YOLO Mode | 250 | Shipped once | harness + `rm_rf`, `force_push` + Skip Permissions |
| Tools | Power tools | 40 | — | `brute_force`, `xargs` |
| Tools | Search+ | 60 | Power tools | `ripgrep`, `semantic_search` |
| Tools | Test+ | 80 | Power tools | `bisect`, `coverage_report` |
| Tools | Ops kit | 100 | Search+ or Test+ | `kill_9`, `read_docs` |
| Tools | Escalation | 120 | Ops kit | `ask_human` |
| Skills | Loop theory | 60 | — | Feedback Loop, Batching |
| Skills | Performance | 90 | Loop theory | Hot Path, Speculative Execution |
| Skills | Craft | 120 | Performance | Context Engineering, Pair Programming |
| Memories | Desk setup | 50 | — | Second Monitor, Monorepo Map |
| Memories | Ops memories | 90 | Desk setup | Runbook, Feature Flag |
| Memories | Disaster recovery | 140 | Ops memories | Rollback Plan, Golden Dataset |
| Prompts | Prompt library I | 70 | — | system prompts "10x engineer", "Ask clarifying questions" |
| Prompts | Prompt library II | 130 | Prompt library I | system prompt "Respond in JSON only" |
| Events | Office politics | 40 | — | 4 extra events (flagged `unlock` in [events](../content/events.md)) |
| Cosmetic | Themes | 30 each | — | Amber Terminal, Phosphor, Paper (light) |
| Cosmetic | Agent glyph sets | 30 each | — | 3 alternative ASCII agent portraits |
| Mode | Endless loop | 0 | Shipped once | Endless mode |
| Mode | Lint rules | 0 | Shipped once | ascension menu |
| Mode | Daily seed | 0 | complete 3 runs | daily run |

Accessibility options (high contrast, text size, reduced motion) are **never** locked.

## AGENTS.md lessons

The in-game mirror of the real harness: a file of lessons the agent keeps across runs.

- After every run except abandon, offer **3 lessons**: (1) the family of the enemy that
  dealt the most damage this run, (2) the family of the enemy (or Deadline) that ended
  the run, (3) a random other family seen this run. Duplicates fall back to random
  families. Each family has an offensive and a defensive lesson; one of the two is chosen
  by `fork(runSeed, 'lessons')`.
- Capacity: **3 lines** (M1: 1 line). To add a lesson when full, replace one; or skip.
- Each lesson costs **1 token** of baseline in every fight (always equipped).
- Lessons are listed in [memories-lessons](../content/memories-lessons.md).
- The AGENTS.md screen renders as a real Markdown file with frontmatter, as a wink to the
  harness this game was built with.

## Run history

Stored per run (last 100 runs): seed, harness, system prompt, lint points, result, phase
reached, cause of death, duration, final loadout, damage by source, time per zone,
compactions, TD earned, save string for replay. Used by the history screen, stats and
achievements ([achievements and stats](../ux/achievements-stats.md)).

## Daily seed

- Seed = `daily-YYYY-MM-DD` (local date). Harness and system prompt are fixed by the
  seed (rolled from the unlocked pool at time of first unlock: all players with the same
  unlocks get the same run). Lint rules: a fixed set of 4 points from the seed.
- One scored attempt per day; later attempts are practice. Local leaderboard by score:
  `phases cleared × 1000 + Trust left × 5 + Credits left − minutes × 10`.
