---
title: Statuses and enemy traits
summary: The six combat statuses with exact effects, stacking and durations, plus the one-shot Primed modifier and the catalogue of named enemy traits.
keywords: [statuses, haste, slow, throttle, stun, guardrails, traits]
type: gdd
status: active
updated: 2026-10-01
related: [combat.md, context.md, ../content/phase-1-implement.md, ../content/phase-2-test.md, ../content/phase-3-deploy.md]
---

# Statuses and enemy traits

Status budget: exactly **6 statuses** in the whole game. Everything else is a named enemy
trait (explained on the enemy card) or a one-shot modifier.

## The six statuses

| Status | Applies to | Effect | Stacking | Duration cap |
|---|---|---|---|---|
| **Guardrails** | agent, enemy | Absorbs damage before Trust/Severity. Persists for the fight | Amounts add | Agent: max Trust. Enemy: its max Severity |
| **Haste** | tool, enemy | Charge rate × 2 | Re-apply adds duration | 10 000 ms |
| **Slow** | tool, enemy | Charge rate ÷ 2 (floor) | Re-apply adds duration | 10 000 ms |
| **Throttle** | tool | Charge rate 0 ("429: try later"); pipes ignored | Re-apply takes the longer remaining | 10 000 ms |
| **Stun** | agent, enemy | All charging stops for that unit; pipes ignored | Re-apply takes the longer remaining | 5 000 ms |
| **Noise** | context | Grey tokens in the bar (see [context](context.md)) | Adds | Cleared by compaction |

Rules:

- Haste and Slow on the same unit both apply (×2 then ÷2 = ×1).
- Throttle and Stun override Haste (rate 0). Progress is kept, never lost.
- Duration modifiers (e.g. Lockfile "−50% Throttle/Slow") apply when the status is
  applied: `d' = floor(d × (100 − mod) / 100)`, min 50 ms.
- An agent-wide Haste/Slow applies the status to every tool individually.
- "Fastest tool" = the tool with the lowest `cooldownMs × 100 / currentRate` at the moment
  of the effect; ties: leftmost. Tools at rate 0 are skipped.
- "Longest remaining charge" = the tool with the most ms left until it fires at its
  current rate; ties: leftmost.

## Primed (one-shot modifier)

`prime(filter, pct)`: the next activation of a tool matching `filter` gets `+pct%` in
the damage formula, then the prime is consumed. Shown as a chip on the tool
(`+50%`). Multiple primes on the same tool add up and are consumed together. Primes
count as "temporary buffs" for auto-compaction loss.

## Enemy traits

Traits are passive rules on an enemy. Each has a one-line card text.

| Trait | Exact rule | Used by |
|---|---|---|
| **Split(n, pct)** | On resolve, spawn `n` copies of the child enemy at `pct%` of the parent's max Severity, at its index | Dependency Hell |
| **Grow(ms, sev, dmg)** | Every `ms`: max and current Severity `+sev`, attack value `+dmg` | Scope Creep |
| **Outage(tag)** | While alive, tools with `tag` fire and add output but their effects do nothing ("timed out") | Unreachable Service, Root Cause |
| **Blocked** | Takes 0 damage while any non-Blocked enemy is alive (Deadline still hits) | Yak Shave |
| **Clone** | The first time Severity ≤ 50% of max, spawn a copy with equal current Severity and no Clone trait behind it | Copy-Paste Clone |
| **Flaky(ms)** | Toggles Fail/Pass every `ms`, starting Fail. While Pass: takes 0 damage except from [Test] tools | Flaky Test, CI Test stage |
| **Linked(ms)** | When one linked partner resolves, the others must resolve within `ms`, or the first returns at 50% max Severity | Merge Conflict |
| **Decoy** | Spawned decoys have 1 Severity and soak a single-target hit. `front` skips them for high-accuracy harnesses and [Search] tools | Hallucination |
| **Elusive** | Takes 0 from single-target hits while another enemy is alive; `all` hits and sub-agents work | Heisenbug |
| **Armor(layers, hp)** | Damage hits the current armor layer first. [Edit] damage counts 100%, other damage 50% (floor). Breaking a layer stuns the boss 1500 ms. Excess is discarded | Legacy Monolith |
| **Leak(ms, n)** | Every `ms`: agent baseline `+n` and `S += n` (cap 90% of `W`) | Memory Leak |
| **Accelerate(pct, min)** | After each action, its windups are multiplied by `pct/100` (min `min` ms). A single hit ≥ 30 damage resets windups | Infinite Loop |
| **ColdStart(ms)** | Begins the fight Stunned for `ms` | Cold Start |
| **Herd** | When one herd member resolves, the others gain Haste 2000 ms | Thundering Herd |
| **Cascade(heal, dmg)** | When one member resolves, the others heal `heal%` of max and gain `+dmg%` damage (stacks) | Cascading Failure |
| **Hidden** | Cannot be targeted or damaged until a condition is met (shown as `???`) | Root Cause |
| **StageTimer(ms)** | If not resolved within `ms` of its stage start, Severity resets to max and the timer restarts | Flaky CI Pipeline stages |

## Enemy action verbs

Intents use only these verbs: `hit(n)`, `multiHit(n, times)`, `noise(n)`,
`throttle(selector, ms)`, `slow(selector, ms)`, `stun(ms)`, `guard(n)`,
`heal(n)`, `spawn(enemyId, max)`, `redirect()`, `custom(handlerId)` (bosses only).
Selectors: `fastest`, `leftmost`, `rightmost`, `tag:<Tag>`, `all`.
