---
title: Harness Tooling
summary: Commands, config, budget registry, integrity rules, hooks and extension points of the in-repo harness.
keywords: [harness, lint, budgets, forge, hooks, index]
type: guide
status: active
updated: 2026-10-01
related_code: [tools/harness, harness.config.json, .claude/settings.json]
---

# Harness tooling

TypeScript run natively by Node 24 (type stripping, no build). Only erasable syntax, relative imports
with `.ts` extensions. Every limit lives in `harness.config.json`; nothing is hardcoded in code.

## Contents

- Commands
- Config
- Budgets and enforcement
- Overrides
- Forge integrity
- Doc drift
- Hooks
- Layout
- Adding a budget

## Commands

| Command | Effect |
|---|---|
| `npm run harness:budgets` | Regenerate `docs/harness/budgets-table.md` from the config |
| `npm run harness:index` | Regenerate every `INDEX.md` (writes only on change) |
| `npm run harness:board` | Regenerate `forge/BOARD.md` |
| `npm run harness:lint` | Frontmatter, budget, integrity, drift and freshness lint; exit 1 on errors. `-- --json` for JSON |
| `npm run harness:check` | budgets table + board + index + lint |
| `npm run harness:new -- <kind> ...` | Scaffold forge items |
| `npm test` | vitest |

Scaffolding (IDs are allocated globally, next free number):

```
npm run harness:new -- epic --title "Core loop" [--priority p1] --milestone m1
npm run harness:new -- task --epic E001 --title "Spawn enemies" [--model sonnet] [--priority p2] [--size S]
npm run harness:new -- review --task T001 --verdict approved
npm run harness:new -- retro --title "Sprint one"
```

Layout: `forge/epics/m1/E001-slug/EPIC.md`, `forge/epics/m1/E001-slug/T001-slug.md`,
`forge/reviews/E001/R001-T001.md`, `forge/retros/RT001-slug.md`.

## Config

`harness.config.json` is the single source of truth.

- `exclude`, `codeGlobs`, `boardPath`, `index`, `writerAgents` (agents whose stop is gated).
- `frontmatter`: base fields (including optional `related_code`), `statusSets`, per-`type` fields, `special`
  native formats (`SKILL.md`, agents need `name` + `description`; `CLAUDE.md` has no frontmatter).
- `budgets`: `{ id: { value, severity, unit, description, area, enforced_by, warn_at?, cmp?, fixed? } }`.

## Budgets and enforcement

- `severity`: `error` fails lint, `warn` prints, `process` is never linted (orchestrator or reviewer checks).
- `warn_at`: a warning between `warn_at` and `value`. `cmp: "min"` makes the value a floor. `fixed: true`
  cannot be overridden.
- `enforced_by`: `harness` (implemented here), `biome` (code AST rules, configured when the game is
  scaffolded), `vitest` (test, perf and bundle gates), `process` (human or agent checklist).
- `budget_warnings_total` caps the warnings of one run; `lint_s` caps lint wall time (about 0.6 s now).
- The full table is generated: `docs/harness/budgets-table.md`. Tokens are `ceil(chars / 3)`.

## Overrides

A doc may raise one of its own limits. All fields are mandatory and validated:

```yaml
budget_override:
  md_lines: { value: 400, reason: "reference table, split planned in T031", until: 2026-10-20 }
```

Rules: at most `override_max_factor` (2) times the default, `reason` of at least 20 chars, `until` at most
30 days ahead, expired overrides stop applying (warning), `fixed` budgets refuse overrides, at most
`overrides_total` active overrides. An invalid override is an error and is ignored.

## Forge integrity

Errors, checked on every lint:

- `done_needs_review`: a `done` task needs a `forge/reviews/E###/R###-T###.md` with `verdict: approved`.
- `status_transition`: versus HEAD content (one batched `git cat-file --batch`); allowed `backlog>ready>in-progress>review>done`,
  `review>in-progress`, any `>blocked`, `blocked>ready|in-progress`; done is terminal.
- `ac_decrease`: acceptance criteria may not shrink once a task left backlog/ready.

The HEAD comparison is skipped for untracked files and outside a git repo (or before the first commit).

## Doc drift

- `related_code: [src/sim/**, tools/harness]` in frontmatter: warns when a matched file's last commit
  date (one batched `git log --name-only` pass) is newer than the doc's `updated`, or when an entry matches nothing.
- Warns when a doc mentions `npm run <script>` that `package.json` lacks (research, task and epic docs exempt).

## Hooks

Wired in `.claude/settings.json` using the exec form (`command: "node"` plus `args`, no shell quoting).

| Hook | Script | Behaviour |
|---|---|---|
| SessionStart `startup,resume,clear,compact` | `hooks/session-start.ts` | stdout becomes context: `docs/harness/orchestrator.md` plus a one-line board summary |
| PostToolUse `Write,Edit,MultiEdit` | `hooks/post-edit.ts` | refresh table, board, indexes after `.md` or config edits; never fails; backslash paths normalised |
| Stop | `hooks/stop.ts` | refresh and lint; exit 2 with summary on errors or a lint crash, unless `stop_hook_active` |
| SubagentStop `implementer,doc-gardener` | `hooks/stop.ts` | same gate, writer agents only |

`settings.json` also sets `env.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` (checked by `subagent_spawn_depth`).

## Layout

```
cli.ts                       entry for all commands
core/    types config glob frontmatter scan forge git date structure lint
gen/     index board scaffold table          (generated files and scaffolding)
budgets/ index util overrides meta dirs      (check registry; docs/ code/ forge/ subfolders)
hooks/   post-edit stop session-start io
test/    *.test.ts testutil
```

## Adding a budget

1. Add it to `budgets` in `harness.config.json` with `area` and `enforced_by`; run `npm run harness:budgets`.
2. For `enforced_by: harness`, write a `Check` (`{ id, run(ctx) => Finding[] }`) in the matching
   `budgets/*` module. Use `check(ctx, id, at(file, what?) | inDoc(doc, what?), actual)` from `budgets/util.ts`; it applies
   `cmp`, `warn_at`, severity and the doc's override.
3. Append the check to the module's exported list; `budgets/index.ts` registers it.
4. Add a test in `tools/harness/test/`.
