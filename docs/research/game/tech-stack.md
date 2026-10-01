---
title: Tech stack recommendation
summary: Browser stack for an AI-built deterministic auto-battler. Recommends Vite 8 + TS + Preact/Signals DOM UI + Canvas2D juice over Phaser/Pixi; includes architecture.
keywords: [tech-stack, typescript, vite, preact, determinism, testing, architecture, save-system]
type: research
status: active
updated: 2026-10-01
related: [game-design-proposal.md, game-design-references.md, tech-stack-architecture.md]
---

# Tech stack recommendation

## Contents
- 1. Requirements recap
- 2. Candidates (current versions)
- 3. Recommendation
- 4. Architecture
- 5. Testing strategy (AI-agent friendly)
- 6. tsconfig essentials
- 7. Budgets
- 8. Risks and mitigations
- 9. Sources

Versions were checked with `npm view` on 2026-10-01. Bundle sizes were measured from
jsDelivr builds (minified / gzip -9).

## 1. Requirements recap

- Deterministic, seeded simulation, fully separate from rendering. It must run
  headless in Node for unit tests and balance sims of 1000+ runs.
- A UI-heavy terminal/IDE look: lots of text, panels, tooltips, logs. Few sprites.
- Vite, Vitest, Playwright (e2e + screenshots), strict TypeScript, small bundle.
- All code is written by LLM agents. That favours APIs heavily represented in
  training data, plain TypeScript, few framework conventions, and assertable text.

## 2. Candidates (current versions)

