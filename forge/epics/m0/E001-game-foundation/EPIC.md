---
id: E001
title: Game foundation
summary: "Toolchain and deterministic base for Loop Engineer: Vite/Preact/strict TS scaffold, Biome budgets, seeded forkable RNG, event-log golden tests, Playwright smoke and a unified check."
keywords: ["foundation", "vite", "typescript", "rng", "testing", "tooling"]
type: epic
status: ready
priority: p0
milestone: m0
updated: 2026-10-01
related: ["../../../../docs/research/game/game-design-proposal.md", "../../../../docs/research/game/tech-stack.md"]
---

# E001: Game foundation

## Goal

Stand up the buildable, testable skeleton of the game so every later epic can add sim, content and UI on a green, budget-enforced base. Stack: Vite 8, strict TypeScript (tsc 7), Preact 10 + signals, Biome 2.5, Vitest 5 + fast-check, Playwright.

## Scope

- Vite + Preact + strict TypeScript app scaffold, extending the existing package.json
- Biome config mirroring the code budgets (file and function length, comments)
- Pure integer seeded RNG with fork support in src/sim
- Event log types and golden-log test harness
- Playwright smoke test
- One unified check script chaining tsc, biome, vitest and the harness

## Out of Scope

- Any combat, run or content logic (E002-E005)
- Real UI beyond a placeholder page (E006)
- CI pipelines and deployment
- Audio, fonts and Canvas2D effects

## Definition of Done

- [ ] T001-T006 are done and reviewed
- [ ] `npm run check` passes from a clean checkout
- [ ] src/sim has no Math.random, Date or DOM usage, enforced by a test
- [ ] Golden-log harness and Playwright smoke run via documented scripts
