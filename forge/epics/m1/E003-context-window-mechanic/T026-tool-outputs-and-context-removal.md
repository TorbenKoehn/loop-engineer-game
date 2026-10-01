---
id: T026
epic: E003
title: Tool outputs and context removal
summary: "Tool output tokens added to signal after effects, negative output and removeCtx removing noise first and never below baseline, with tokens events in the documented order."
keywords: ["context", "outputs", "tokens", "removal", "summarize"]
type: task
status: backlog
priority: p1
model: opus
size: S
depends_on: [T025]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T026: Tool outputs and context removal

## Goal

Every tool call costs context, and removal tools buy it back, with the exact ordering the log documents.

## Context

- Epic: [E003](EPIC.md)
- [Context: Outputs](../../../../docs/game/systems/context.md#outputs)
- [Event log: Ordering, tokens payload](../../../../docs/architecture/event-log.md#ordering)
- [Tools: summarize](../../../../docs/game/content/tools.md#agent)
- Code: `src/sim/combat/context.ts`, `src/sim/combat/fire.ts`
- Out of scope: Overflow and compaction (later E003 tasks), output modifiers from items (E007).

## Acceptance Criteria

- [ ] After a tool's effects (resolved with the zone before the activation), `max(0, output + mods)` is added to S with a tokens event of kind output (test)
- [ ] Negative output and removeCtx remove from N first, then S, never below B (tokens kind removal)
- [ ] Event order per activation is toolFired, effect events, tokens, zoneChanged (test)

## Subtasks

- [ ] Output addition
- [ ] Removal
- [ ] Ordering test

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
