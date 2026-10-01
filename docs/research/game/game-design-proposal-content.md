---
title: Loop Engineer design proposal - harnesses and enemies
summary: Proposed harness classes (the character choice), the enemy roster and a per-run decision density check for Loop Engineer.
keywords: [game-design, harness, enemies, classes, decisions]
type: research
status: active
updated: 2026-10-01
related: [game-design-proposal.md, game-design-references.md]
---

# Loop Engineer design proposal - harnesses and enemies

Part of [game-design-proposal.md](game-design-proposal.md).

## 6. Harness = character class

A harness bundles five things. In the UI it is a "config file" card:

```
harness: terminal-purist
model:   { window: 60, speed: 1.2, accuracy: high }   # stats
tools:   [grep, sed, run_tests]                        # actives (cooldowns)
skills:  [Unix Philosophy]                             # passives
memory:  1 slot                                        # relic slots
system_prompt: choose 1 of 3 at run start              # run-wide modifier
```

- **Model** sets stats: window size, speed (cooldown multiplier), accuracy (resistance to
  Cold-zone misses and Hallucination), and starting Trust.
- **Tools** (actives) fire on cooldowns. They carry tags `[Search] [Edit] [Test] [Shell]
  [Web] [Agent]`. Versions go **v1 -> v2 -> v3**: buying a duplicate bumps the
  version, a *major* release.
- **Skills** (passives) are trigger rules, for example "When a [Search] tool fires,
  the next [Edit] deals +50%". Tag breakpoints: 3 [Test] = *TDD* (tests restore Trust).
- **Pipes** (adjacency): the slot order matters. `A | B` means A's activation charges B by
  1 s. This is the Backpack Battles adjacency idea in a 1D, testable form.
- **Memory** items are relics that persist for the run (and AGENTS.md across runs).
- **System prompt**: pick 1 of 3 at the start. Examples: *"You are a senior engineer"*
  (+10% damage, -10 window), *"Be concise"* (outputs -1), *"Think step by step"*
  (first tool each fight fires twice, cooldowns +5%).

Slice harnesses (2), plus 2 later:

| Harness | Fantasy | Window / speed | Identity |
|---|---|---|---|
| **Terminal Purist** | CLI agent | 60 / fast | Lean tokens, chains of pipes, lives in the Focused zone |
| **IDE Copilot** | Balanced pair programmer | 100 / normal | Guardrails, autocomplete chip damage, forgiving |
| *Swarm Orchestrator* (later) | Multi-agent | 160 / slow | Summons sub-agents whose reports cost context |
| *YOLO Mode* (later) | `--dangerously-skip-permissions` | 100 / fast | Huge damage, self-damage, sandbox enemies hit harder |

## 7. Enemy roster

Each enemy teaches **one** mechanic. Its intent icon always shows what's coming next.

| Enemy | Phase | Mechanic | Counterplay |
|---|---|---|---|
| **Context Drift** | 1 | Each hit injects 6 noise | `.gitignore`, planned compaction |
| **Typo** | 1 | Weak, fast, comes in swarms of 3 | Chip/AoE tools (tutorial enemy) |
| **Rate Limit (429)** | 1 | Every 6 s **throttles** (freezes) your fastest tool for 3 s | Diverse cooldowns, `Retry with Backoff` |
| **Dependency Hell** | 1 | On death splits into 2 "transitive deps" (half Severity) | AoE, `Lockfile` skill |
| **Scope Creep** | 1–2 | Gains +5% max Severity every 3 s | Burst damage, kill it first |
| **Unreachable Service (503)** | 1–2 | While alive, [Web] tools time out (no effect, still cost tokens) | Kill priority, `Cache` memory |
| **Flaky Test** | 2 | Alternates Pass/Fail every 3 s and is only damageable while failing | Fast tools, timing via order |
| **Merge Conflict** | 2 | Two halves (Ours/Theirs) that fully heal each other unless both die within 3 s | Cleave, balanced damage |
| **Hallucination** | 2 | Spawns 2 decoys. Hits on decoys deal nothing (accuracy reveals them) | High-accuracy model, [Search] tools |
| **Prompt Injection** | 2–3 | "Ignore previous instructions": your next tool targets the wrong enemy, plus 4 noise | `Sandbox` / `Guardrails` skill |
| **Infinite Loop** | 3 | Repeats its last action 10% faster each time until hit by ≥X damage at once | Burst, `Timeout` tool |
| **Memory Leak** | 3 | Your context baseline +2 every 4 s (permanent within the fight) | Kill fast, compaction |
| **Permission Denied** | 3 | Blocks [Shell] tools until a 4 s "approval" passes | Non-shell builds |
| **Yak Shave** (elite) | 1 | Can't be damaged until you defeat the 3 tasks in front of it | AoE, order |
| **Stack Trace 4000 Lines** (elite) | 2 | Dumps 30 noise once, then hits hard while you're in Rot | Compaction policy |

**Bosses** (multi-phase, each a test of the act's theme):
- **Legacy Monolith** (Implement): huge Severity, 3 layers of **Tech Debt** armor (each
  must be broken by [Edit] tools). Spawns *Undocumented Behavior* adds. Tests sustained damage.
- **The Flaky CI Pipeline** (Test): stages Lint -> Build -> Test, each a phase with its own
  rules. Fail a stage timer and it restarts at full stage HP. Tests consistency.
- **Production Incident** (Deploy): Sev-1 at 3 AM. An SLA timer drains Trust each
  second, pager spikes inject noise, and you resolve "symptoms" to expose the root cause. Tests burst and context control.

**Events** (text with 2–3 choices, satire + trade-off):
- *"Quick tiny change"* (PM): +25 credits, next 3 fights include Scope Creep.
- *"User pastes a 4000-line log"*: upgrade a [Search] tool, start the next fight at +30 context.
- *"Stack Overflow answer from 2011"*: gain a random tool. 50% chance it's deprecated (v0).
- *"Rewrite it in Rust?"*: lose 1 tool, gain a v2 copy of another.
- *"The tests are green locally"*: heal 20 Trust or gain 1 memory slot for 15 credits.

## 8. Moment decisions per run (density check)

A ~8-node phase gives about 8 route choices, ~6 reward picks, 1–2 shops (5–10
buy/sell/reroll decisions), 1–2 events, about 6 loadout tweaks, and 1 system prompt
pick. That is roughly 30 meaningful decisions per 10 minutes, about one every 20 s. That meets the target.
