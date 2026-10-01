---
id: E002
title: Combat simulation core
summary: "Pure integer combat simulator: tick-based tools, enemies with telegraphed intents, Trust, Guardrails and Deadline, resolved into a deterministic event log with property tests."
keywords: ["combat", "simulation", "event-log", "determinism", "integer", "fast-check"]
type: epic
status: backlog
priority: p0
updated: 2026-10-01
related: ["../../../docs/research/game/game-design-proposal.md", "../../../docs/research/game/tech-stack.md"]
---

# E002: Combat simulation core

## Goal

Build resolveCombat(input) in src/sim/combat: a deterministic, integer-only function that turns an agent build and an enemy group into an outcome plus an event log the UI can replay.

## Scope

- Tick model (1 tick = 50 ms), tool cooldowns, left-to-right tie resolution
- Enemies with telegraphed intents and timers
- Trust, Guardrails, Severity, status effects (slow, freeze)
- Deadline phase at 45 s with growing damage
- Event log with explanation fields for tooltips
- Property tests (fast-check) for invariants and replay equality

## Out of Scope

- Context bar maths (E003)
- Map, shop and run reducer (E004)
- Concrete content roster (E005)
- Any rendering or playback (E006)

## Definition of Done

- [ ] resolveCombat is pure and deterministic for the same input and seed
- [ ] Every outcome is explained by the event log
- [ ] Golden logs cover at least 5 representative fights
- [ ] Property tests hold over 1000+ random inputs
- [ ] A balance sim can run 1000 fights headless in Node
