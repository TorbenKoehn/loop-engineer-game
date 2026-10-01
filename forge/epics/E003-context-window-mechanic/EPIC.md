---
id: E003
title: Context window mechanic
summary: "Sweet-Spot Window variant A in the sim: window, baseline, outputs, noise, Cold/Focused/Rot/Overflow zones, auto and planned compaction, context-scaled effects (M1)."
keywords: ["context", "window", "compaction", "zones", "noise", "baseline", "m1"]
type: epic
status: backlog
priority: p0
updated: 2026-10-01
related: ["../../../docs/game/systems/context.md", "../../../docs/architecture/sim-core.md", "../../../docs/architecture/event-log.md", "../../../docs/game/systems/combat.md", "../../../docs/game/vertical-slice.md"]
---

# E003: Context window mechanic

## Goal

M1 vertical slice. After this epic every fight runs the full context variant A: tools add tokens, enemies inject noise, zones change damage and charge rate, and overflow or the compaction policy compacts with a stun. This is the central tension the slice must prove readable (exit criterion 3).

## Scope

- Quantities W, B, S, N, F and zones with integer thresholds ([context](../../../docs/game/systems/context.md))
- Tool outputs and removal (negative output, removeCtx effect)
- Enemy noise with phase scale, Rot doubling and blockers; startNoise/startSignal modifiers
- Auto-compaction on overflow (stun 2000 ms, buff loss) and planned compaction policy 70/80/90/never with lockout
- Context-scaled effects (`brute_force`), window modifiers, Long-Context Training
- Context invariant property tests and the worked example as a test

## Out of Scope

- Context bar rendering and compaction moment (E006, E011)
- Chunked UI fallback (variant C presentation), only if playtests fail exit criterion 3
- Memory Leak and other M2 context mechanics (E012)

## Definition of Done

- [ ] All E003 tasks done with approved reviews
- [ ] Test reproducing context.md "Worked example" passes
- [ ] Property test 0 ≤ F ≤ W, S ≥ B, N ≥ 0 after every tick passes on 200 random inputs
- [ ] Golden logs updated in the same changes that alter them, with reasons in the task Log
