---
title: Phase 1 Implement - enemies, elites, boss
summary: Phase 1 content with exact stat blocks - six enemies, two elites, the Legacy Monolith boss - and the easy, hard and elite encounter pools.
keywords: [content, enemies, phase-1, boss, legacy-monolith, encounters]
type: gdd
status: active
updated: 2026-10-01
related: [../systems/statuses.md, ../systems/combat.md, ../systems/run-map.md, phase-2-test.md, ../vertical-slice.md]
---

# Phase 1: Implement

Theme: writing code. Each enemy teaches one mechanic. All values are final for home
phase 1 (scale 100). Intents are written `[Name: verbs, windupMs]` and cycle in order.
Every enemy, elite and boss here is in the vertical slice except Copy-Paste Clone.

## Enemies

| Enemy | Family | Sev | Trait | Intent cycle | Teaches | Counterplay |
|---|---|---|---|---|---|---|
| Typo | Bugs | 30 | — | [Nitpick: hit 2, 3000] | Tools fire on their own; AoE | `sed`, `run_tests` |
| Context Drift | Context | 140 | — | [Drift: noise 6, 3500] -> [Nudge: hit 4, 3500] | Noise fills context | `.gitignore`, policy, `summarize` |
| Rate Limit (429) | Infra | 120 | — | [Throttle: throttle fastest 3000 ms, 6000] -> [Retry-After: hit 5, 3000] | Tool freezing | diverse cooldowns, `retry_with_backoff`, Lockfile |
| Dependency Hell | Process | 120 | Split(2, 50) -> Transitive Dep | [Version Conflict: hit 3, 4000] | Splitting, AoE value | AoE, `web_search` (lowest) |
| Transitive Dep | Process | 60 | — | [Peer Conflict: hit 2, 3500] | (spawned) | |
| Scope Creep | Process | 100 | Grow(4000, 6, 1) | [Feature Request: hit 2, 3000] | Kill priority | burst, put it in front |
| Unreachable Service (503) | Infra | 120 | Outage(Web) | [Timeout: hit 4, 4000] | Tag counters | non-Web builds, Cache |

Grow: every 4000 ms max and current Severity `+6` and Feature Request `+1` damage.

## Elites (Critical Bug)

### Yak Shave (M1)

- Yak Shave: Process, Severity 220, trait **Blocked**. Stands at the back.
- In front, in order: Install Dependency (Sev 40, [hit 3, 2500]), Update Toolchain
  (Sev 40, [throttle leftmost 1500 ms, 5000]), Fix Unrelated Bug (Sev 40, [noise 5, 3000]).
- Yak intent cycle: [Shave: hit 9, 4500] -> [Another Thing First: spawn Side Quest at the
  front if fewer than 3 other enemies are alive, max 2 spawns per fight, 9000].
- Side Quest: Sev 30, [hit 3, 2500].
- Teaches: order and AoE; burst after the tasks fall.

### Copy-Paste Clone (M2)

- Bugs, Severity 200, trait **Clone**. Intents: [Duplicate Code: hit 7, 3500] ->
  [Paste: hit 3 + noise 4, 3000]. Comes with 2 Typos in front.
- Teaches: burst through the 50% threshold or face two of them.

## Boss: Legacy Monolith (Release)

Process family. Severity 360, trait **Armor(3 layers, 50 each)**: [Edit] damage counts
100% against armor, other damage 50%. Breaking a layer stuns it 1500 ms and switches the
stage at its next intent (cycle index resets).

| Stage | When | Intent cycle |
|---|---|---|
| A | 3 layers | [Legacy Code: hit 8, 4000] -> [Undocumented Behavior: spawn add (max 2 alive), 7000] |
| B | 1–2 layers | [Legacy Code: hit 8, 4000] -> [Big Ball of Mud: hit 5 + noise 8, 4000] -> [Undocumented Behavior: spawn add, 7000] |
| C | 0 layers ("Rewrite") | [Spaghetti: hit 5, 2000] |

Add: **Undocumented Behavior**, Process, Sev 30, [Side Effect: hit 3 + noise 3, 3000],
spawned in front of the Monolith.

Tests: sustained [Edit] damage and context control under add noise. Deadline 75 000 ms.
Expected length with an average end-of-phase build (≈ 15 DPS): 40–50 s.

## Encounter pools

Enemies are listed front to back.

| Pool | Id | Enemies | Total Sev |
|---|---|---|---|
| Easy | `p1e1` | Typo, Typo, Typo (also the tutorial fight) | 90 |
| Easy | `p1e2` | Typo, Context Drift | 170 |
| Easy | `p1e3` | Typo, Rate Limit | 150 |
| Easy | `p1e4` | Typo, Typo, Scope Creep | 160+ |
| Easy | `p1e5` | Typo, Unreachable Service | 150 |
| Hard | `p1h1` | Context Drift, Dependency Hell | 380 |
| Hard | `p1h2` | Scope Creep, Rate Limit | 220+ |
| Hard | `p1h3` | Typo, Context Drift, Unreachable Service | 290 |
| Hard | `p1h4` | Rate Limit, Dependency Hell | 360 |
| Hard | `p1h5` | Typo, Scope Creep, Context Drift | 270+ |
| Elite | `p1x1` | Install Dependency, Update Toolchain, Fix Unrelated Bug, Yak Shave | 340 |
| Elite | `p1x2` | Typo, Typo, Copy-Paste Clone | 260+ |
| Boss | `p1b` | Legacy Monolith | 510+ |

Totals count split children as part of the parent (Dependency Hell = 240). "+" marks
growth or spawns.

## Balance expectations (phase 1)

| Metric | Target |
|---|---|
| Starter DPS at Focused | 7–9 |
| End-of-phase DPS | 13–17 |
| Trust lost per easy fight | 5–12 |
| Trust lost per hard fight | 10–20 |
| Elite Trust loss | 15–30 |
| Phase 1 boss win rate, greedy bot, M1 slice | 35–65% (the slice run ends here) |
| Phase 1 boss win rate, greedy bot, M2+ | 70–85% (re-tuned as the first of three phases) |
