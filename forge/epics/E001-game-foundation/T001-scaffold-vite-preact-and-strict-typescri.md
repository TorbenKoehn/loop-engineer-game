---
id: T001
epic: E001
title: Scaffold Vite, Preact and strict TypeScript app
summary: "Create the Vite 8 + Preact 10 + signals app with strict TypeScript (tsc 7) and the src/ layout, extending the existing package.json scripts."
keywords: ["scaffold", "vite", "preact", "typescript", "strict", "signals"]
type: task
status: done
priority: p0
model: sonnet
size: S
updated: 2026-10-01
related: ["EPIC.md"]
---

# T001: Scaffold Vite, Preact and strict TypeScript app

## Goal

Scaffold a runnable Vite 8 app with Preact 10 and @preact/signals in strict TypeScript. Extend the existing package.json (keep the harness scripts) and create the src/ directory layout from the tech stack architecture.

## Context

- Epic: [E001](EPIC.md)
- Tech stack: [tech-stack.md](../../../docs/research/game/tech-stack.md) (sections 3 and 4)

## Acceptance Criteria

- [x] `npm run dev` serves a placeholder Preact page and `npm run build` succeeds
- [x] `tsc --noEmit` passes with `strict` enabled
- [x] Existing harness:* scripts and devDependencies in package.json are unchanged
- [x] src/sim, src/content and src/ui exist with a minimal module each

## Subtasks

- [x] Add vite, preact, @preact/signals, @preact/preset-vite as dependencies
- [x] Add dev, build, preview and typecheck scripts without removing existing ones
- [x] Write tsconfig.json (strict plus extras) and vite.config.ts
- [x] Create index.html, src/main.tsx and a placeholder App component
- [x] Create src/sim, src/content, src/ui stubs with an import-boundary note and verify build and typecheck

## Notes

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: vite dev served index.html and transformed /src/main.tsx (HTTP 200); npm run build exit 0 (12 modules, dist/ 21 kB, removed after)
- 2026-10-01: AC2 verified: npx tsc --noEmit exit 0 with strict + noUncheckedIndexedAccess; single tsconfig.json (bundler resolution, dom + node types) covers src, tools and vite.config.ts, so the CLAUDE.md check command is unchanged
- 2026-10-01: AC3 verified: only dev/build/preview/typecheck scripts added; harness:* scripts and the four original devDependencies untouched; npm run harness:check exit 0
- 2026-10-01: AC4 verified: src/sim/index.ts, src/content/index.ts, src/ui/app.tsx exist, each with an import-boundary comment; App imports both and renders
- 2026-10-01: npm test exit 0 (38 passed); biome=not run: T002
- 2026-10-01: review requested
- 2026-10-01: done (R001)
