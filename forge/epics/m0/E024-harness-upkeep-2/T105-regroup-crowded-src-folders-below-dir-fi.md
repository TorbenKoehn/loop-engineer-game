---
id: T105
epic: E024
title: Regroup crowded src folders below dir_files warn_at
summary: "Mechanical git mv of files out of eight crowded src folders into topic subfolders or siblings, fixing only import paths and doc references, so no dir_files or dir_subdirs warning remains."
keywords: ["dir-files", "restructure", "git-mv", "folders", "imports", "src-run", "sim-combat"]
type: task
status: done
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

- [x] `npm run harness:lint` shows no `dir_files` or `dir_subdirs` warning for `src/run`, `src/sim/combat`, `src/sim/combat/context`, `src/sim/combat/enemy`, `src/content`, `src/content/strings`, `src/ui/screens`, `src/ui/theme` or any folder receiving files, and no `dir_depth` error
- [x] `git diff --cached -M --name-status` lists every moved file as `R`, and `npm run harness:diff` production lines are import/export path or path-string edits only (Log states the number)
- [x] `grep -rn` for each old path in `docs/`, `.claude/`, `tools/` and `CLAUDE.md` returns nothing, and harness lint reports no broken `related_code` or related path
- [x] `npx vitest run tools/golden` passes without `npm run golden:update`, and `npm run content:index` leaves `src/content/strings/areas.gen.ts` unchanged
- [x] `npm run check` exits 0, including build and e2e

## Subtasks

