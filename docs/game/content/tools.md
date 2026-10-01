---
title: Tool catalogue
summary: All 36 tools with tags, rarity, token weight, cooldown, output, pipe, target and v1/v2/v3 effect values; marks the 12 vertical-slice tools and unlock sources.
keywords: [content, tools, catalogue, cooldowns, versions, balance]
type: gdd
status: active
updated: 2026-10-01
related: [../systems/harness-loadout.md, ../systems/combat.md, ../systems/economy.md, skills.md, harnesses.md]
---

# Tool catalogue

## Contents
- Search
- Edit
- Test
- Shell
- Web
- Agent
- Special rules
- Flavour lines (M1 tools)

Columns: **Wt** token weight, **CD** cooldown ms, **Out** output tokens, **Pipe** ms to
the right neighbour, **M1** in the vertical slice. Effect values are v1/v2/v3. `dmg`
deals damage, `guard` gains Guardrails, `prime` buffs the next matching activation.
Unlock sources refer to [meta-progression](../systems/meta-progression.md); "base" is in
the pool from the first run. Every number is a tuning knob for the balance sim.

## Search

| Id | Tags | Rar | Wt | CD | Out | Pipe | Target | Effect v1/v2/v3 | Unlock | M1 |
|---|---|---|---|---|---|---|---|---|---|---|
| `grep` | Search, Shell | C | 3 | 3000 | 1 | 1000 | front | dmg 6/9/13 | base | yes |
| `cat` | Search, Shell | C | 2 | 2500 | 2 | 1000 | front | dmg 4/6/9 | base | yes |
| `read_file` | Search | C | 4 | 4000 | 6 | – | front | dmg 8/12/17; prime next [Edit] +30/45/60% | base | yes |
| `find` | Search, Shell | C | 2 | 3500 | 2 | 1000 | back | dmg 5/8/11 | base | |
| `ripgrep` | Search, Shell | R | 3 | 2000 | 1 | 1500 | front | dmg 7/10/14 | Search+ | |
| `semantic_search` | Search, Agent | U | 5 | 5000 | 4 | – | front | dmg 10/15/21; destroy all Decoys | Search+ | |

## Edit

| Id | Tags | Rar | Wt | CD | Out | Pipe | Target | Effect v1/v2/v3 | Unlock | M1 |
|---|---|---|---|---|---|---|---|---|---|---|
| `sed` | Edit, Shell | C | 4 | 4500 | 2 | 1000 | all | dmg 5/8/11 | base | yes |
| `edit_file` | Edit | C | 5 | 5000 | 3 | – | front | dmg 16/24/34 | base | yes |
| `autocomplete` | Edit | C | 2 | 1500 | 1 | – | front | dmg 3/4/6 | base | yes |
| `apply_patch` | Edit, Shell | C | 3 | 3500 | 2 | 1000 | front | dmg 8/12/17 | base | |
| `multi_edit` | Edit | U | 5 | 6000 | 4 | – | all | dmg 9/13/18 | base | |
| `refactor` | Edit | U | 6 | 7000 | 4 | – | front | dmg 24/36/50; ×2 vs armor | base | |

## Test

| Id | Tags | Rar | Wt | CD | Out | Pipe | Target | Effect v1/v2/v3 | Unlock | M1 |
|---|---|---|---|---|---|---|---|---|---|---|
| `lint` | Test | C | 3 | 3500 | 2 | – | self | guard 6/9/13 | base | yes |
| `run_tests` | Test | U | 6 | 6000 | 4 | – | all | dmg 8/12/17; guard 4/6/9 | base | yes |
| `write_test` | Test | C | 3 | 4000 | 2 | – | front | dmg 7/10/14 | base | |
| `type_check` | Test | C | 4 | 5000 | 2 | – | self | guard 10/15/21 | base | |
| `bisect` | Test, Shell | U | 4 | 6000 | 3 | 1000 | front | dmg 20/30/40% of target's current Severity (min 5, max 30/45/60) | Test+ | |
| `coverage_report` | Test | R | 5 | 8000 | 5 | – | all | dmg 5/7/10 × equipped [Test] tools | Test+ | |

## Shell

