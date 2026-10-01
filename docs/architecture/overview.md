---
title: Architecture overview
summary: Module map (sim, content, run, ui, render-fx, save, audio, debug, tools/balance), allowed dependency directions, data flow and enforcement rules.
keywords: [architecture, modules, dependencies, data-flow, layering]
type: doc
status: active
updated: 2026-10-01
related: [sim-core.md, content-model.md, run-state.md, ui.md, save.md, testing.md, adr/adr-001-tech-stack.md, adr/adr-006-native-node-imports.md]
---

# Architecture overview

Browser game, Vite 8 + strict TypeScript, Preact 10 + @preact/signals for a DOM UI, one
Canvas2D overlay for juice. The game logic is a pure, integer, seeded simulation that
runs identically in the browser, in Vitest and in the headless balance CLI.
Decisions: [ADR-001](adr/adr-001-tech-stack.md) to [ADR-005](adr/adr-005-save-action-log.md), [ADR-006](adr/adr-006-native-node-imports.md) (import convention).

## Module map

| Module | Responsibility | Runtime deps |
|---|---|---|
| `src/sim` | Combat simulation, context maths, RNG, integer helpers. `resolveCombat(input) -> CombatResult` | none |
| `src/content` | Typed game data (tools, skills, memories, enemies, encounters, events, harnesses, prompts, lessons, sounds, strings) and the effect DSL builders | none |
| `src/run` | Run state, actions and the reducer; map generation, rewards, shop, events, meta (TD, unlocks, lessons) | none |
| `src/save` | Save schema, versioned migrations, storage adapter, export/import string | browser APIs behind an adapter |
| `src/ui` | Preact screens, signals store, combat replay player, input, i18n `t()` | preact, @preact/signals |
| `src/render-fx` | Canvas2D overlay: particles, pops, flashes, CRT; screen shake via CSS | none |
| `src/audio` | zzfx SFX, music player, buses and ducking | zzfx |
| `src/debug` | `window.__game` hooks for Playwright and devs (dev and e2e builds only) | — |
| `tools/balance` | Headless CLI: bots, batch runs, balance reports (JSON + Markdown) | Node 24 |

## Dependency rules

An arrow means "may import from". Everything else is forbidden.

```
content  <- sim  (sim imports content *types* and DSL definitions, never data modules)
content, sim                <- run
content, run (types)        <- save
content, sim, run, save,
render-fx, audio            <- ui
sim (event types only)      <- render-fx, audio
content, sim, run, save     <- tools/balance, src/debug
```

Hard rules:

1. `src/sim` imports nothing outside `src/sim` and `src/content/types*`. No DOM, no
   `Date`, `Math.random`, `performance`, timers, `window`, `document`, `crypto`.
2. `src/run` is pure as well: same bans as `sim`. It calls `resolveCombat`.
3. Nothing imports from `src/ui`. `tools/balance` never imports `src/ui`, `render-fx`
   or `audio`.
4. `src/content` data modules import only `src/content` (builders and types).
5. No circular imports anywhere (Biome rule, budget `circular_deps = 0`).

Enforcement: a Vitest architecture test parses every import specifier under `src/` and
checks it against the table above, and greps `src/sim` and `src/run` for the banned
globals. Biome `noRestrictedImports` overrides per folder give editor feedback.

## Data flow

```
 input ──► ui: dispatch(Action) ──► run.apply(state, action)
                                        │  (fight node) resolveCombat(input) ──► outcome
                                        ▼
                               new RunState ──► signals store ──► screens re-render
                                        │
            replay player ◄── resolveCombat(state.combat.input) (recomputed, memoised)
                 │ events at 1x/2x/4x/skip
                 ├─► combat view state (pure fold over events)
                 ├─► render-fx (pops, shake, particles)
                 └─► audio (SFX by event kind)
 save: after each node, {seed, actions, snapshot} ──► localStorage
```

The combat event log is never stored in run state or saves: it is recomputed from the
stored combat input, which is cheap and deterministic.

## Source layout

```
src/
  sim/        rng.ts int.ts events.ts handlers/ combat/ (state damage effects targeting
              tick/ context/ compaction/ enemy/ traits/ status/ order/ rules/ mods/)
  content/    types/ dsl/ tools/ skills/ enemies/ encounters/ events/ strings/ text/
              validation/ harnesses.ts prompts.ts lessons.ts memories.ts text.ts validate.ts
  run/        state.ts actions.ts apply.ts gain.ts combat/ nodes/ map/ events/ meta/ build/
  save/       schema.ts migrations/ storage.ts codec.ts
  ui/         app.tsx store/ screens/ combat/ shell/ theme/ i18n.ts
  render-fx/  fx.ts overlay.ts shake.ts
  audio/      sfx.ts music.ts mixer.ts
  debug/      hooks.ts
tests/        e2e/ arch.test.ts   (combat goldens: tools/golden/fixtures)
tools/balance/ cli.ts bots/ report.ts
```

Folders: at most 10 files and 10 subfolders, depth 4; split by topic (T105). Code budgets from
`harness.config.json` apply: ≤ 300 code lines per TS file, ≤ 50 lines
per function, ≤ 4 parameters, complexity ≤ 10. Files split by concept, not by layer.
