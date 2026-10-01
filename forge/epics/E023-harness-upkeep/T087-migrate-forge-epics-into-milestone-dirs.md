---
id: T087
epic: E023
title: Migrate forge epics into milestone dirs
summary: "Move every epic directory into forge/epics/m0..m3, add the milestone field, make it required, rewrite relative links and update docs and skills that name the old layout."
keywords: ["migration", "milestone", "epics", "forge", "dir_subdirs", "links"]
type: task
status: backlog
priority: p2
model: sonnet
size: M
depends_on: [T086]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T087: Migrate forge epics into milestone dirs

## Goal

Move the existing epics into milestone directories so `forge/epics` stays within
`dir_subdirs` and grows by milestone, not by epic. Mapping: `m0` = E001, E023; `m1` =
E002-E011; `m2` = E012-E018; `m3` = E019-E022. This is a scripted, mechanical move:
`git mv` plus a path-depth rewrite of relative links.

## Context

- Epic: [E023](EPIC.md)
- [Milestones](../../../docs/game/milestones.md) (which epic belongs to which milestone)
- [Harness overview](../../../docs/harness/overview.md) and [frontmatter reference](../../../docs/harness/frontmatter.md) (layout text)
- `tools/harness/README.md`, `.claude/skills/retro/SKILL.md` (glob `forge/epics/*/T*.md`)
- Out of scope: changing task content other than link paths and the `milestone` field; renaming epics or tasks; the scaffolder (T086).

## Acceptance Criteria

- [ ] `ls forge/epics` lists only `m0`, `m1`, `m2`, `m3` and `INDEX.md`
- [ ] Every EPIC.md has a `milestone` field, and `harness.config.json` marks the field required
- [ ] `npm run harness:check` exits 0 with no `broken_links`, `dir_subdirs` or `dir_depth` finding under `forge/`
- [ ] `grep -rn "forge/epics/\*/" .claude docs tools/harness/README.md` returns no match (globs and examples name the milestone level)
- [ ] `npm run check` exits 0

## Subtasks

- [ ] Write a throwaway script (scratchpad, not committed) that moves dirs and adds one `../` to links leaving `forge/epics`
- [ ] Fix `related` paths in forge/reviews/*.md that point into forge/epics
- [ ] Update layout text in docs/harness, tools/harness/README.md, retro skill grep
- [ ] Regenerate INDEX.md and BOARD.md with `npm run harness:check`

## Notes

- 2026-10-01: Schedule only when no task is in-progress or in a worktree: it moves every task file, so open patches would not apply.
- 2026-10-01: Touches more than `task_files_changed` files by nature (renames); the diff should be link-path lines only. Reviewer: judge the file count as a scripted move.
- 2026-10-01: Held in backlog: depends on T086 and would exceed `wip_ready`. DoR otherwise met.

## Log

- 2026-10-01: created
