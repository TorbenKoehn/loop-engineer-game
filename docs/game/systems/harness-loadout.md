---
title: Harness and loadout
summary: What a harness bundles (model stats, tools, skills, memories, system prompt, trait), slots and stash, tool versions v1-v3, tag breakpoints, pipes and build-phase actions.
keywords: [harness, loadout, tools, skills, memory, system-prompt, versions, breakpoints]
type: gdd
status: active
updated: 2026-10-01
related: [combat.md, context.md, economy.md, ../content/harnesses.md, ../content/tools.md, ../content/skills.md]
---

# Harness and loadout

## Contents
- Model stats
- Item kinds
- Versions
- Slots and stash
- Tag breakpoints
- System prompts
- Build phase

A harness is the character class. In the UI it is a "config file" card:

```yaml
harness: terminal-purist
model:   { window: 60, speed: 110, accuracy: high, trust: 80 }
base_weight: 4            # ~/.bashrc, always in context
slots:   { tools: 6, skills: 3, memory: 2, stash: 4 }
tools:   [grep, cat, sed]
skills:  [unix-philosophy]
trait:   muscle-memory
system_prompt: choose 1 of 3 at run start
```

Concrete harnesses: [content/harnesses](../content/harnesses.md).

## Model stats

| Stat | Meaning | Range |
|---|---|---|
| `window` | Context window `W` in tokens | 60–160 |
| `speed` | Base charge rate in % (100 = normal) | 85–115 |
| `accuracy` | `high` / `normal` / `low`: Cold penalty 15 / 25 / 35%, decoy skipping | |
| `trust` | Max Trust at run start | 70–100 |
| `baseWeight` | Fixed tokens always in the baseline | 4–20 |

## Item kinds

| Kind | Fires? | Has versions | Unique | Token weight | Where |
|---|---|---|---|---|---|
| Tool | yes, on cooldown | v1 -> v2 -> v3 | no (duplicates merge) | 1–6 | tool slots, in order |
| Skill | no, trigger rules | no | yes | 2–5 | skill slots |
| Memory | no, passive or once | no | yes | 0–4 | memory slots |
| Lesson | no, passive | no | yes | 1 | AGENTS.md (meta) |

Tool fields: `id`, `name`, `tags` (1–2 of `Search Edit Test Shell Web Agent`), `rarity`
(`common uncommon rare`), `weight`, `cooldownMs`, `output`, `pipe` (ms, optional),
`target`, `effects` with v1/v2/v3 values. Weight, cooldown, output and pipe never change
with the version; only effect values do.

## Versions

- Every tool starts at **v1**. Max **v3**.
- Buying or receiving a tool you already own merges it into the owned copy: +1 version.
  An owned v3 tool is excluded from offers.
- Idle Cycle "upgrade" gives +1 version to a chosen tool.
- Effect values: v2 ≈ v1 × 1.5, v3 ≈ v1 × 2.1 (floor). Content lists exact numbers.
- Sell value: `floor(basePrice × version / 2)`.

## Slots and stash

- Tool slots: 5–6 by harness. Order matters (left fires first on ties; pipes go right).
- Skill slots: 3 (Swarm Orchestrator 4). Memory slots: 2 (+1 from some events/memories).
- **Stash**: 4 slots for any unequipped item. Stashed items cost no tokens.
- If an item is gained with no free slot and no free stash, the player must discard or
  sell (at a shop) one item before continuing. The "gain" screen offers discard.

## Tag breakpoints

Counted over **equipped tools** (a tool with two tags counts for both).

| Breakpoint | Count | Effect |
|---|---|---|
| POSIX | 3 [Shell] | All pipes `+500 ms` |
| Refactor | 3 [Edit] | [Edit] tools `+15%` |
| Indexed | 3 [Search] | [Search] tools output `−1` |
| TDD | 2 [Test] | When a [Test] tool fires, restore 2 Trust |
| Always Online | 2 [Web] | [Web] tools `+20%` and ignore the first Outage each fight |
| Orchestration | 2 [Agent] | [Agent] tools charge rate `+15` |

Breakpoints show as chips in the build panel with progress (`Shell 2/3`).

## System prompts

Chosen once at run start: 1 of 3 offered from the unlocked pool (the 3 starters until more
are unlocked). The system prompt is a weighted item in the baseline and cannot be changed
during the run, except by the event "Prompt engineering workshop". List in
[content/harnesses](../content/harnesses.md).

## Build phase

Available on the map and at every non-fight node. All actions are run-reducer actions and
free of charge:

| Action | Rule |
|---|---|
| Move tool | Reorder within tool slots |
| Equip / unequip | Between slots and stash; blocked if baseline would exceed 80% of `W` |
| Swap | Stash item with an equipped item of the same kind |
| Set compaction policy | 70 / 80 / 90 / never |
| Inspect | Hover or focus shows the damage formula and the plain-English line |

The build panel shows a **preview**: baseline, starting zone, breakpoints and the next
predicted 6 s of firing order (computed by a 6 s dry-run sim with no enemies).
