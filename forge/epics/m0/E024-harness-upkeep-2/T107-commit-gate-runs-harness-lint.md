---
id: T107
epic: E024
title: Commit gate runs harness lint
summary: "A PreToolUse hook on Bash `git commit` runs the harness lint and blocks the commit on any error; a clean tree commits."
keywords: ["hook", "pretooluse", "git-commit", "lint", "gate", "bookkeeping"]
type: task
status: ready
priority: p1
model: sonnet
size: S
updated: 2026-10-01
related: ["EPIC.md", "../../../retros/RT004-fourth-retro-e007-e008-e009-sim-save-and.md"]
---

# T107: Commit gate runs harness lint

## Goal

The Stop hook lints after the commit, so R066 was committed with a lint error (b6a267d)
and T051 was committed at status review with unchecked AC (ce96beb), RT004 What Went
Wrong 2. After this task a `git commit` run through the Bash tool is blocked while the
harness lint has errors, with the findings as the reason.

## Context

- Epic: [E024](EPIC.md); [RT004 proposal P3](../../../retros/RT004-fourth-retro-e007-e008-e009-sim-save-and.md)
- `.claude/settings.json` (hooks), `tools/harness/hooks/stop.ts`, `tools/harness/hooks/io.ts`
- `docs/research/harness/claude-code-formats-hooks.md` (PreToolUse input and exit 2), `tools/harness/README.md` section "Hooks"
- Out of scope: running tsc, vitest or `npm run check` in the hook; regenerating board or indexes in the hook; git-native hooks; other Bash commands.

## Acceptance Criteria

- [ ] Vitest test `blocks git commit on lint error` passes: hook input with `tool_input.command` `git commit -m x` on a fixture with a lint error exits 2 and prints the findings to stderr
- [ ] Vitest test `allows clean commit and other commands` passes: a clean fixture exits 0, and a non-commit command (`git status`) exits 0 without running the lint
- [ ] `.claude/settings.json` registers the hook under `PreToolUse` with matcher `Bash`, and `tools/harness/README.md` "Hooks" describes it
- [ ] `npm run harness:check` exits 0

## Subtasks

- [ ] `tools/harness/hooks/pre-commit.ts` reusing `lint` and `parsePayload`
- [ ] Command detection for `git commit` (also after `&&`)
- [ ] Tests with stdin payloads; settings and README

## Notes

- 2026-10-01: Source: RT004 P3. Full lint takes about 2 s today (`lint_s` 10, `hook_ms` 3000 warn); log the measured hook time.
- 2026-10-01: Touches `.claude/settings.json`; do not run in parallel with another task editing it.

## Log

- 2026-10-01: created
