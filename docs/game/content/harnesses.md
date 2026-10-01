---
title: Harnesses and system prompts
summary: The four harnesses (Terminal Purist, IDE Companion, Swarm Orchestrator, YOLO Mode) with exact stats, traits, starters and baselines, plus the six system prompts.
keywords: [content, harnesses, system-prompts, starters, traits, classes]
type: gdd
status: active
updated: 2026-10-01
related: [../systems/harness-loadout.md, tools.md, skills.md, ../systems/context.md, ../systems/meta-progression.md]
---

# Harnesses and system prompts

Names are parodies; no real product is referenced. "IDE Copilot" from the research was
renamed **IDE Companion** for that reason.

## Harness stats

| Field | Terminal Purist | IDE Companion | Swarm Orchestrator | YOLO Mode |
|---|---|---|---|---|
| Fantasy | CLI agent, pipes | Pair programmer in an editor | Multi-agent lead | Skips every permission prompt |
| Window `W` | 60 | 100 | 160 | 100 |
| Speed (rate %) | 110 | 100 | 85 | 115 |
| Accuracy | high (Cold −15%) | normal (−25%) | normal (−25%) | low (−35%) |
| Max Trust | 80 | 100 | 90 | 70 |
| Base weight | 4 (`~/.bashrc`) | 12 (workspace index) | 20 (team charter) | 6 (`.yolorc`) |
| Slots tools / skills / memory | 6 / 3 / 2 | 5 / 3 / 2 | 5 / 4 / 2 | 6 / 3 / 2 |
| Starter tools (order) | `grep`, `cat`, `sed` | `autocomplete`, `edit_file`, `lint` | `grep`, `spawn_subagent`, `run_tests` | `cat`, `force_push`, `rm_rf` |
| Starter skill | Unix Philosophy | Inline Suggestions | Delegation | Skip Permissions |
| Baseline before prompt | 16 | 25 | 38 | 18 |
| Unlock | start | start | 150 TD, reach Phase 2 | 250 TD, Shipped once |
| Milestone | M1 | M1 | M2 | M2 |

## Traits (built in, cannot be removed)

| Harness | Trait | Exact rule |
|---|---|---|
| Terminal Purist | Muscle Memory | Tools with weight ≤ 3 get charge rate `+10` |
| IDE Companion | Undo Stack | Once per fight, when damage leaves Trust below 30% of max, gain 15 Guardrails |
| Swarm Orchestrator | Fan-out | Sub-agent cap 3 (instead of 2); each sub-agent report adds 2 fewer tokens |
| YOLO Mode | No Confirmations | All tool damage `+25%`; every tool activation deals 1 self-damage; Sandbox-family enemies deal `+50%` to you |

## Identity and expected play

- **Terminal Purist**: small window, fast light tools, pipes. Lives in Focused by using
  "Be concise" and planned compaction. Weak to burst damage (no Guardrails at start).
  Typical starter single-target DPS ≈ 9 at Focused, with AoE from `sed`.
- **IDE Companion**: big window, steady Guardrails, slow climb into Rot. Forgiving.
  Starter DPS ≈ 7.5, Guardrails ≈ 2 per second.
- **Swarm Orchestrator**: huge window but heavy baseline, slow speed; damage comes from
  sub-agents whose reports flood the context. Rewards compaction tools.
- **YOLO Mode**: fastest and hardest-hitting, low Trust, self-damage; a high-skill
  harness that must win fast.

## System prompts

One is chosen at run start from 3 offered (the unlocked pool; the 3 starters while
nothing else is unlocked). Weight counts toward the baseline.

| Id | Prompt text | Wt | Exact effect | Unlock | M1 |
|---|---|---|---|---|---|
| `senior` | "You are a senior engineer." | 8 | All tool damage `+10%`; window `−10` | start | yes |
| `concise` | "Be concise." | 4 | All tool outputs `−1` (min 0) | start | yes |
| `step_by_step` | "Think step by step." | 10 | The first tool activation each fight resolves twice (second copy adds output too); all tools charge rate `−5` | start | yes |
| `tenx` | "You are a 10x engineer." | 6 | All tool damage `+20%`; all tool outputs `+1` | Prompt library I | |
| `clarify` | "Ask clarifying questions first." | 8 | First 4000 ms of each fight: tools charge rate `−50`; afterwards tool effects `+15%` | Prompt library I | |
| `json_only` | "Respond in JSON only." | 5 | Every positive tool output becomes exactly 2 before other modifiers | Prompt library II | |

## Starting baselines (prompt included)

| Harness | senior | concise | step_by_step |
|---|---|---|---|
| Terminal Purist | 24 / 50 (48%) | 20 / 60 (33%) | 26 / 60 (43%) |
| IDE Companion | 33 / 90 (37%) | 29 / 100 (29%) | 35 / 100 (35%) |
| Swarm Orchestrator | 46 / 150 (31%) | 42 / 160 (26%) | 48 / 160 (30%) |
| YOLO Mode | 26 / 90 (29%) | 22 / 100 (22%, Cold) | 28 / 100 (28%) |

Every starter combination except YOLO + concise starts Focused. YOLO + concise starting
Cold is intentional: low accuracy and lean outputs is a bad pairing the player can
discover.

## Harness select screen copy

Each harness card shows: the config block, one line of fantasy, a difficulty tag
(Purist: Medium, Companion: Easy, Swarm: Hard, YOLO: Expert), the trait line, and
win count. Locked harnesses show the unlock condition.
