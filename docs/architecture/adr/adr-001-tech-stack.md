---
title: ADR-001 Tech stack
summary: Use Vite 8, strict TypeScript (tsc 7 native, fallback 6), Preact 10 + signals, Canvas2D juice overlay, Biome, Vitest + fast-check, Playwright, zzfx and JetBrains Mono.
keywords: [adr, tech-stack, vite, typescript, preact, tooling]
type: adr
status: active
updated: 2026-10-01
related: [adr-002-deterministic-sim.md, adr-003-dom-ui.md, ../overview.md, ../../research/game/tech-stack.md]
---

# ADR-001: Tech stack

Status: accepted, 2026-10-01.

## Context

Loop Engineer is a text-heavy, deterministic auto-battler for desktop browsers. All code
is written by LLM agents, so we favour mainstream, well-documented APIs, strict types,
fast feedback and tests that assert on text. Research and version checks:
[tech-stack research](../../research/game/tech-stack.md).

## Decision

| Layer | Choice | Pin |
|---|---|---|
| Build/dev | Vite | `^8.3.2` |
| Language | TypeScript, strict + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `erasableSyntaxOnly` | `tsc` 7.0.x for type-checking; fall back to `~6.0.3` if a tool needs the TS JS API |
| UI | Preact + @preact/signals + @preact/preset-vite | `~10.29.8`, `^2.11.3`, `^2.10.6` |
| Effects | One Canvas2D overlay + CSS/Web Animations | none |
| Lint/format | Biome | `^2.5.15` |
| Tests | Vitest (node; happy-dom for UI units), fast-check | `^5.0.3`, `^4.10.2` |
| E2E/visual | @playwright/test, Chromium in CI | `^1.63.0` |
| Audio | zzfx (SFX), zzfxm-compatible music data | `^1.3.2` |
| Font | @fontsource/jetbrains-mono, self-hosted, latin subset | `^5.3.0` |
| Scripts | Node 24 native type stripping (`node tools/balance/cli.ts`) | Node ≥ 24 |

No enums or namespaces (erasable syntax only); `as const` unions instead.

## Consequences

- Tiny runtime (Preact ≈ 5 kB gz); the initial JS budget of 120 kB gz goes to content and UI.
- JSX is the most LLM-familiar UI syntax; signals give cheap per-frame updates in combat.
- Biome replaces ESLint because `typescript-eslint` does not support TS 7 yet.
- Two TS versions may coexist (7 for `tsc`, 6 for tools needing the JS API); pinned in
  `package.json` and documented.
- Preact 11 (released 2026-09-30) is deferred until after M1; avoiding `preact/compat`
  keeps the upgrade small.

## Alternatives considered

- **Phaser 4**: strong engine, but text/panels are weak, its scene loop pulls logic into
  rendering, 352 kB gz, and LLM knowledge is mostly Phaser 3.
- **PixiJS 8**: good renderer; kept as an escape hatch behind the `Fx` interface.
- **Excalibur, KAPLAY**: smaller communities, 0.x/alpha churn.
- **Svelte 5**: fine technically; LLMs mix runes and legacy syntax.
- **React 19**: larger bundle with no benefit over Preact for this UI.
