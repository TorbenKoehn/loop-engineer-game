---
id: T086
epic: E023
title: Scaffolder places epics in milestone dirs
summary: "harness:new epic takes --milestone and writes forge/epics/<milestone>/E###-slug/EPIC.md; lint checks milestone vs. directory; review titles fit fm_title_chars."
keywords: ["scaffold", "harness-new", "milestone", "epics", "fm_title_chars", "review"]
type: task
status: ready
priority: p2
model: sonnet
size: S
updated: 2026-10-01
related: ["EPIC.md"]
---

# T086: Scaffolder places epics in milestone dirs

## Goal

`forge/epics` holds 23 epic directories, over `dir_subdirs` (10). Give epics an optional
`milestone` frontmatter field (`m0` foundation and harness, `m1`, `m2`, `m3`) and make
`npm run harness:new -- epic` place new epics under `forge/epics/<milestone>/`, so T087 can
migrate the existing epics. The same scaffolder also writes review titles longer than
`fm_title_chars` (R001 finding); fix that here because it is the same file.

## Context

- Epic: [E023](EPIC.md)
- `tools/harness/gen/scaffold.ts`, `tools/harness/test/scaffold.test.ts`
- `tools/harness/core/structure.ts` (id and reference checks), `harness.config.json` (frontmatter `epic` fields)
- [Frontmatter reference](../../../docs/harness/frontmatter.md)
- Out of scope: moving existing epics or rewriting their links (T087); making `milestone` required (T087); board or INDEX layout changes.

## Acceptance Criteria

- [ ] Test `scaffolds an epic under its milestone dir` passes: `--milestone m2` yields `forge/epics/m2/E###-<slug>/EPIC.md` with `milestone: m2` in the frontmatter
- [ ] Test `scaffolds a task next to a nested epic` passes: the task file lands in the epic's nested directory with a working `EPIC.md` link
- [ ] Test `rejects an unknown milestone` passes: `--milestone m9` throws a message listing `m0, m1, m2, m3`
- [ ] Test `review title fits fm_title_chars` passes: a review for a task with a 60-character title gets a title of at most `fm_title_chars` characters that still starts with `Review of T###`
- [ ] Test `milestone must match parent dir` passes: harness lint reports an error for an epic whose `milestone` differs from its parent directory name, and none for epics without the field

## Subtasks

- [ ] Add optional `milestone` enum (m0-m3) to the epic fields in harness.config.json
- [ ] Add `--milestone` to `harness:new epic`; without it keep today's flat path
- [ ] Truncate the task title part of review titles to the budget
- [ ] Add the milestone-vs-directory rule next to the existing forge structure checks

## Notes

- 2026-10-01: Sources: forge/HANDOFF.md Pending follow-ups (dir_subdirs, review titles).
- 2026-10-01: m0 groups E001 (foundation) and E023 (this epic) so m1 keeps 10 epics (E002-E011).

## Log

- 2026-10-01: created
