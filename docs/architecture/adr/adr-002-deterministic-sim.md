---
title: ADR-002 Deterministic integer sim with event log
summary: Combat is a pure, integer-only, seeded simulation in integer ms that resolves instantly to an event log; the UI only replays that log.
keywords: [adr, determinism, simulation, event-log, rng, integer-math]
type: adr
status: active
updated: 2026-10-01
related: [../sim-core.md, ../event-log.md, adr-005-save-action-log.md, ../../game/systems/combat.md]
---

# ADR-002: Deterministic integer simulation with an event log

Status: accepted, 2026-10-01.

## Context

Pillar 4 ("seeded, telegraphed, fair") requires that the same seed and choices give the
same run. Balancing needs thousands of headless runs per minute. AI agents must be able to
reproduce bugs from a save string and to test combat without a browser. Combat has no
player input, so it is a pure function of its inputs.

## Decision

- `resolveCombat(input) -> CombatResult` resolves a whole fight instantly in `src/sim`,
  a module with zero dependencies and no access to DOM, clocks or `Math.random`.
- Time is integer ms with a fixed 50 ms tick; all quantities are integers (percent as
  integer percent, progress as ms × 100). Divisions are floored by helpers in `int.ts`.
- Randomness uses sfc32 seeded via cyrb128, **forked by path** (`combat/<nodeId>`), so
  subsystems never influence each other's random streams.
- The fight's output is an ordered **event log** (`seq`, `t`, `kind`, refs, integers).
  The UI, text log, tooltips, juice, audio, stats and tests consume it; the UI never
  re-runs rules.
- Determinism is enforced by an architecture test (banned imports and globals), property
  tests (double-run equality, fast-forward equals stepping) and golden log hashes.

## Consequences

- Skip, pause, speed and seeking are trivial: they are playback of a known log.
- Balance CLI, bots and tests run the exact game logic in Node, fast (target ≥ 200
  runs/s per core with fast-forward and logging off).
- Bug reports are reproducible from seed + actions.
- Designers must express all combat randomness as logged `roll` events; content uses
  almost none.
- Any change to rules or event fields changes golden hashes; updates are deliberate and
  reviewed.
- Integer maths needs care with rounding; the rules are centralised and tested.

## Alternatives considered

- **Real-time simulation inside the render loop** (engine-style): couples logic to frame
  rate, breaks headless testing and replays.
- **Floating-point maths**: risks cross-engine differences and accumulating error; no
  benefit at our scale.
- **Event-driven continuous time** (priority queue of next events only): fast, but the
  fixed tick is simpler to reason about; we keep a fast-forward that is proven equal to
  stepping instead.
- **Storing logs in saves**: large and redundant; logs are recomputed from the input.
