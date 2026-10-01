---
id: T106
epic: E024
title: "harness:diff lists companion docs"
summary: "harness:diff prints `companion: <doc>` for each unstaged doc whose related_code names a staged file, still exiting 0; forge-review step 3 reads the line."
keywords: ["harness-diff", "companion-docs", "related-code", "doc-drift", "review"]
type: task
status: backlog
priority: p1
model: sonnet
size: S
depends_on: [T104]
updated: 2026-10-01
related: ["EPIC.md", "../../../retros/RT003-third-retro-e003-e004-e006-run-and-ui-ba.md"]
---

# T106: harness:diff lists companion docs

## Goal

Docs drift because nothing tells the implementer which doc describes the code it staged:
8 of 18 reviews in RT003 and 6 of 16 in RT004 raised a doc follow-up. After this task
`npm run harness:diff` names every doc whose `related_code` matches a staged file when
that doc is not staged, so doc drift shows up before review.

## Context

- Epic: [E024](EPIC.md); [RT003 proposal P2](../../../retros/RT003-third-retro-e003-e004-e006-run-and-ui-ba.md)
- `tools/harness/cli.ts` (`diff` command), `tools/harness/budgets/docs/drift.ts` (`matchRelatedCode`)
- `tools/harness/test/diff.test.ts`, `.claude/skills/forge-review/SKILL.md` step 3
- Out of scope: failing on a missing companion; editing docs; changing drift lint rules or `related_code` entries; the CSS and generated-file measure (T104).

## Acceptance Criteria

- [ ] Vitest in a temp repo: a staged file named in an unstaged doc's `related_code` makes `harness:diff` print `companion: <doc path>` and exit 0
- [ ] Vitest: when that doc is staged too, or no doc names the file, no `companion:` line is printed
- [ ] `.claude/skills/forge-review/SKILL.md` step 3 tells the reviewer to check each `companion:` line
- [ ] `npm run harness:check` exits 0

## Subtasks

- [ ] Reuse `matchRelatedCode` against the staged path list
- [ ] Print lines after the size line, sorted, one per doc
- [ ] Temp-repo tests; skill text (and its tests.md if it quotes step 3)

## Notes

- 2026-10-01: Source: RT003 P2. Depends on T104 because both edit the `diff` command and its tests.
- 2026-10-01: Definition of Ready holds; kept in backlog only because `wip_ready` (8) is full. Move to ready when T104 is done.

## Log

- 2026-10-01: created
