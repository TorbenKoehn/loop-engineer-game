---
id: E023
title: Harness upkeep
summary: "Close the review and handoff follow-ups on the harness: milestone-grouped epics, .tsx in code budgets, app/tools tsconfig split, harness checks for budgets Biome cannot enforce, a hardened sim ban."
keywords: ["epic", "harness", "upkeep", "budgets", "tsconfig", "milestones", "biome"]
type: epic
status: ready
priority: p1
milestone: m0
updated: 2026-10-01
related: ["../../../HANDOFF.md", "../../../reviews/E001/R001-T001.md", "../../../reviews/E001/R002-T006.md", "../../../reviews/E001/R005-T002.md"]
---

# E023: Harness upkeep

## Goal

After this epic every budget in `docs/harness/budgets-table.md` is enforced by the tool it
names, `forge/` fits its own directory budgets, and `npm run check` type-checks `tools/` the
way Node 24 runs it. Sources: `forge/HANDOFF.md` (Pending follow-ups), R001 F1-F2,
R002 F3, R005 F1-F6 and the T002 Notes.

## Scope

- Epics grouped by milestone under `forge/epics/<milestone>/` (tooling, then migration).
- Review scaffolder titles within `fm_title_chars`; check runner shows spawn errors.
- `.tsx` files covered by the harness code budgets.
- Separate app and tools tsconfig projects; `exactOptionalPropertyTypes`; ADR-006 flags.
- Harness checks for nesting_depth, exports_per_module, imports_per_module,
  duplication_pct, ts_expect_error, eslint_disable and `@ts-nocheck`.
- src/sim determinism ban robust against aliases and `globalThis`; isolated ban tests.

## Out of Scope

- Changing budget values in `harness.config.json` (only `enforced_by` labels move).
- The architecture import-rule test (T007) and coverage gates (T008).
- New harness features beyond the listed follow-ups.

## Definition of Done

- [ ] `npm run check` exits 0 with every task of this epic done
- [ ] `npm run harness:lint` reports no `dir_subdirs` finding for `forge/epics`
- [ ] No budget in `docs/harness/budgets-table.md` is labelled `biome` unless a Biome rule enforces it (biome.jsonc names the rule)
- [ ] Removing the `.ts` extension from one relative import in `tools/` makes `npm run typecheck` fail