- [x] `dir_depth` is 4: `src/sim/combat/context` and `src/sim/combat/enemy` cannot get subfolders, so move files to siblings (e.g. compaction to `src/sim/combat/compaction/`, traits and armor test to `src/sim/combat/traits/`)
- [x] `src/run`: e.g. `combat/` (combat, combat.test, boss.test), rewards and shop with tests into `nodes/`
- [x] `src/sim/combat`: e.g. resolve, fire, end, deadline with tests into one turn-loop subfolder
- [x] `src/content`: text and validate (with tests) into `text/` and `validation/`; merge one-file dirs (e.g. `memories/`) so dirs drop to 10; `strings/`: move `en.test.ts` out
- [x] `src/ui/screens`: node screens (reward, shop, discard, prompt-pick and T067's screens) into a subfolder; `src/ui/theme`: screen stylesheets into `theme/screens/`; recount after T067, fix imports with tsc, update doc and skill paths

## Notes

- Orchestrator decision 2026-10-01 (R085 F1): option (a) - src/content/strings keeps 11-12 files (generated string registry folder; the generator scans one folder by design). Its dir_files warning is accepted; all other src folders are below warn_at.

- 2026-10-01: Source: RT003 P1, widened by the orchestrator to all eight folders as one mechanical move. Layout in Subtasks is a suggestion; the implementer picks names by coupling and records the final map in the Log.
- 2026-10-01: Must run alone: no other task touching `src/`, `tools/balance/` or `tools/golden/` may be in flight. Waits for T067 (adds three files to `src/ui/screens`) and T072 (`tools/balance` imports `src/run`). Ordered after T102 so check covers e2e, and T104 per the orchestrator's order.
- 2026-10-01: Allowed paths: `src/**`, `tools/balance/**`, `tools/golden/**`, `tools/content/**`, `tests/e2e/**`, `docs/architecture/**`, `.claude/skills/**`, `CLAUDE.md`, `biome.jsonc`, `vite.config.ts`.
- 2026-10-01: `task_files_changed` (15, warn) will be exceeded by design (one move, ~40 renames plus importers). Override reason for the Log: pure renames with import-only edits, reviewed as one move map.
- 2026-10-01: (resolved by orchestrator decision below) `src/content/strings` cannot drop below 12 files without a decision. It must hold the 10 `en-<area>.ts` modules plus `areas.gen.ts` (the generator scans only this dir and emits `./en-<area>.ts` imports; generator format is Out of scope, AC4 pins `areas.gen.ts` unchanged), so 11 is the floor and AC1's no-warning for this folder contradicts AC4/Out of scope. Options: (a) accept 11-12 here (move `en.ts` out for 11, still a warn); (b) allow a generator change so area modules live in `strings/areas/` (changes `areas.gen.ts`); (c) merge two area modules (code change). Everything else is done and green.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus) - runs alone
- 2026-10-01: move map (35 `git mv`): src/run/{combat,combat.test,boss.test}.ts -> src/run/combat/; src/run/{rewards,rewards.test,shop,shop.test}.ts -> src/run/nodes/; src/sim/combat/{resolve,resolve.test,fire,end,deadline,deadline.test}.ts -> src/sim/combat/tick/; src/sim/combat/context/{compaction,compaction.test,planned.test}.ts -> src/sim/combat/compaction/ (sibling, depth 4); src/sim/combat/enemy/{traits,traits.test,armor.test}.ts -> src/sim/combat/traits/ (sibling); src/content/{text.test,text-kinds.test}.ts and strings/en.test.ts -> src/content/text/; src/content/kinds.test.ts -> src/content/dsl/ ("DSL kind lists"); src/content/memories/index.ts -> src/content/memories.ts and testing/slice-doc.ts -> validation/slice-doc.ts (one-file dirs merged); src/ui/screens/{reward,reward.test,shop,discard} -> src/ui/screens/nodes/; src/ui/theme/{screens,map,reward,shop,nodes,run-end}.css -> src/ui/theme/screens/ (shell.css @imports). `src/content/text.ts` stays: docs/game/ux/localisation.md lists it in related_code and is outside the allowed paths. index.html sheets (fonts, crimson, zones, shell, combat) stay for the same reason.
- 2026-10-01: folder counts after: src/run 8 files/6 dirs, src/run/nodes 7, src/run/combat 3; src/sim/combat 8/9, tick 6, context 9, compaction 3, enemy 8, traits 3; src/content 10/10, text 7, dsl 6, validation 10, strings 12; src/ui/screens 8/3, screens/nodes 9; src/ui/theme 8/1, theme/screens 6. Max depth 4.
- 2026-10-01: AC1 partly verified: `npm run harness:lint` shows no dir_files/dir_subdirs warning for src/run, src/sim/combat, context, enemy, src/content, src/ui/screens, src/ui/theme or any receiving folder, no dir_depth error; src/content/strings still warns (12 files, see Notes Blocked by). Lint warnings 32 -> 29 (8 src dir warnings gone; new untracked/committed planner tasks added forge warnings meanwhile).
- 2026-10-01: AC2 verified: `git diff --cached -M --name-status` lists all 35 moves as R (076-100), 48 M; `npm run harness:diff` production=221 total=502, all production lines are import/export specifiers (Biome re-sorted and re-wrapped some) or path strings in comments; one `new URL('../../../docs/...')` in boss.test.ts. Override reason (task_files_changed 83 > 15): pure renames with import-only edits, reviewed as one move map.
- 2026-10-01: AC3 verified: grep -rnE over every old path in docs/, .claude/ (excl. worktrees), tools/ and CLAUDE.md returns nothing; harness lint reports no broken related_code. Updated related_code/paths in sim-core.md, event-log.md, run-state.md, content-model.md (+ flat one-module kind note), ui.md, overview.md source layout; delegate/SKILL.md, delegate/tests.md, plan-epic/SKILL.md.
- 2026-10-01: AC4 verified: `npx vitest run tools/golden` 16 passed without golden:update; `npm run content:index` -> "areas.gen.ts up to date (10 areas)", file unchanged.
- 2026-10-01: AC5 verified: `npm run check` exit 0 (tsc, biome, vitest 98 files/878 tests, build, e2e 26 passed, harness:check 0 errors).
- 2026-10-01: blocked on src/content/strings (Notes); all other work staged and green.
- 2026-10-01: AC1 verified with the orchestrator-accepted exception for src/content/strings (see Notes); status review
- 2026-10-01: done (R085)
