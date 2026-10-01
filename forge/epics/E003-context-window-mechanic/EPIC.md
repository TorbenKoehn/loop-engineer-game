---
id: E003
title: Context window mechanic
summary: "Sweet-Spot Window in the sim: baseline, tool outputs, enemy noise, Cold/Focused/Rot/Overflow zones, auto and planned compaction, and rule-bending items, all integer and logged."
keywords: ["context", "window", "compaction", "zones", "noise", "sim"]
type: epic
status: backlog
priority: p0
updated: 2026-10-01
related: ["../../../docs/research/game/game-design-proposal.md", "../../../docs/research/game/tech-stack.md"]
---

# E003: Context window mechanic

## Goal

Implement the central tension of the game in src/sim/context.ts and wire it into combat: one context bar with a sweet spot, where every power costs tokens.

## Scope

- Window size per model, baseline from prompt, tools, skills and memories
- Output tokens per activation and enemy noise segments
- Zone effects: Cold guess chance, Focused bonus, Rot slowdown
- Overflow auto-compaction and compaction policy (70/80/90 or never)
- Context-bending items (Concise, Summarizer, Brute Force, Long Context, .gitignore)
- Context events in the log

## Out of Scope

- Context bar visuals (E006)
- Full item roster and balance (E005)
- Meta-progression and lint rules

## Definition of Done

- [ ] Zone thresholds and compaction behave as in the design proposal section 5
- [ ] Cold-zone rolls use the seeded RNG and appear in the log
- [ ] Property tests: fill never exceeds the window and noise clears on compaction
- [ ] Combat golden logs updated and reviewed
