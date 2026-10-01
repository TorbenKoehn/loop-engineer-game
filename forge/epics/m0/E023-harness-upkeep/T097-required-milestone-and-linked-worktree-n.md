---
id: T097
epic: E023
title: "Required --milestone and linked worktree node_modules"
summary: "harness:new epic fails without --milestone, and Claude Code worktrees get node_modules symlinked from the main tree via worktree.symlinkDirectories instead of npm ci."
keywords: ["scaffold", "milestone", "worktree", "node_modules", "symlinkDirectories", "gitignore"]
type: task
status: backlog
priority: p2
model: opus
size: M
updated: 2026-10-01
related: ["EPIC.md", "../../../retros/RT001-first-retro-e001-foundation-and-early-e0.md", "T087-migrate-forge-epics-into-milestone-dirs.md"]
---

# T097: Required --milestone and linked worktree node_modules

## Goal

Two small setup fixes. First, epics now live under `forge/epics/<milestone>/` and the
linter checks the milestone, yet `harness:new -- epic` still accepts a missing
`--milestone` and creates an epic outside any milestone dir (T087 report). Second, every
parallel worktree runs `npm ci` (RT001 friction 2, proposal P4). Claude Code supports a
`worktree.symlinkDirectories` setting (checked in the 2.1.227 binary), so `node_modules`
can be linked from the main tree.

## Context

- `tools/harness/gen/scaffold.ts` (`epicDoc`), `tools/harness/test/scaffold.test.ts`, `tools/harness/cli.ts`
- `.claude/skills/plan-epic/SKILL.md` step 2, `CLAUDE.md` commands table
- `.claude/settings.json`, `.gitignore`, `.claude/skills/delegate/SKILL.md` step 3 and `parallel.md`
- Out of scope: new scaffolder flags or kinds; any change to `package.json`; linking other directories; a fallback for a worktree whose `package.json` differs (that task runs alone and installs).

## Acceptance Criteria

- [ ] A vitest case shows `scaffold(root, 'epic', { title: 'x' })` throws `missing required --milestone`, and existing epic scaffold tests pass with a milestone
- [ ] `npm run harness:new -- epic --title "x" --priority p1` exits non-zero with `missing required --milestone` and creates no file
- [ ] `plan-epic/SKILL.md` step 2 and the `CLAUDE.md` commands table show `--milestone`
- [ ] `.claude/settings.json` sets `worktree.symlinkDirectories` to `["node_modules"]`, `.gitignore` ignores `node_modules` without a trailing slash (a symlink is not a directory to git), and in a temp `git worktree add` with a `node_modules` symlink `git status --porcelain` lists no `node_modules` entry
- [ ] `delegate/SKILL.md` step 3 and `parallel.md` say worktrees get a linked `node_modules` and that `npm ci` is needed only when the task changes `package.json`; the Log records one real parallel run's `node_modules` state or says it is unverified until the next parallel run

## Subtasks

- [ ] Make `milestone` required in `epicDoc`, update tests, skill and CLAUDE.md
- [ ] Settings key, `.gitignore` pattern, temp-worktree check for the porcelain output
- [ ] Update delegate and parallel text; add a symlink-privilege caveat for Windows

## Notes

- 2026-10-01: Sources: T087 report (required milestone), RT001 proposal P4. P4 is feasible: the binary schema lists `worktree.symlinkDirectories` ("no directories are symlinked by default"). Risk: Windows symlinks may need Developer Mode; if the symlink fails the setting only logs, so `npm ci` stays the fallback.
- 2026-10-01: Left in backlog for the `wip_ready` limit (8); promote after a ready task moves on. Do not run in parallel with a task that edits `.claude/settings.json` or `.gitignore`.
- 2026-10-01: Do not start while implementers are active in worktrees on T012, T014, T019: changing `.gitignore` and settings mid-run is untestable and they must keep working with `npm ci`.

## Log

- 2026-10-01: created
