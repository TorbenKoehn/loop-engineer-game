---
id: T098
epic: E006
title: Dev combat sandbox page
summary: "A first visible build: the browser start page runs a real Phase-1 fight with M1 content and replays it with bars, tool charge and a log in the Crimson palette."
keywords: ["task", "combat", "sandbox", "page"]
type: task
status: in-progress
priority: p0
model: opus
size: M
updated: 2026-10-01
related: ["EPIC.md"]
depends_on: [T012, T014, T018, T019, T020]
---

# T098: Dev combat sandbox page

## Goal

The user wants to see the game early. Until the real shell (T055) and combat screen (T059) exist, `npm run dev` shows a throwaway-but-tidy sandbox: pick a harness (Terminal Purist / IDE Companion) and a Phase-1 encounter, press Run, and watch the fight replay from the deterministic event log: agent Trust and Guardrails, enemy Severity bars, each tool's charge progress, damage pops as text, a scrolling combat log using the generated plain-English text, and the outcome. Crimson palette tokens from art-direction.md, JetBrains Mono-like monospace fallback, terminal look. Replaced by T055/T059 later.

## Context

- Epic: [E006](EPIC.md)
- docs/game/ux/art-direction.md (palette tokens), docs/game/ux/screens.md (combat screen layout)
- docs/architecture/ui.md, docs/architecture/overview.md (ui may import sim + content)
- src/sim/index.ts (resolveCombat), src/content/** (harnesses, tools, enemies/encounters, text.ts)

## Acceptance Criteria

- [ ] `npm run dev` start page offers harness + encounter selection and a Run button; a fight resolves via `resolveCombat` and replays over time (speed 1x/4x toggle)
- [ ] Trust/Guardrails, enemy Severity, tool charge and the combat log update from the event log; the outcome (win/loss/timeout) is shown
- [ ] Colours come from CSS custom properties matching the Crimson tokens in art-direction.md (red brand), WCAG AA text contrast
- [ ] A Vitest test renders the sandbox (or its pure view-fold helper) for a fixed seed and asserts final Trust/Severity values match the sim result
- [ ] `npm run build` succeeds and the import-rule test passes

## Subtasks

- [ ] Minimal content-to-CombatInput adapter for the sandbox (note it for T042)
- [ ] Pure view fold: events up to time t -> view state
- [ ] Preact components and Crimson CSS tokens
- [ ] Timer-driven replay with speed toggle
- [ ] Test + build

## Notes

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus) - user asked to see something playable; pulled forward
