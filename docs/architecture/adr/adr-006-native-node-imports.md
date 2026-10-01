---
title: ADR-006 Native Node imports with .ts extensions
summary: All code under src/ uses relative imports with explicit .ts/.tsx extensions and erasable-only TypeScript so sim, content, run and tools/balance run natively on Node 24 without a bundler.
keywords: [adr, imports, node, typescript, erasable-syntax, extensions, tooling]
type: adr
status: active
updated: 2026-10-01
related: [../overview.md, ../testing.md, adr-001-tech-stack.md, adr-002-deterministic-sim.md]
---

# ADR-006: Native Node imports

Status: accepted, 2026-10-01.

## Context

The sim, content and run modules are pure and are also executed headless by
`tools/balance` (thousands of runs). Node 24 strips types natively, but only for
erasable syntax and only with fully specified import paths. Requiring a bundler or a
runner (tsx, ts-node) to run balance sweeps adds startup cost, config and drift between
what the browser builds and what the tools run.

## Decision

- All code under `src/` uses relative imports with explicit `.ts`/`.tsx` extensions
  (`import { fork } from './rng.ts'`). No path aliases, no extensionless specifiers.
- Only erasable TypeScript syntax: no `enum`, no `namespace`, no constructor parameter
  properties. Use union types and `as const` objects instead.
- Sim, content, run modules and `tools/balance` run directly with `node` on Node 24.

Enforcement:

- `tsconfig`: `allowImportingTsExtensions` and `erasableSyntaxOnly`.
- Biome `useImportExtensions`, if available in the pinned Biome version.
- The architecture import-rule test (T007) fails on extensionless or aliased imports.

## Consequences

- Balance tooling starts instantly and runs the exact code the game ships.
- Every import is slightly more verbose; Biome and the editor can auto-fix extensions.
- Some TypeScript features are off limits; this is deliberate.
- The bundler (Vite) must accept `.ts` extensions, which it does.

## Alternatives

- Bundler or runner for tools (tsx, esbuild): rejected, extra moving part and drift.
- Path aliases: rejected, Node does not resolve them natively.
- Extensionless imports with a loader: rejected, needs a custom loader.
