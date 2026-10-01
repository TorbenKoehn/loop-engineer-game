<!--
Root agent guide. Loaded by the main session AND every subagent: keep it role-neutral.
The orchestrator protocol is injected separately (SessionStart hook -> docs/harness/orchestrator.md).
Budget: claude_md_lines (target <= 100). Add a line only after the same mistake happened twice
and no lint, template, rule or skill can carry it (docs/harness/self-improvement.md).
-->
# Loop Engineer

A browser roguelite auto-battler about an AI agent stuck in an engineering loop, built
entirely by agents. The repo is the only system of record: plans, decisions, reviews and
lessons live in Markdown files with frontmatter, not in chat or memory.

## Navigate

Start at `INDEX.md`. Every directory has a generated `INDEX.md` with title, summary and
keywords per file. Read summaries first, open at most 3 files in full, follow `related`
links only when needed. Unsure where to look: `grep -rl "^keywords:.*<word>" docs forge`.

| Need | Go to |
|---|---|
| How the harness works | `docs/harness/overview.md` |
| Task lifecycle, Definition of Ready/Done, commits | `docs/harness/workflow.md` |
| Frontmatter fields | `docs/harness/frontmatter.md` |
| Budgets and overrides | `docs/harness/budgets.md` (values: `docs/harness/budgets-table.md`) |
| Game design | `docs/game/INDEX.md` |
| Architecture, code conventions, ADRs | `docs/architecture/INDEX.md` |
| Current work | `forge/BOARD.md`, your task file in `forge/epics/` |
| Harness tooling | `tools/harness/README.md` |

## Commands

`npm run check` is the single gate: tsc, biome, vitest, build + e2e (when `src/` or `tests/e2e/` changed),
harness:check, fail-fast. Run it
before every review hand-off.

Individual steps (secondary, for fast iteration):

```
npx tsc --noEmit
npx biome check .
npm test
npm run harness:check
```

| Command | Effect |
|---|---|
| `npm run harness:check` | Regenerate board and indexes, then lint (frontmatter, budgets, forge rules) |
| `npm run harness:lint` | Lint only; `-- --json` for machine output |
| `npm run harness:new -- task --epic E001 --title "..."` | Scaffold epic, task, review or retro with the next free id |
| `npm run harness:budgets` | Regenerate `docs/harness/budgets-table.md` |

## Hard rules

1. Every Markdown file has frontmatter per `docs/harness/frontmatter.md`. Exceptions:
   `CLAUDE.md`, generated files, skill supporting files. Skills and agents use Claude Code
   fields (`name`, `description`); skill repo metadata goes under `metadata:`.
2. Budgets in `harness.config.json` are hard limits. On a breach, restructure (split,
   extract, decompose) per `docs/harness/budgets.md`. Overrides need a reason citing a
   task or ADR.
3. Never hand-edit generated files: `**/INDEX.md`, `forge/BOARD.md`,
   `docs/harness/budgets-table.md`. Edit the source, run the generator.
4. Forge ids (E###, T###, R###, RT###) come only from `npm run harness:new`.
5. `TODO`, `FIXME` and `HACK` comments reference a task: `TODO(T012): ...`.
6. Never delete or weaken acceptance criteria, tests, lint rules or budgets to get green.
   If one is wrong, stop and report.
7. Only the orchestrator sets a task `done` and commits. Subagents never commit, never
   spawn subagents, and work on exactly the task they were given.
8. One task = one commit `T###: <title>`, after an approved review.
9. English for docs, code, comments and commit messages.
10. Decisions go into files: task Notes, an ADR in `docs/architecture/`, or a doc.
    Personal auto memory is for user preferences only, never for project knowledge.
11. Stop and report instead of guessing when a requirement is ambiguous, a dependency is
    missing, or the change needs files outside your scope.
12. Leave a clean state: checks green or the blocker written down.

## Conventions

- TypeScript, strict, ESM. `tools/` runs natively on Node 24: erasable syntax only,
  relative imports with `.ts` extensions.
- Forward slashes in every path written into docs, skills and code.
- Docs are small and linked: one topic per file, summary states the answer.
- Agent roles: `.claude/agents/`. Procedures: `.claude/skills/` (each with `tests.md`).
