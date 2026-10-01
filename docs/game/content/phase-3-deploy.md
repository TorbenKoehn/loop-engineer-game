---
title: Phase 3 Deploy - enemies, elites, boss
summary: Phase 3 content with exact stat blocks - six enemies, two elites, the Production Incident boss - and the easy, hard and elite encounter pools.
keywords: [content, enemies, phase-3, boss, production-incident, encounters]
type: gdd
status: active
updated: 2026-10-01
related: [phase-2-test.md, phase-1-implement.md, ../systems/statuses.md, ../systems/endless-ascension.md]
---

# Phase 3: Deploy

Theme: pressure. Values are final for home phase 3. Carry-overs are scaled from their
home phase: phase 1 enemies by `260/100` Severity and `210/100` damage, phase 2 enemies by
`260/170` and `210/150` (floor). Typo becomes Sev 78, Nitpick 4; Prompt Injection becomes
Sev 321, Jailbreak 9. Milestone: M2.

## Enemies

| Enemy | Family | Sev | Trait | Intent cycle | Teaches | Counterplay |
|---|---|---|---|---|---|---|
| Infinite Loop | Sandbox | 320 | Accelerate(90, 1000) | [Loop: hit 6, 4000] | Burst thresholds | hits ≥ 30, `timeout`, `kill_9` |
| Memory Leak | Context | 300 | Leak(4000, 2) | [Allocation: hit 8, 4000] | Baseline pressure | kill fast, compaction |
| Permission Denied | Sandbox | 280 | — | [Await Approval: throttle tag:Shell 4000 ms, 8000] -> [Deny: hit 8, 3000] | Tag diversity | non-Shell tools, Sandbox skill |
| Cold Start | Infra | 360 | ColdStart(4000) | [Heavy Request: hit 22, 5000] | Opening burst | front-load damage, Fail Fast |
| Thundering Herd | Infra | 90 | Herd | [Request: hit 4, 2000] | Swarms and AoE | `rm_rf`, `multi_edit`, `sed` |
| It's Always DNS | Infra | 300 | — | [Cache Poisoning: noise 10 + throttle tag:Web 3000 ms, 6000] -> [TTL Expired: hit 9, 3000] | Noise + tag lock | `.gitignore`, Garbage Collector |

Accelerate: after each Loop, its windup is multiplied by 90/100 (min 1000 ms); any single
hit of ≥ 30 damage (after modifiers, before armor/Guardrails) resets it to 4000.
Thundering Herd always comes in groups of 2 or 4.

## Elites (Critical Bug)

### Friday Deploy

- Process, Severity 650. This fight's Deadline starts at **25 000 ms** (instead of 50 000).
- Cycle: [Push to Prod: hit 12, 4000].
- Teaches: a pure race. Deadline damage hits enemies first, so a build that brings it
  below about 80 Severity by the Deadline usually wins.

### Cascading Failure

- Infra, three linked services in a line: Auth, Queue, Cache, each Severity 230,
  trait Cascade(20, 50): when one resolves, each survivor heals 20% of its max Severity
  and gains +50% damage (stacks additively).
- Each: [Overload: hit 8, 3500], Queue starts with 33% and Cache with 66% intent progress.
- Teaches: even damage spread (AoE) beats focus fire.

## Boss: Production Incident (Release)

Infra family. "Sev-1 at 3 AM." Deadline 75 000 ms.

- **SLA timer**: from `t = 0`, every 1500 ms you lose 1 Trust (bypasses Guardrails) until
  the Root Cause is resolved. Shown as a ticking pager in the status bar.
- **Symptoms** (front, in order), each Severity 200:
  Latency Spike [Spike: hit 12, 4000]; Error Rate [5xx: 3 × hit 4, 4500];
  Pager Storm [Page: noise 10, 3000].
- **Root Cause** (back): Severity 1100, traits **Hidden** (until all 3 Symptoms are
  resolved, shown as `???`) and Outage(Web) once revealed.
- Root Cause cycle after reveal: [Cascading Failure: hit 18, 4000] -> [Pager Spike:
  noise 12, 5000].
- At ≤ 50% Severity, once: [Escalation: spawn Latency Spike (Sev 150) in front, 1000].

Tests: burst, context control and racing a drain. Expected length at ≈ 40 DPS: 45–60 s.

## Encounter pools

Enemies listed front to back. Totals use scaled carry-over values.

| Pool | Id | Enemies | Total Sev |
|---|---|---|---|
| Easy | `p3e1` | Typo, Infinite Loop | 398 |
| Easy | `p3e2` | Thundering Herd × 4 | 360 |
| Easy | `p3e3` | Typo, Typo, Cold Start | 516 |
| Easy | `p3e4` | Prompt Injection, Memory Leak | 621 |
| Easy | `p3e5` | Typo, Permission Denied | 358 |
| Hard | `p3h1` | Permission Denied, Infinite Loop | 600 |
| Hard | `p3h2` | Thundering Herd × 2, It's Always DNS | 480 |
| Hard | `p3h3` | Cold Start, Memory Leak | 660 |
| Hard | `p3h4` | Permission Denied, It's Always DNS | 580 |
| Hard | `p3h5` | Typo, Prompt Injection, Infinite Loop | 719 |
| Elite | `p3x1` | Friday Deploy | 650 |
| Elite | `p3x2` | Auth, Queue, Cache | 690+ |
| Boss | `p3b` | Production Incident | 1850+ |

## Balance expectations (phase 3)

| Metric | Target |
|---|---|
| Start-of-phase DPS | 25–32 |
| End-of-phase DPS | 35–45 |
| Trust lost per hard fight | 15–30 |
| Boss win rate given phase 2 cleared (greedy bot) | 60–75% |
| Full-run win rate, greedy bot, each starter harness | 35–65% |

Easy pool totals sit higher than in earlier phases because start-of-phase builds are
already mature; the balance sim may move `p3e3`/`p3e4` to the hard pool.
