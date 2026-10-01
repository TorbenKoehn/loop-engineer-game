---
title: Memories and AGENTS.md lessons
summary: All 16 run-scoped Memory items (relics) with weight and exact effect, plus the 10 persistent AGENTS.md lessons by enemy family.
keywords: [content, memories, relics, lessons, agents-md, families]
type: gdd
status: active
updated: 2026-10-01
related: [skills.md, tools.md, ../systems/meta-progression.md, ../systems/context.md]
---

# Memories and AGENTS.md lessons

## Memories

Memories are unique, run-scoped passives in memory slots (2 by default). Sources: Free
Tier nodes, elite rewards, shop slot 5, events. **M1** marks the slice pool.

| Id | Name | Rar | Wt | Exact effect | Unlock | M1 |
|---|---|---|---|---|---|---|
| `gitignore` | .gitignore | C | 1 | Block the first 12 noise each fight | base | yes |
| `cache` | Cache | U | 2 | [Web] tools ignore Outage; your first [Web] activation each fight gets `+100%` | base | yes |
| `long_context` | Long Context | R | 0 | Window `+40`; all tools charge rate `−10` | base | yes |
| `keyboard_shortcuts` | Keyboard Shortcuts | C | 1 | All tools charge rate `+5` | base | yes |
| `ci_badge` | CI Badge | C | 1 | Start each fight with 8 Guardrails | base | |
| `coffee_mug` | Coffee Mug | C | 0 | Idle Cycle heals 45% instead of 30% | base | |
| `swag_hoodie` | Swag Hoodie | C | 0 | `+2` Credits per fight won | base | |
| `underflow_account` | Stack Underflow Account | C | 1 | Shop rerolls cost 1 less (min 1) | base | |
| `error_budget` | Error Budget | U | 1 | Deadline damage to you is halved (floor) | base | |
| `oncall_pager` | On-call Pager | U | 1 | At fight start, Haste all tools 1500 ms | base | |
| `second_monitor` | Second Monitor | U | 2 | `+1` tool slot (unequips the extra tool to stash if sold) | Desk setup | |
| `monorepo_map` | Monorepo Map | U | 3 | Start each fight with `+8` signal; [Search] tools `+20%` | Desk setup | |
| `runbook` | Runbook | U | 2 | Compaction stuns last 50% shorter | Ops memories | |
| `feature_flag` | Feature Flag | R | 2 | Once per fight, ignore the first enemy Throttle, Stun or Redirect aimed at you | Ops memories | |
| `rollback_plan` | Rollback Plan | R | 2 | Once per run, when Trust would drop to 0, set it to 25% of max instead; then this memory is deleted | Disaster recovery | |
| `golden_dataset` | Golden Dataset | R | 3 | Your first 3 tool activations each fight get `+50%` | Disaster recovery | |

Rules:

- Window changes (Long Context, system prompts, lint rules) apply at fight start; the
  build-phase 80% baseline check uses the modified window.
- "Once per run" state is part of the run state and survives save/load.
- Memories with weight 0 are deliberately free: their cost is the slot.

## AGENTS.md lessons

Persistent across runs (meta save). Capacity 3 (M1: 1). Each lesson costs **1 token**
of baseline. Lesson choice rules: [meta-progression](../systems/meta-progression.md).

### Enemy families

| Family | Members |
|---|---|
| Bugs | Typo, Copy-Paste Clone, Flaky Test, Off-by-One, Heisenbug, The Flaky CI Pipeline |
| Context | Context Drift, Hallucination, Prompt Injection, Stack Trace, Memory Leak |
| Infra | Rate Limit, Unreachable Service, Cold Start, Thundering Herd, It's Always DNS, Cascading Failure, Production Incident |
| Process | Dependency Hell, Scope Creep, Yak Shave, Merge Conflict, Code Review Gatekeeper, Friday Deploy, Legacy Monolith, Deadline |
| Sandbox | Infinite Loop, Permission Denied |

Spawned adds belong to their parent's family.

### Lessons

| Id | Family | Line written to AGENTS.md | Effect |
|---|---|---|---|
| `bugs_off` | Bugs | "Read the diff before you commit." | `+15%` damage vs Bugs |
| `bugs_def` | Bugs | "Reproduce before you fix." | `−20%` damage taken from Bugs (min 1) |
| `context_off` | Context | "Pin the goal in line one." | `+15%` damage vs Context |
| `context_def` | Context | "Re-read the task when lost." | Noise from Context enemies `−25%` (floor) |
| `infra_off` | Infra | "Have a fallback for every service." | `+15%` damage vs Infra |
| `infra_def` | Infra | "Always check rate limits." | Enemy Throttles on you last `−1000 ms` (min 50) |
| `process_off` | Process | "Write down the scope." | `+15%` damage vs Process |
| `process_def` | Process | "Say no to quick tiny changes." | `−20%` damage taken from Process (min 1) |
| `sandbox_off` | Sandbox | "Request permissions up front." | `+15%` damage vs Sandbox |
| `sandbox_def` | Sandbox | "Ask before running rm." | `−20%` damage taken from Sandbox (min 1) |

Deadline damage is not affected by Process lessons (Deadline is a family only for the
"what ended the run" lesson offer).
