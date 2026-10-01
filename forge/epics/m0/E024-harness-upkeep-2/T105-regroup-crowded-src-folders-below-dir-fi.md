---
id: T105
epic: E024
title: Regroup crowded src folders below dir_files warn_at
summary: "Mechanical git mv of files out of eight crowded src folders into topic subfolders or siblings, fixing only import paths and doc references, so no dir_files or dir_subdirs warning remains."
keywords: ["dir-files", "restructure", "git-mv", "folders", "imports", "src-run", "sim-combat"]
type: task
status: in-progress
priority: p1
model: opus
size: M
depends_on: [T102, T104, T067, T072]
updated: 2026-10-01
related: ["EPIC.md", "../../../retros/RT003-third-retro-e003-e004-e006-run-and-ui-ba.md"]
---

# T105: Regroup crowded src folders below dir_files warn_at

## Goal

Eight code folders sit above the `dir_files` warn_at of 10, `src/run` at the error limit
of 15, so every feature task that adds a file there must make an ad hoc folder decision
(RT003 Also seen, R037 F4, R049 F1). After this task each folder is at most 10 files and
10 subfolders, with no behaviour change: files are moved with `git mv`, and only import
paths and path references change.

## Context

- Epic: [E024](EPIC.md); [RT003 proposal P1](../../../retros/RT003-third-retro-e003-e004-e006-run-and-ui-ba.md)
- `npm run harness:lint` output (the `dir_files`, `dir_subdirs` findings for the eight folders below)
- `docs/architecture/INDEX.md`, then each doc whose `related_code` names a moved file (run-state.md, sim-core.md, event-log.md, content-model.md, ui.md)
- `.claude/skills/delegate/SKILL.md` step 3, `.claude/skills/delegate/parallel.md`, `.claude/skills/plan-epic/SKILL.md` step 4 (they name `src/run/combat.test.ts`, `src/ui/screens/placeholder.tsx` and folder counts)
- Out of scope: renaming or splitting modules, changing exports or code (T108 splits `apply.ts`); changing the strings generator or `areas.gen.ts` format; budget values; edits to `forge/` history files.

## Acceptance Criteria

- [ ] `npm run harness:lint` shows no `dir_files` or `dir_subdirs` warning for `src/run`, `src/sim/combat`, `src/sim/combat/context`, `src/sim/combat/enemy`, `src/content`, `src/content/strings`, `src/ui/screens`, `src/ui/theme` or any folder receiving files, and no `dir_depth` error
- [ ] `git diff --cached -M --name-status` lists every moved file as `R`, and `npm run harness:diff` production lines are import/export path or path-string edits only (Log states the number)
- [ ] `grep -rn` for each old path in `docs/`, `.claude/`, `tools/` and `CLAUDE.md` returns nothing, and harness lint reports no broken `related_code` or related path
- [ ] `npx vitest run tools/golden` passes without `npm run golden:update`, and `npm run content:index` leaves `src/content/strings/areas.gen.ts` unchanged
- [ ] `npm run check` exits 0, including build and e2e

## Subtasks

- [ ] `dir_depth` is 4: `src/sim/combat/context` and `src/sim/combat/enemy` cannot get subfolders, so move files to siblings (e.g. compaction to `src/sim/combat/compaction/`, traits and armor test to `src/sim/combat/traits/`)
- [ ] `src/run`: e.g. `combat/` (combat, combat.test, boss.test), rewards and shop with tests into `nodes/`
- [ ] `src/sim/combat`: e.g. resolve, fire, end, deadline with tests into one turn-loop subfolder
- [ ] `src/content`: text and validate (with tests) into `text/` and `validation/`; merge one-file dirs (e.g. `memories/`) so dirs drop to 10; `strings/`: move `en.test.ts` out
- [ ] `src/ui/screens`: node screens (reward, shop, discard, prompt-pick and T067's screens) into a subfolder; `src/ui/theme`: screen stylesheets into `theme/screens/`; recount after T067, fix imports with tsc, update doc and skill paths

## Notes

- 2026-10-01: Source: RT003 P1, widened by the orchestrator to all eight folders as one mechanical move. Layout in Subtasks is a suggestion; the implementer picks names by coupling and records the final map in the Log.
- 2026-10-01: Must run alone: no other task touching `src/`, `tools/balance/` or `tools/golden/` may be in flight. Waits for T067 (adds three files to `src/ui/screens`) and T072 (`tools/balance` imports `src/run`). Ordered after T102 so check covers e2e, and T104 per the orchestrator's order.
- 2026-10-01: Allowed paths: `src/**`, `tools/balance/**`, `tools/golden/**`, `tools/content/**`, `tests/e2e/**`, `docs/architecture/**`, `.claude/skills/**`, `CLAUDE.md`, `biome.jsonc`, `vite.config.ts`.
- 2026-10-01: `task_files_changed` (15, warn) will be exceeded by design (one move, ~40 renames plus importers). Override reason for the Log: pure renames with import-only edits, reviewed as one move map.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus) - runs alone
