---
id: E011
title: Juice, audio, settings and tutorial
summary: "M1 feel and onboarding: fx bus with pops, flashes, shake, hit-stop, compaction moment; zzfx SFX; settings (volume, reduced motion, CRT); keys; tutorial fight; ASCII portraits."
keywords: ["juice", "audio", "settings", "tutorial", "accessibility", "ascii-art", "m1"]
type: epic
status: backlog
priority: p1
updated: 2026-10-01
related: ["../../../docs/game/ux/juice-audio.md", "../../../docs/game/ux/onboarding.md", "../../../docs/game/ux/accessibility.md", "../../../docs/game/ux/art-direction.md", "../../../docs/architecture/ui.md", "../../../docs/game/vertical-slice.md"]
---

# E011: Juice, audio, settings and tutorial

## Goal

M1 vertical slice. After this epic fights feel responsive (pops, shake, compaction moment, SFX), every effect respects reduced motion, a first-time player is taught the context bar by the tutorial fight, and slice units have ASCII portraits.

## Scope

- Fx bus and render-fx overlay: number pops, flashes, shake, hit-stop, typed text, compaction moment ([juice and audio](../../../docs/game/ux/juice-audio.md))
- zzfx SFX set with rate limits and pitch chains; master and SFX buses
- Settings subset: master/SFX volume, reduced motion, CRT toggle ([accessibility](../../../docs/game/ux/accessibility.md))
- Keys Space, 1–4, L, B, Esc
- Tutorial first-run flow and scripted pauses ([onboarding](../../../docs/game/ux/onboarding.md))
- ASCII portraits for 2 harnesses and all slice enemies

## Out of Scope

- Music, particles catalogue, boss layer breaks (E019)
- First-time tips, codex, remapping, text size, screen-reader summaries, other themes (E020, E021)

## Definition of Done

- [ ] All E011 tasks done with approved reviews
- [ ] With reduced motion on, every juice effect uses its reduced variant (unit test over the effect map)
- [ ] The tutorial fight log equals the same fight without the tutorial (determinism test)
- [ ] Runtime dependencies stay within deps_runtime (preact, signals, zzfx)
