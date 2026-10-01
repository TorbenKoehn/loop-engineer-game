---
title: Combat rules
summary: Cooldown auto-combat in integer ms - tick order, charge rates, pipes, targeting, damage formula, enemy intents, Deadline overtime, fight end and readability rules.
keywords: [combat, cooldowns, timeline, damage-formula, deadline, targeting, intents]
type: gdd
status: active
updated: 2026-10-01
related: [context.md, statuses.md, harness-loadout.md, ../content/tools.md, ../../architecture/sim-core.md]
---

# Combat rules

## Contents
- Layout and units
- Tick order
- Charge rate
- Pipes
- Targeting
- Damage formula
- Enemy intents and phase scaling
- Deadline and fight end
- Readability rules

## Layout and units

One lane. The **agent** (left) has Trust, Guardrails, the context bar and 4–6 tool slots
in a row. **Enemies** (right) stand in a line of 1–5; index 0 is the **front** (closest to
the agent). Time is integer **ms**, advanced in fixed ticks of `TICK_MS = 50`.

## Tick order

Each tick runs these steps in this order. Within a step, the agent's tools go left to
right, enemies go front to back. Every state change emits an event.

1. `t += 50`. Decrease all status timers by 50; expire those at ≤ 0.
2. Timed traits tick (Grow, Leak, Flaky toggle, stage timers, sub-agent lifespans);
   `every` item rules run.
3. Charge: every tool and every enemy intent gains `50 × rate` progress.
4. Agent fires: each tool with `progress ≥ cooldownMs × 100` fires, then resets to 0
   (no carry-over). A tool filled by a pipe during this step fires in the same step if it
   is to the right. After each activation: apply effects, add output, run `toolFired`
   rules, check compaction, run `compaction` rules, update the zone once, pipe.
5. If all enemies are resolved: **win**, stop.
6. Enemies act: each intent with `progress ≥ windupMs × 100` resolves, then the enemy
   advances to its next intent (cycle) and progress resets. After each enemy action the
   rules it raised (`damaged`, `trustBelow`, `compaction`) run.
7. Deadline damage at each full second after `deadlineMs` (`deadlineMs + 1000k`, below),
   then the rules it raised (`trustBelow`).
8. Death checks: enemies at Severity ≤ 0 are resolved (on-death traits run, spawns are
   inserted at the dead enemy's index). If all enemies are resolved: win. Else if
   Trust ≤ 0: **loss**.

`fightStart` rules run at t = 0 before the first tick, `fightWon` rules after the win,
before `fightEnd`. Passive item `mod` effects are not rules that fire: they change the
numbers below (rate, damage, output, pipes, window, Focused bonus, blockers, durations).

Ties always favour the player: the agent acts before enemies in the same tick.

## Charge rate

Rate is an integer percent; 100 = normal speed.

```
add   = harness.speed + Σ flat rate mods (skills, memories, system prompt, trait)
rate  = clamp(add, 10, 400)
if Haste:  rate = rate × 2
if Slow:   rate = floor(rate / 2)
if zone is Rot (agent only): rate = floor(rate × 70 / 100)
if Throttled or Stunned:      rate = 0
```

Enemies use the same formula with base 100 (no zone). Effective cooldowns below 1000 ms
are not possible: content keeps `cooldownMs ≥ 1000` and `windupMs ≥ 1000`.

## Pipes

A tool with `pipe: P` adds `P × 100` progress to the tool directly to its right when it
fires (capped at full). Pipe bonuses from skills/breakpoints add to `P`. Pipes do nothing
to Throttled or Stunned tools and never wrap around (except via the Feedback Loop skill).
A tool "was piped" if it received pipe progress since its own last activation.

A **pipe chain** is a run of pipes within 1000 ms of the chain's first pipe (1-based
step count in the `pipe` event); the next pipe after that window starts a new chain.

**Primes** are one-shot: each is bound at creation to one tool and consumed at the start
of that tool's next activation (a prime made during an activation waits for the one after).
The target is the matching tool predicted to fire soonest (ties: leftmost; Throttled or
Stunned tools last). `count: n` primes n different tools. A consumed prime emits
`primeUsed` and applies to damage, Guardrails and healing alike.

## Targeting

| Target | Rule |
|---|---|
| `front` | Enemy at index 0, skipping Decoys if the harness accuracy is high or the tool has [Search] |
| `back` | Last enemy in the line |
| `lowest` | Lowest current Severity; ties: frontmost |
| `all` | Every enemy, front to back (each hit computed separately) |
| `self` | The agent |

A **Redirected** activation (Prompt Injection) swaps `front` and `back` once. Enemy
actions always target the agent.

## Damage formula

One visible formula, shown on hover (Balatro-style).

```
base   = tool value at its version (v1/v2/v3)
flat   = Σ flat adds (skills, breakpoints, buffs; dmgFlat for damage only)
pct    = zone (+20 Focused + focusPct | −coldPenalty Cold) + Σ % mods, min −90
amount = max(1, floor(((base + flat) × (100 + pct) + 50) / 100))
```

The same formula applies to Guardrails and healing from tools. Then, on an enemy:
Outage/Elusive/Blocked checks (may set amount to 0) -> armor -> enemy Guardrails ->
Severity. On the agent: enemy amount -> agent damage-taken mods (lessons, skills, min 1)
-> Guardrails -> Trust. Overkill is discarded. Every step appears in the log line.

## Enemy intents and phase scaling

Each enemy has an intent **cycle**: a list of actions, each with `windupMs` and a value.
The current intent is always visible with an icon, value and countdown. Enemies have a
`homePhase`. When spawned in a later phase `p`, scale Severity by
`SEV_SCALE[p] / SEV_SCALE[home]` and damage by `DMG_SCALE[p] / DMG_SCALE[home]` (floor).

| Constant | P1 | P2 | P3 | Endless |
|---|---|---|---|---|
| `SEV_SCALE` | 100 | 170 | 260 | +60 per loop |
| `DMG_SCALE` | 100 | 150 | 210 | +40 per loop |
| `PHASE_NOISE_SCALE` | 100 | 125 | 150 | +25 per loop |

## Deadline and fight end

| Encounter | `deadlineMs` |
|---|---|
| Task (normal) | 45 000 |
| Critical Bug (elite) | 50 000 |
| Release (boss) | 75 000 |

From `deadlineMs`, at every full second `k = 1, 2, 3…` after it, deal `k` damage to every
enemy, then `k` damage to the agent. Deadline damage **bypasses** Guardrails and armor and
ignores Elusive/Blocked. The UI turns the clock red and pulses each second. Hard cap:
at `deadlineMs + 30 000` the fight is a loss (`fightEnd {reason:'timeout'}`); it is
unreachable in practice because cumulative Deadline damage is then 465.

After a win, Guardrails, statuses and Context reset. Trust carries over. `POST_FIGHT_HEAL`
is 0 (tuning knob).

## Readability rules

1. At most 5 enemies on screen. Spawns beyond 5 are dropped (logged).
2. Every unit shows one main number (Trust or Severity) plus at most one shield number.
3. Every tool shows a cooldown bar and its next effect value; every enemy shows intent.
4. Every effect has a plain-English tooltip generated from content data.
5. The combat log line format is fixed: `[mm:ss.mmm] source -> target: verb value (why)`.
6. The game uses only the 6 statuses in [statuses](statuses.md) plus named enemy traits.
