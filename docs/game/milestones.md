---
title: Milestones M1-M3
summary: Milestone plan to an AA-quality complete game - M1 vertical slice, M2 full content, M3 polish and AA - with scope and measurable exit criteria for each.
keywords: [milestones, roadmap, exit-criteria, scope, quality, aa]
type: gdd
status: active
updated: 2026-10-01
related: [vertical-slice.md, vision.md, core-loop.md, ../architecture/testing.md, ../architecture/overview.md]
---

# Milestones

Northstar: the complete game in AA quality. Each milestone ends only when all its exit
criteria pass; criteria are measured by tools where possible (balance sim, CI, Playwright).

## M1: Vertical slice

Phase 1 only, two harnesses, every system real. Full scope and exit criteria:
[vertical-slice](vertical-slice.md).

## M2: Full content

**Scope**

- Phases 2 Test and 3 Deploy with their enemies, elites and bosses
  ([phase 2](content/phase-2-test.md), [phase 3](content/phase-3-deploy.md)); Copy-Paste
  Clone in phase 1.
- Harnesses Swarm Orchestrator and YOLO Mode; all 6 system prompts.
- All 36 tools, 24 skills, 16 memories, 16 events, all traits and breakpoints.
- Sub-agents, Prune service, phase transitions, run end after phase 3.
- Meta: Training Data, the full unlock tree, AGENTS.md with 3 lines, 10 lessons.
- Lint rules, Endless loop, daily seed, achievements, lifetime stats, codex.
- String tables for all text, pseudo-locale.

**Exit criteria**

| # | Criterion |
|---|---|
| 1 | Full-run win rate with the greedy bot: 35–65% for Terminal Purist and IDE Companion, 25–60% for Swarm and YOLO (1000 runs each) |
| 2 | Per-phase boss win rates within the targets in the phase content docs |
| 3 | No tool, skill or memory appears in > 40% of winning loadouts; every archetype in [skills](content/skills.md) within ±10 points of the mean win rate |
| 4 | Every item is picked by the bot in ≥ 2% of runs where it is offered (no dead content) |
| 5 | Median fight lengths per encounter type within the [core loop](core-loop.md) targets in every phase |
| 6 | Golden logs on 30 seeds covering all three phases and Endless loop 2; byte-identical in CI |
| 7 | Saves from M1 load via migration (tested); replay equals snapshot on 200 bot runs |
| 8 | Balance sim speed ≥ 200 full runs per second per core |
| 9 | Every content item has a string key, a plain-English line and a passing content validation test |

## M3: Polish and AA

**Scope**

- Juice: the full catalogue in [juice and audio](ux/juice-audio.md), particles, boss
  layer breaks, polished compaction moment.
- Audio: complete SFX set, music for menu and three phases plus boss variants, mixing.
- Onboarding: tutorial with pauses, first-time tips, progressive disclosure, codex,
  "why did I lose" hints ([onboarding](ux/onboarding.md)).
- Accessibility and settings: everything in [accessibility](ux/accessibility.md),
  including remapping, screen-reader summaries and all themes.
- Art: ASCII portraits for every unit, logo, title screen, unlockable glyph sets.
- Balance: human playtests feed tuning; difficulty curve across lint levels.
- Performance, copy edit, bug bar.

**Exit criteria**

| # | Criterion |
|---|---|
| 1 | 7 of 10 first-time testers explain the context bar after the tutorial; 8 of 10 can name why they lost from the summary |
| 2 | Playtest: median "would play another run" ≥ 4 of 5; median session ≥ 2 runs |
| 3 | axe-core: 0 serious or critical violations on all screens; keyboard-only Playwright run completes a full run |
| 4 | All themes pass the contrast test; colour-vision screenshot tests reviewed; no clipping at 150% text in 1280 × 720 |
| 5 | Reduced motion and reduce flashing verified on every juice effect (checklist) |
| 6 | 60 fps during combat playback at 4x on a mid-range laptop (Playwright trace, ≤ 16.7 ms p95 frame) |
| 7 | Initial JS ≤ 120 kB gzip, fonts ≤ 100 kB, first interactive ≤ 2 s on a throttled "Fast 4G" profile |
| 8 | Zero known crashes or desyncs: 10 000 bot-run saves replay identically |
| 9 | Pseudo-locale smoke run passes; all strings reviewed in a copy pass |
| 10 | Lint level 10 is shipped by the expert bot in 15–35% of runs; level 23 is possible (≥ 1% with the best bot) |

## Order of work inside each milestone

1. Sim and content first (headless, tested), then run reducer, then UI, then juice.
2. The balance sim runs in CI from the first fight onwards; numbers in the GDD are
   starting points, and the GDD is updated when the sim changes them.
3. Every milestone ends with a retro and an update of these docs.
