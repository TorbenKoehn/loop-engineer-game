---
id: T001
epic: E001
title: Scaffold Vite, Preact and strict TypeScript app
summary: "Create the Vite 8 + Preact 10 + signals app with strict TypeScript (tsc 7) and the src/ layout, extending the existing package.json scripts."
keywords: ["scaffold", "vite", "preact", "typescript", "strict", "signals"]
type: task
status: ready
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

- [ ] `npm run dev` serves a placeholder Preact page and `npm run build` succeeds
- [ ] `tsc --noEmit` passes with `strict` enabled
- [ ] Existing harness:* scripts and devDependencies in package.json are unchanged
- [ ] src/sim, src/content and src/ui exist with a minimal module each

## Subtasks

- [ ] Add vite, preact, @preact/signals, @preact/preset-vite as dependencies
- [ ] Add dev, build, preview and typecheck scripts without removing existing ones
- [ ] Write tsconfig.json (strict plus extras) and vite.config.ts
- [ ] Create index.html, src/main.tsx and a placeholder App component
- [ ] Create src/sim, src/content, src/ui stubs with an import-boundary note and verify build and typecheck

## Notes

## Log

- 2026-10-01: created
