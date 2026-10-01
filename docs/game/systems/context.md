---
title: Context mechanic (Sweet-Spot Window)
summary: Exact rules and integer formulas for the context bar - window, baseline, outputs, noise, zones, overflow, planned compaction policy - with tuning knobs.
keywords: [context, tokens, zones, compaction, noise, formulas, tuning]
type: gdd
status: active
updated: 2026-10-01
related: [combat.md, statuses.md, harness-loadout.md, ../ux/screens.md, ../../architecture/sim-core.md]
---

# Context mechanic: Sweet-Spot Window

## Contents
- Quantities
- Zones
- Outputs
- Noise
- Auto-compaction (Overflow)
- Planned compaction (policy)
- Tuning knobs
- Worked example
- UI fallback (variant C presentation)

Chosen design: variant A of the research ("Sweet-Spot Window"). Variant C (discrete
chunks) is only a **UI fallback**; the sim is identical. All values are integers.

## Quantities

| Symbol | Name | Definition |
|---|---|---|
| `W` | window | Harness window + modifiers, min 40. Shown as `W k` (60 -> "60k") |
| `B` | baseline | Sum of loadout weights (below). Set at fight start |
| `S` | signal | Non-noise tokens in context, `S ≥ B` |
| `N` | noise | Tokens injected by enemies, shown grey |
| `F` | fill | `S + N`, always `0 ≤ F ≤ W` after resolution |

Baseline: `B = harness.baseWeight + systemPrompt.weight + Σ tool.weight +
Σ skill.weight + Σ memory.weight + lessonCount × 1`. At fight start `S = B + startBonus`,
`N = startNoise` (from events), then the overflow check runs once.

Build-phase limit: equipping is refused if `B × 100 > W × 80` (message: "Context full:
unequip something"). In-fight baseline growth (Memory Leak) caps at `B × 100 ≤ W × 90`.

## Zones

Zone is recomputed after every change of `F` and emits a `zoneChanged` event.

| Zone | Integer test | Effect | Bar colour token |
|---|---|---|---|
| Cold | `F × 100 < W × 25` | Tool effects `−coldPenalty%` ("guessing") | `--zone-cold` |
| Focused | `F × 100 < W × 70` | Tool effects `+20%` | `--zone-focused` |
| Rot | `F < W` | Tool charge rate `× 70 / 100`; incoming noise `× 2` | `--zone-rot` |
| Overflow | `F ≥ W` | Immediate auto-compaction (below) | `--zone-overflow` |

`coldPenalty` comes from model accuracy: high 15, normal 25, low 35. "Tool effects"
means damage, Guardrails and healing from tools; it never modifies token amounts.

## Outputs

When a tool fires: resolve its effects first (with the zone **before** the activation),
then add `out = max(0, tool.output + Σ outputMods)` to `S`. Then check compaction.
Negative output (e.g. `summarize`) and `removeCtx` are **removals**: remove from `N`
first, then from `S`, never below `B`. Token amounts never take the zone %. One
activation counts as one change of `F` (one zone update).

## Noise

Enemy action "inject n noise": `n' = n × phaseNoiseScale / 100`, then `× 2` in Rot, then
blockers (`.gitignore`) subtract, then `N += n'`. Noise is cleared by any compaction.
Effects that scale with context use `S` only ("noise makes no contribution").
On hover, noise segments show their source ("Context Drift: 6k").

## Auto-compaction (Overflow)

Triggered whenever `F ≥ W` after an addition (tool output, noise, baseline growth).

1. Emit `compaction {kind:'auto'}`.
2. `N = 0`; `S = min(B + floor(W × 10 / 100), W − 1)`.
3. The agent is **Stunned 2000 ms** (all tools stop charging, progress is kept).
4. Remove the most recently applied positive temporary buff on the agent or its tools
   (Haste, "next activation +X%"). Ties: highest event sequence number.
5. Tools that had not yet fired in this tick do not fire this tick.

The UI shows the full-screen "Compacting conversation…" moment (1 s at 1x).

## Planned compaction (policy)

Build-phase setting: `compact at 70% | 80% | 90% | never`. Default **80%**.

- Trigger: after an addition, if `F × 100 ≥ W × p`, and at least 3000 ms since the last
  compaction, and no auto-compaction was triggered by the same addition.
- Effect: `N = 0`; `S = min(B + floor(W × 10 / 100), W − 1)`; **Stun 1000 ms**; buffs are
  kept. Emit `compaction {kind:'planned'}`.
- Disabled (UI warning) if `(B + floor(W × 10 / 100)) × 100 ≥ W × p`, which would loop.
  `fightStart` carries `policyOff: 1` then.
- The lockout counts from the last compaction of any kind. Removals never trigger it.
  Unlike auto-compaction, tools that had not fired yet this tick still fire.
- The `compact` effect (tool `compact`, item rules) runs the same effect at once, ignoring
  policy and lockout: `compaction {kind:'tool'}`.

The decision: compact early (lose tempo, stay Focused) or ride Rot (slower tools, but
items like `brute_force` and Long-Context Training reward it).

## Tuning knobs

| Constant | Value | Notes |
|---|---|---|
| `ZONE_COLD_PCT` | 25 | Lower bound of Focused |
| `ZONE_ROT_PCT` | 70 | Lower bound of Rot |
| `FOCUS_BONUS_PCT` | 20 | |
| `COLD_PENALTY_PCT` | 15 / 25 / 35 | accuracy high / normal / low |
| `ROT_RATE_PCT` | 70 | charge rate multiplier |
| `ROT_NOISE_MULT` | 2 | |
| `COMPACT_RESET_PCT` | 10 | of `W`, added to `B` |
| `AUTO_COMPACT_STUN_MS` | 2000 | |
| `PLANNED_COMPACT_STUN_MS` | 1000 | |
| `PLANNED_COMPACT_LOCKOUT_MS` | 3000 | |
| `BASELINE_BUILD_MAX_PCT` | 80 | |
| `BASELINE_FIGHT_MAX_PCT` | 90 | |
| `WINDOW_MIN` | 40 | |
| `PHASE_NOISE_SCALE` | 100 / 125 / 150 | only for enemies outside their home phase |

## Worked example

Terminal Purist (`W` 60) with "Be concise" (weight 4): `B = 4 + 4 + grep 3 + cat 2 +
sed 4 + Unix Philosophy 3 = 20`, 33% Focused. `cat` fires: output `2 − 1 = 1`, `F = 21`.
Context Drift injects 6 noise: `F = 27`. At `F = 42` (70%) the bar turns Rot; at `F = 48`
(80%) the policy compacts: `N = 0`, `S = 20 + 6 = 26`, Stun 1000 ms.

## UI fallback (variant C presentation)

If playtests show the bar is unreadable, render it as 10 chunks of `W/10` tokens with the
same colours and noise chunks labelled by source. No sim change. Decision gate: M1 exit
criterion 3 in [milestones](../milestones.md).
