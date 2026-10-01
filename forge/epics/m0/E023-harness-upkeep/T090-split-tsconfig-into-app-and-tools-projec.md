---
id: T090
epic: E023
title: Split tsconfig into app and tools projects
summary: "Separate tsconfig projects: app (src, bundler, DOM) and tools (tools, configs, nodenext, node types), both with exactOptionalPropertyTypes and the ADR-006 flags; npm run typecheck checks all."
keywords: ["tsconfig", "nodenext", "exactOptionalPropertyTypes", "typecheck", "project-references", "adr-006"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T088]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T090: Split tsconfig into app and tools projects

## Goal

One shared tsconfig uses bundler resolution, so tsc no longer rejects extensionless
imports in `tools/`, which Node 24 runs natively; DOM and `vite/client` types leak into
tools and `node` types into game code (R001 F1). Split it into an app project and a tools
project (references or `tsc -b`) and add `exactOptionalPropertyTypes` (R001 F2) while the
codebase is small. Both keep `allowImportingTsExtensions` and `erasableSyntaxOnly` (ADR-006).

## Context

- Epic: [E023](EPIC.md)
- [R001 F1-F2](../../../reviews/E001/R001-T001.md), [ADR-006 native Node imports](../../../../docs/architecture/adr/adr-006-native-node-imports.md)
- [Tech stack section 6 "tsconfig essentials"](../../../../docs/research/game/tech-stack.md)
- `tsconfig.json`, `package.json` (`typecheck` script), `vite.config.ts`
- Out of scope: Biome `useImportExtensions` and the arch import test (T007); changing compile targets or the Vite build.

## Acceptance Criteria

- [ ] `npm run typecheck` exits 0 and type-checks both the app project (src) and the tools project (tools, vite.config.ts)
- [ ] Probe: dropping `.ts` from one relative import in `tools/check/run.ts` makes `npm run typecheck` exit non-zero (Log names the error)
- [ ] Probe: `process.env` in `src/ui/app.tsx` and `document` in `tools/check/run.ts` each make `npm run typecheck` exit non-zero; `node:` imports in `src/**/*.test.ts` still type-check
- [ ] `exactOptionalPropertyTypes`, `allowImportingTsExtensions` and `erasableSyntaxOnly` are true in both projects; probe: an `enum` in src or tools fails typecheck
- [ ] `npm run check` exits 0

## Subtasks

- [ ] Shared base config for strict flags; app and tools configs extend it
- [ ] Decide where src test files live (third project or app project with node types for `*.test.ts` only)
- [ ] Fix the five exactOptionalPropertyTypes errors in tools/harness (util.ts, scan.ts, gen/index.ts)
- [ ] Update docs that describe the tsconfig (tech-stack or architecture) if they name one file

## Notes

- 2026-10-01: Sources: forge/HANDOFF.md, R001 F1-F2. allowImportingTsExtensions and erasableSyntaxOnly are already in tsconfig.json; keep them in both projects.
- 2026-10-01: Probe today: `--exactOptionalPropertyTypes` gives 5 errors (util.ts 3, scan.ts 1, gen/index.ts 1); nodenext on tools gives 0.
- 2026-10-01: depends on T088 (both edit tools/harness/gen/index.ts). Held in backlog: start after T004 and T005 land (both may add test or config files the split must place) and to respect `wip_ready`. DoR otherwise met.

## Log

- 2026-10-01: created
