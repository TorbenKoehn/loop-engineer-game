---
id: T022
epic: E002
title: Pipes and one-shot primes
summary: "Pipe charge transfer to the right neighbour with same-step firing and chain steps, the was-piped flag, and prime effects consumed on the next matching activation."
keywords: ["sim", "pipes", "primes", "tool-order", "chain"]
type: task
status: ready
priority: p1
model: opus
size: M
depends_on: [T019, T020]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T022: Pipes and one-shot primes

## Goal

Tool order matters: pipes push charge right and primes buff the next matching activation, both visible in the log.

## Context

- Epic: [E002](EPIC.md)
- [Combat: Pipes, Tick order step 4](../../../../docs/game/systems/combat.md#pipes)
- [Statuses: Primed](../../../../docs/game/systems/statuses.md#primed-one-shot-modifier)
- [Event log: pipe, prime, primeUsed, Ordering](../../../../docs/architecture/event-log.md#ordering)
- Code: `src/sim/combat/pipes.ts`, `src/sim/combat/fire.ts`
- Out of scope: Pipe bonuses from skills and breakpoints (E007), Feedback Loop wrap (E007).

## Acceptance Criteria

- [ ] Test `pipe fills right neighbour` adds P x 100 progress capped at full, and a filled neighbour fires in the same step
- [ ] Pipes do nothing to Throttled or Stunned tools and never wrap around (tests)
- [ ] A tool counts as "was piped" until its own next activation (test)
- [ ] pipe events carry the 1-based chain step within 1000 ms
- [ ] Test `primes add and are consumed together` with prime and primeUsed events and why id `prime:<tool>`

## Subtasks

- [ ] Pipe transfer and same-step fire
- [ ] Chain step tracking
- [ ] Prime storage and consumption

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
