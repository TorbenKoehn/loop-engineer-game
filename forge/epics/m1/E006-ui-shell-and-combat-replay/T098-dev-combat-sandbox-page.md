---
id: T098
epic: E006
title: Dev combat sandbox page
summary: "A first visible build: the browser start page runs a real Phase-1 fight with M1 content and replays it with bars, tool charge and a log in the Crimson palette."
keywords: ["task", "combat", "sandbox", "page"]
type: task
status: done
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

- [x] `npm run dev` start page offers harness + encounter selection and a Run button; a fight resolves via `resolveCombat` and replays over time (speed 1x/4x toggle)
- [x] Trust/Guardrails, enemy Severity, tool charge and the combat log update from the event log; the outcome (win/loss/timeout) is shown
- [x] Colours come from CSS custom properties matching the Crimson tokens in art-direction.md (red brand), WCAG AA text contrast
- [x] A Vitest test renders the sandbox (or its pure view-fold helper) for a fixed seed and asserts final Trust/Severity values match the sim result
- [x] `npm run build` succeeds and the import-rule test passes

## Subtasks

- [x] Minimal content-to-CombatInput adapter for the sandbox (note it for T042)
- [x] Pure view fold: events up to time t -> view state
- [x] Preact components and Crimson CSS tokens
- [x] Timer-driven replay with speed toggle
- [x] Test + build

## Notes

- Adapter `src/ui/sandbox/adapter.ts` is throwaway: starter loadout at v1, no prompt, policy 80; T042 replaces it with the real CombatInput builder.
- CSS is linked from `index.html` (`src/ui/theme/crimson.css`, `sandbox.css`): the arch checker only allows `.ts/.tsx` imports in src/ui.
- Tool charge is derived from `toolFired` times in the log (no per-tick charge events); names come from `content/strings/en.ts` until `t()` (T055).
- JetBrains Mono is not self-hosted yet (no binary assets added); local monospace fallback stack in `--font-mono`.
- budget_override task_diff_lines: 2309 production lines; reason: user asked to see the game early; throwaway sandbox pulled forward and reviewed as one unit; components are candidates for reuse in T059; orchestrator-approved 2026-10-01

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus) - user asked to see something playable; pulled forward
- 2026-10-01: AC1 verified: index.html -> src/main.tsx -> App renders Sandbox (harness cards, Phase-1 encounter select, seed, Run); runFight calls resolveCombat; createPlayer replays on rAF with 1x/2x/4x, pause, skip, replay; replay.test.ts 'advances by frame time x speed' (manual clock); headless Chrome screenshot of `vite preview` showed the page mid-replay
- 2026-10-01: AC2 verified: fold.ts folds damage/guard/heal/spawn/intentSet/toolFired/status*/resolved/fightEnd; charge from toolFired times (timeline.ts); log lines from describeTool/describeEnemy (log-text.ts); ResultStrip shows win/loss/timeout; npx vitest run src/ui (17 passed)
- 2026-10-01: AC3 verified: src/ui/theme/crimson.css on :root[data-theme=crimson]; src/ui/theme/contrast.test.ts checks all 17 tokens equal art-direction.md and text tokens >= 4.5 on bg/bg-panel/bg-raised, on-brand on brand/brand-deep (2 passed); no raw hex in components
- 2026-10-01: AC4 verified: src/ui/sandbox/fold.test.ts folds seed 'fold-test' p1e1 and asserts Trust == agentAfter.trust, damageTaken, Severity 0 x3, Severity lost == sum(stats.toolDamage); plus a Trust-loss fight and all 24 harness x encounter fights (5 passed)
- 2026-10-01: AC5 verified: npm run build exit 0 (69.1 kB JS, 24.9 kB gzip); tests/arch.test.ts passes; npm run check exit 0 (34 files, 276 tests)
- 2026-10-01: review requested
- 2026-10-01: rework: adapter fills spawnDefs (spawn verbs, split children) after T021; vitest src/ui 12 passed, check + build green
- 2026-10-01: addressed R030 (F1 exception noted, F2 document key handler + blur after Run, F3 token-dimmed resolved cards, F5 timeout test, sandbox.css trimmed 886 -> 855)
- 2026-10-01: done (R031)
