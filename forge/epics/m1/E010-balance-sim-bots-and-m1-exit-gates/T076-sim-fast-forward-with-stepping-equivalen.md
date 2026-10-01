---
id: T076
epic: E010
title: Sim fast-forward with stepping equivalence
summary: "Fast-forward jumping to the next threshold tick with ceilDiv, a property test proving logs equal plain stepping, and measured balance throughput."
keywords: ["sim", "performance", "fast-forward", "property-tests", "throughput"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T024, T038, T029, T072]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T076: Sim fast-forward with stepping equivalence

## Goal

Make the balance sim fast enough for thousands of runs in CI without changing a single event.

## Context

- Epic: [E010](EPIC.md)
- [Simulation core: Fast-forward](../../../../docs/architecture/sim-core.md#fast-forward-optimisation)
- [Testing: Property tests (invariant 3)](../../../../docs/architecture/testing.md#property-tests-fast-check)
- Code: `src/sim/combat/fastforward.ts`
- Out of scope: Other optimisations; the M2 throughput target itself (E018).

## Acceptance Criteria

- [ ] The sim jumps to the next tick where a tool fills, an intent fills, a status expires, a trait timer fires or a Deadline second hits
- [ ] Property test: fast-forward and stepping give identical event logs on 200 random inputs
- [ ] All golden logs are unchanged
- [ ] Balance throughput in runs per second per core is measured before and after and recorded in the Log

## Subtasks

- [ ] Next-threshold computation
- [ ] Jump application
- [ ] Equivalence property
- [ ] Benchmark

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