| Id | Tags | Rar | Wt | CD | Out | Pipe | Target | Effect v1/v2/v3 | Unlock | M1 |
|---|---|---|---|---|---|---|---|---|---|---|
| `retry_with_backoff` | Shell | U | 3 | 5000 | 1 | – | tool | tool with longest remaining charge: clear Throttle, Haste 2000/3000/4000 ms | base | yes |
| `brute_force` | Shell | R | 5 | 4500 | 4 | – | front | dmg 6/9/13 + 1/2/3 per `floor(S × 10 / W)` | Power tools | yes |
| `xargs` | Shell | U | 2 | 3000 | 1 | – | right tool | charge right neighbour 1500/2000/2500 ms | Power tools | |
| `kill_9` | Shell | U | 3 | 8000 | 1 | – | front | Stun 1500/2000/2500 ms; dmg 4/6/9 | Ops kit | |
| `timeout` | Shell | U | 2 | 6000 | 1 | – | front | Slow 3000/4000/5000 ms; reset Accelerate | base | |
| `stash_changes` | Shell | C | 2 | 6000 | 1 | – | self | guard 5/8/11; remove 3/4/6 noise | base | |
| `rm_rf` | Shell | R | 4 | 9000 | 2 | – | all | dmg 20/30/42; self-damage 6/5/4 | YOLO | |
| `force_push` | Shell | U | 3 | 4000 | 2 | – | front | dmg 14/21/30; self-damage 2 | YOLO | |

## Web

| Id | Tags | Rar | Wt | CD | Out | Pipe | Target | Effect v1/v2/v3 | Unlock | M1 |
|---|---|---|---|---|---|---|---|---|---|---|
| `web_search` | Web | U | 4 | 5000 | 5 | – | lowest | dmg 14/21/30 | base | yes |
| `web_fetch` | Web | C | 4 | 4000 | 6 | – | front | dmg 11/16/23 | base | |
| `curl` | Web, Shell | C | 2 | 2500 | 2 | 1000 | front | dmg 5/7/10 | base | |
| `read_docs` | Web, Search | U | 5 | 6000 | 7 | – | self | prime next 2 activations (any tool) +40/60/80% | Ops kit | |

## Agent

| Id | Tags | Rar | Wt | CD | Out | Pipe | Target | Effect v1/v2/v3 | Unlock | M1 |
|---|---|---|---|---|---|---|---|---|---|---|
| `summarize` | Agent | U | 4 | 7000 | 0 | – | self | remove 10/14/18 context (noise first); guard 3/5/7 | base | yes |
| `compact` | Agent | C | 3 | 10000 | 0 | – | self | planned compaction now (ignores policy and lockout); guard 6/9/13 | base | |
| `plan_mode` | Agent | C | 4 | 9000 | 2 | – | all tools | every other tool gains 1000/1500/2000 ms charge | base | |
| `spawn_subagent` | Agent | U | 6 | 6000 | 0 | – | summon | Sub-agent (below) hitting 5/7/10 | Swarm | |
| `code_review` | Agent, Test | U | 5 | 7000 | 4 | – | front | dmg 12/18/25; ×2 vs Guardrails and armor | base | |
| `ask_human` | Agent | R | 3 | 12000 | 3 | – | self | restore 10/15/20 Trust | Escalation | |

## Special rules

- **Sub-agent**: an allied, untargetable helper. Lives 6000 ms, hits `front` every
  1500 ms (first hit at 1500) for the tool's value through the damage formula, then
  adds a **report** of 4 tokens to `S` when it expires. Max 2 alive (Swarm trait: 3);
  summoning beyond the cap expires the oldest first. Sub-agents ignore Throttle; Stun on
  the agent pauses them.
- **Self-damage** hits Guardrails first and can end the run.
- `×2 vs armor/Guardrails`: the amount is doubled only for the part absorbed by armor or
  enemy Guardrails; the remainder after they break uses the normal amount (rounded down).
- `brute_force` counts signal only, e.g. `W` 60, `S` 45: `floor(450/60) = 7` -> v1 deals
  `6 + 7 = 13` base.
- Disabled tools (`no-internet`, Outage) still charge and add output, but do nothing.

## Flavour lines (M1 tools)

`grep` "Finds the needle, ignores the haystack." · `cat` "Prints everything. Everything."
· `sed` "Fixes it in every file at once. Hopefully." · `edit_file` "Surgical. Slow."
· `autocomplete` "Tab, tab, tab." · `lint` "Catches it before the human does."
· `read_file` "Reads the whole file before touching it. Suspiciously diligent."
· `run_tests` "Green is a feeling." · `retry_with_backoff` "Wait 1 s, 2 s, 4 s…"
· `web_search` "Somebody must have had this problem." · `summarize` "TL;DR."
· `brute_force` "More context, more force."
