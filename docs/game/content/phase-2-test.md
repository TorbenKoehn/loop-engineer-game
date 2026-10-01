---
title: Phase 2 Test - enemies, elites, boss
summary: Phase 2 content with exact stat blocks - six enemies, two elites, The Flaky CI Pipeline boss - and the easy, hard and elite encounter pools.
keywords: [content, enemies, phase-2, boss, flaky-ci, encounters]
type: gdd
status: active
updated: 2026-10-01
related: [phase-1-implement.md, phase-3-deploy.md, ../systems/statuses.md, ../systems/combat.md]
---

# Phase 2: Test

Theme: consistency. Values are final for home phase 2. Phase 1 enemies appearing here
are scaled by `SEV_SCALE 170/100` and `DMG_SCALE 150/100` (floor), e.g. Typo becomes
Sev 51, Nitpick 3. Milestone: M2.

## Enemies

| Enemy | Family | Sev | Trait | Intent cycle | Teaches | Counterplay |
|---|---|---|---|---|---|---|
| Flaky Test | Bugs | 240 | Flaky(3000) | [Retry: hit 8, 3000] | Timing windows | [Test] tools, fast tools |
| Merge Conflict: Ours | Process | 180 | Linked(3000) | [Conflict Marker: hit 6 + noise 3, 4000] | Balanced damage | AoE, `sed`, `multi_edit` |
| Merge Conflict: Theirs | Process | 180 | Linked(3000) | same, starts with 50% intent progress | | |
| Hallucination | Context | 230 | spawns Decoys | [Confident Answer: hit 10, 4000] -> [Make Something Up: spawn 2 Decoys (max 2 alive), 6000] | Accuracy | high accuracy, [Search], `semantic_search` |
| Decoy | Context | 1 | Decoy | none | (spawned in front) | |
| Prompt Injection | Context | 210 | — | [Ignore Previous Instructions: redirect + noise 6, 5000] -> [Jailbreak: hit 7, 3000] | Targeting | Sandbox, Feature Flag, AoE |
| Off-by-One | Bugs | 230 | — | [Fencepost: hit 4, 3000] -> [Fencepost: 2 × hit 4, 3000] -> [Fencepost: 3 × hit 4, 3000] | Multi-hits vs Guardrails | Guardrails, burst |
| Heisenbug | Bugs | 200 | Elusive | [Can't Reproduce: hit 7, 3500] | AoE need | `all` tools, sub-agents |

Hallucination starts the fight with 2 Decoys already in front of it.

## Elites (Critical Bug)

### Stack Trace 4000 Lines

- Context, Severity 480. Opening (once): [Dump: noise 30, 1500].
- Then cycle: [Traceback: hit 10, doubled while you are in Rot, 3500].
- Teaches: compaction policy. A "never" policy almost certainly loses here.

### Code Review Gatekeeper

- Process, Severity 440, starts with 30 Guardrails. Comes with 2 Typos (scaled) in front.
- Cycle: [Nit: hit 6, 2500] -> [Request Changes: throttle leftmost and rightmost
  2500 ms, 6000] -> [Not Approved: guard 20, 8000].
- Teaches: anti-shield tools (`code_review`), Throttle mitigation.

## Boss: The Flaky CI Pipeline (Release)

Bugs family. Three stages fought in sequence in one enemy slot. Each stage is its own
enemy entity; resolving it starts a 1500 ms **pipeline transition** (no target, agent
tools keep charging, shots fired during it are wasted), then the next stage spawns.

| Stage | Sev | Traits | Intent cycle |
|---|---|---|---|
| 1 Lint | 260 | StageTimer(20 000) | [Lint Error: hit 10, 3000] -> [Style Nit: noise 5, 2500] |
| 2 Build | 360 | StageTimer(22 000) | [Compile: hit 8 + noise 6, 3500] -> [Cache Miss: throttle fastest 2000 ms, 6000] |
| 3 Test | 440 | StageTimer(25 000), Flaky(3000) | [Flaky Assertion: hit 14, 3500] -> [Rerun: guard 30, 7000] |

StageTimer reset ("pipeline re-run") is shown as a big red `RE-RUN` and logged. Tests:
consistency. Deadline 75 000 ms. Expected length at ≈ 25 DPS: 45–60 s.

## Encounter pools

Enemies listed front to back. Totals use scaled carry-over values.

| Pool | Id | Enemies | Total Sev |
|---|---|---|---|
| Easy | `p2e1` | Typo, Flaky Test | 291 |
| Easy | `p2e2` | Decoy, Decoy, Hallucination | 232+ |
| Easy | `p2e3` | Typo, Typo, Off-by-One | 332 |
| Easy | `p2e4` | Merge Conflict: Ours, Merge Conflict: Theirs | 360+ |
| Easy | `p2e5` | Typo, Prompt Injection | 261 |
| Hard | `p2h1` | Flaky Test, Heisenbug | 440 |
| Hard | `p2h2` | Off-by-One, Prompt Injection | 440 |
| Hard | `p2h3` | Context Drift, Merge Conflict: Ours, Merge Conflict: Theirs | 598+ |
| Hard | `p2h4` | Rate Limit, Decoy, Decoy, Hallucination | 436+ |
| Hard | `p2h5` | Typo, Scope Creep, Heisenbug | 421+ |
| Elite | `p2x1` | Stack Trace 4000 Lines | 480 |
| Elite | `p2x2` | Typo, Typo, Code Review Gatekeeper | 542+30 |
| Boss | `p2b` | The Flaky CI Pipeline | 1060+ |

## Balance expectations (phase 2)

| Metric | Target |
|---|---|
| Start-of-phase DPS | 15–20 |
| End-of-phase DPS | 24–32 |
| Trust lost per hard fight | 12–25 |
| Phase 2 boss win rate given phase 1 cleared (greedy bot) | 65–80% |
