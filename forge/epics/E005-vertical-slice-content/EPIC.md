---
id: E005
title: Vertical slice content
summary: "Typed TS content for the slice: 2 harnesses, a starter tool and skill pool, memories, enemy families, one boss and events, balanced via headless sim runs and a content report."
keywords: ["content", "slice", "harness", "enemies", "balance", "data"]
type: epic
status: backlog
priority: p1
updated: 2026-10-01
related: ["../../../docs/research/game/game-design-proposal.md", "../../../docs/research/game/tech-stack.md"]
---

# E005: Vertical slice content

## Goal

Fill the sim with enough typed content data to make one phase fun and winnable: two harnesses, tools, skills, memories, enemies, a boss and events.

## Scope

- Two harnesses with model stats, tools, skills and system prompts
- Tool, skill and memory pool with plain-English tooltip text
- Enemy roster and Phase 1 boss (Legacy Monolith)
- Standup events
- Balance runs via scripts/sim.ts and a content report script
- Content validation tests (ids, tags, token weights)

## Out of Scope

- Phases 2 and 3 content
- Meta unlocks, AGENTS.md and lint rules
- Art and audio assets

## Definition of Done

- [ ] Content type-checks and passes validation tests
- [ ] Bot win rate for Phase 1 sits within the agreed target band
- [ ] Every joke has a plain-English tooltip line
- [ ] Content report lists all entries and token weights