| Option | Version (npm latest) | Released | min / gzip | Notes |
|---|---|---|---|---|
| Phaser | 4.2.1 | v4.0 was 2026-04-10 | 1376 kB / 352 kB | New node-based WebGL renderer, filters, GPU layers. v3->v4 migration is "minimal" for standard objects ([Phaser 3 vs 4](https://phaser.io/news/2026/05/phaser-3-vs-phaser-4), [renderer](https://phaser.io/news/2026/04/phaser-4-renderer-faster-cleaner-and-built-for-modern-games)) |
| PixiJS | 8.21.0 | 2026-09-30 | 828 kB / 233 kB (full; tree-shakable ESM) | Renderer only. WebGPU/WebGL, experimental Canvas renderer (8.16), HTML-in-Canvas textures (8.18/8.19) ([blog](https://pixijs.com/blog), [June 2026](https://pixijs.com/blog/june-2026)) |
| Excalibur | 0.32.0 | 2026-09 | 574 kB / 147 kB | Still 0.x. Release theme is DX/perf ([v0.32.0](https://github.com/excaliburjs/Excalibur/releases/tag/v0.32.0)) |
| KAPLAY | 3001.0.19 (v4000 still alpha.27) | 2026-05 | 189 kB / 70 kB | v4000 was planned for Q1 2026 and is still alpha ([roadmap](https://github.com/kaplayjs/kaplay/wiki/KAPLAY-Roadmap-2026), [alpha 27](https://kaplayjs.com/blog/release-v4000-alpha-27/)) |
| Preact + Signals | preact 10.29.8 (11.0.0 published 2026-09-30), @preact/signals 2.11.3 | stable | 11 kB / 5 kB | JSX, so React knowledge transfers. Fine-grained signals |
| Svelte | 5.57.1 | stable | compiler | Good DX, small output. LLMs often mix Svelte 4 and 5 (runes) syntax |

Tooling (latest): **Vite 8.3.2** (Rolldown-based), **Vitest 5.0.3**, **@playwright/test 1.63.0**,
**TypeScript 7.0.2** (native Go compiler; `typescript-eslint` 8.71 still requires
TS <6.1), **TypeScript 6.0.3** (last JS-based compiler), **Biome 2.5.15**, **fast-check 4.10.2**,
**zzfx 1.3.2**, **@fontsource/jetbrains-mono 5.3.0**, **@preact/preset-vite 2.10.6** (supports Vite 8). Node is 24.19 locally.

### Assessment

- **Phaser 4**: the strongest "game engine" choice, but a poor fit here. (a) Most of
  our screen is text, panels and tooltips, which Phaser handles badly compared with
  the DOM (layout, wrapping, selection, accessibility). (b) Phaser's scene/loop model
  pulls game logic into the renderer, so we would have to fight it to keep the sim
  pure. (c) It is the biggest bundle (352 kB gz). (d) v4 is 6 months old, so LLM
  knowledge is mostly Phaser 3 and agents will produce v3-isms. It's a good choice for
  a sprite-heavy action game, and that isn't our game.
- **PixiJS v8**: an excellent renderer and decoupled by design. But the UI would still
  live in the DOM, so Pixi would only be for effects. Keep it as an **escape hatch** if
  the Canvas2D overlay can't keep up (it will for 1–5 units and some particles).
- **Excalibur / KAPLAY**: smaller communities and less LLM training data. 0.x/alpha
  churn. KAPLAY's global-function style is fun but works against a strict, modular,
  testable architecture.
- **Svelte 5**: a fine choice technically. We lose on LLM reliability (runes vs
  legacy syntax) and on how easily React/JSX knowledge transfers.
- **Preact + Signals + DOM**: text-first fits the terminal aesthetic. Playwright can
  assert on *text and roles* instead of pixels, which is a big win for AI-written
  tests. JSX is the most LLM-familiar UI syntax. Signals give cheap per-tick updates
  for combat playback. The bundle is tiny.

## 3. Recommendation

**Vite 8 + TypeScript (strict) + Preact 10 + @preact/signals for all UI (including the
combat view built from DOM panels), and a single Canvas2D overlay for juice
(particles, scanlines). The sim core is pure TypeScript with zero dependencies.**

| Layer | Choice | Version pin |
|---|---|---|
| Build/dev | Vite | `^8.3.2` |
| Language | TypeScript, `strict` plus extras | `7.0.2` for `tsc --noEmit` (fast). Fall back to `~6.0.3` if a tool needs the TS JS API |
| UI | Preact + @preact/signals + @preact/preset-vite | `preact ~10.29.8`, `@preact/signals ^2.11.3`, preset `^2.10.6` |
| Effects | Canvas2D overlay + Web Animations API (CSS) | none |
| Lint/format | Biome (no dependency on the TS JS API, so it works with TS 7) | `^2.5.15` |
| Unit/sim tests | Vitest (node env for sim, happy-dom only for UI units) | `^5.0.3` |
| Property tests | fast-check (sim invariants) | `^4.10.2` |
| E2E/screens | @playwright/test (Chromium only in CI) | `^1.63.0` |
| Audio | zzfx (procedural SFX, about 1 kB) | `^1.3.2` |
| Fonts | @fontsource/jetbrains-mono, self-hosted (stable screenshots, offline) | `^5.3.0` |
| Scripts | Node 24 native type stripping (`node scripts/sim.ts`), no tsx needed | Node ≥24 |

Why Preact 10 and not 11: 11.0.0 was published the day before this research. LLM
knowledge and the ecosystem are on 10.x. Re-evaluate after the slice. The upgrade is
expected to be small, because we use no `preact/compat`.

## 4. Architecture

Moved to [tech-stack-architecture.md](tech-stack-architecture.md).

## 5. Testing strategy (AI-agent friendly)

| Level | Tool | What |
|---|---|---|
| Unit | Vitest (node) | Every effect, zone threshold, map rule, shop rule |
| Property | fast-check | "Fill is never <0 or >window after compaction", "every fight ends ≤ Deadline+30s", "same seed gives the same log" |
| Golden | Vitest snapshots | 20 fixed seeds -> SHA of combat log and run summary. Intended balance changes update the snapshots in the same PR |
| Balance | `node scripts/sim.ts --runs 1000 --bot greedy` | Win rate per harness, item pick/win rates, fight-length histogram. Output as JSON and Markdown table |
| E2E | Playwright 1.63 | `/?seed=42&fx=off&speed=skip`: play a scripted run via clicks plus `window.__game`. Assert on text and roles |
| Visual | Playwright `toHaveScreenshot` | Key screens only (map, shop, combat paused at tick N), fonts self-hosted, animations disabled, `page.clock` fixed ([guide](https://qaskills.sh/blog/visual-testing-animation-freeze-strategies)) |

Key rules: the UI never generates randomness. The playback clock is injectable. E2E
uses `speed=skip` so tests run in seconds.

## 6. tsconfig essentials

`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noImplicitOverride`, `verbatimModuleSyntax`, `erasableSyntaxOnly` (lets Node 24 run
`.ts` scripts directly: no enums or namespaces, use `as const` unions), `moduleResolution: bundler`,
`jsx: react-jsx` + `jsxImportSource: preact`.

## 7. Budgets

- Initial JS ≤120 kB gzip (Preact ~5 kB; most of the budget goes to content and UI).
- Fonts ≤100 kB (one mono family, 2 weights, latin subset).
- `src/sim` has zero runtime dependencies.
- Balance sim speed: ≥200 full runs/s on one core (to keep `sim.ts` usable in CI).

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| A DOM combat view looks static or "web-app-like" | Invest in juice early (typed text, shake, pops). Pixi overlay as a fallback |
| TS 7 tooling gaps (no stable JS API yet) | Biome instead of typescript-eslint. Pin `typescript@~6.0.3` if any tool breaks |
| Sim/UI drift (logic leaks into components) | Lint test for imports, reducer-only state, PR review checklist |
| Preact 11 migration | Avoid `preact/compat`, keep components simple |
| Float non-determinism | Integer-only sim, enforced by a property test across seeds |

## 9. Sources

- npm registry (`npm view <pkg> version dist-tags time`), queried 2026-10-01
- [Phaser 4 released (GameFromScratch)](https://gamefromscratch.com/phaser-4-released/), [Phaser v4 changelog](https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/CHANGELOG-v4.0.0.md)
- [Phaser 3 vs 4](https://phaser.io/news/2026/05/phaser-3-vs-phaser-4)
- [PixiJS v8 launch](https://pixijs.com/blog/pixi-v8-launches), [PixiJS 8.16](https://pixijs.com/blog/8.16.0)
- [Excalibur v0.32.0](https://github.com/excaliburjs/Excalibur/releases/tag/v0.32.0)
- [KAPLAY roadmap 2026](https://github.com/kaplayjs/kaplay/wiki/KAPLAY-Roadmap-2026)
- [Web game engines compared 2026](https://app.cinevva.com/guides/web-game-engines-comparison)
- [Playwright canvas testing](https://scrolltest.com/playwright-canvas-chart-testing/)
