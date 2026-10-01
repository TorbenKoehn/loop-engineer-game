---
title: Skill catalogue
summary: All 24 skills (passive trigger rules) with rarity, token weight, exact effect and unlock source; marks the 8 vertical-slice skills.
keywords: [content, skills, passives, triggers, catalogue]
type: gdd
status: active
updated: 2026-10-01
related: [tools.md, harnesses.md, memories-lessons.md, ../systems/harness-loadout.md, ../../architecture/content-model.md]
---

# Skill catalogue

Skills are unique passive rules. Each costs token weight in the baseline. Rarity sets the
shop price ([economy](../systems/economy.md)). "Base" skills are in the pool from the first
run; others come from the unlock tree. **M1** marks the vertical slice pool.

## Vertical slice skills (M1)

| Id | Name | Rar | Wt | Exact effect | Unlock |
|---|---|---|---|---|---|
| `unix_philosophy` | Unix Philosophy | C | 3 | Tools that were piped since their last activation get `+30%` | TP starter |
| `inline_suggestions` | Inline Suggestions | C | 3 | [Edit] tools deal `+2` flat damage | IDE starter |
| `grep_first` | Grep First | U | 3 | When a [Search] tool fires, `prime([Edit], 50)` | base |
| `lockfile` | Lockfile | C | 2 | Throttle and Slow applied to your tools last 50% shorter | base |
| `summarizer` | Summarizer | U | 3 | On any compaction: gain 8 Guardrails and Haste your leftmost tool 2000 ms | base |
| `long_context_training` | Long-Context Training | R | 4 | Rot no longer slows your tools (noise is still doubled) | base |
| `feedback_loop` | Feedback Loop | R | 4 | Your rightmost tool pipes 1000 ms into your leftmost tool | Loop theory (M1: in pool) |
| `rubber_duck` | Rubber Duck | C | 2 | Start each fight with 10 Guardrails | base |

## Full-game skills (M2)

| Id | Name | Rar | Wt | Exact effect | Unlock |
|---|---|---|---|---|---|
| `defensive_coding` | Defensive Coding | C | 2 | Whenever a tool gives you Guardrails, gain `+2` more | base |
| `test_pyramid` | Test Pyramid | U | 3 | [Test] tools deal `+1` flat damage per equipped [Test] tool | base |
| `fail_fast` | Fail Fast | C | 2 | Your leftmost tool starts each fight fully charged | base |
| `early_return` | Early Return | C | 2 | Tools with `cooldownMs ≤ 3000` deal `+2` flat damage | base |
| `batching` | Batching | U | 3 | Every 4th tool activation in a fight applies its effects twice (output once) | Loop theory |
| `prompt_caching` | Prompt Caching | U | 3 | If the previous activation was the same tool, this one outputs 0 tokens | base |
| `garbage_collector` | Garbage Collector | U | 3 | Every 5000 ms, remove 4 noise | base |
| `sandbox` | Sandbox | U | 3 | Ignore Redirect; enemies cannot Throttle your [Shell] tools | base |
| `circuit_breaker` | Circuit Breaker | U | 3 | When one enemy hit deals ≥ 10 (before Guardrails), gain 8 Guardrails; once per 3000 ms | base |
| `hot_path` | Hot Path | R | 4 | Your tool with the lowest base cooldown (ties: leftmost) gets charge rate `+30` | Performance |
| `speculative_execution` | Speculative Execution | R | 4 | When any tool fires, the tool to its right gains 300 ms charge | Performance |
| `context_engineering` | Context Engineering | R | 5 | Focused bonus is `+35%` instead of `+20%` | Craft |
| `pair_programming` | Pair Programming | U | 3 | A tool next to a tool sharing a tag gets `+15%` | Craft |
| `retrospective` | Retrospective | U | 2 | After each won fight, restore 4 Trust | base |
| `delegation` | Delegation | C | 3 | Sub-agents live `+3000 ms` | Swarm starter |
| `skip_permissions` | Skip Permissions | C | 3 | [Shell] tools deal `+3` flat damage; you take `+1` from every enemy hit | YOLO starter |

Totals: 24 skills, 16 base (including 7 of the M1 set), 8 unlockable.

## Trigger semantics

- "When X fires" runs **after** X's effects and output, before the compaction check.
- Flat damage adds before percentages (see the damage formula in
  [combat](../systems/combat.md)).
- "Start each fight" effects apply at `t = 0` in skill slot order, before the first tick.
- Skills never trigger themselves recursively: a skill effect that fires a tool (none in
  this catalogue) would be queued to the next tick.
- Every skill has a generated plain-English line, e.g. Grep First: "After a Search tool
  fires, your next Edit tool hits 50% harder."

## Synergy map (design reference)

| Archetype | Core pieces | Harness fit |
|---|---|---|
| Pipe chain | `grep` `cat` `sed` `xargs`, Unix Philosophy, Feedback Loop, POSIX | Terminal Purist |
| Guardrail wall | `lint` `type_check` `run_tests`, Defensive Coding, Rubber Duck, Circuit Breaker | IDE Companion |
| Rot rider | `brute_force` `read_file` `web_fetch`, Long-Context Training, Long Context | IDE Companion, Swarm |
| Compaction tempo | `compact` `summarize`, Summarizer, Runbook | any |
| Swarm | `spawn_subagent` `plan_mode`, Delegation, Orchestration | Swarm Orchestrator |
| Glass cannon | `force_push` `rm_rf`, Skip Permissions, Golden Dataset | YOLO Mode |

The balance sim reports win rate per archetype; each should land within ±10 points of the
mean ([testing](../../architecture/testing.md)).
