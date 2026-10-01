---
title: Harness overview
summary: How this repo runs itself - Markdown knowledge base navigated via generated INDEX.md files, the forge (epics, tasks, reviews), the orchestrator loop, agents, skills and hooks.
keywords: [harness, overview, navigation, index, forge, hooks, agents, skills]
type: guide
status: active
updated: 2026-10-01
related: [orchestrator.md, workflow.md, delegation.md, frontmatter.md, budgets.md, self-improvement.md, ../../tools/harness/README.md]
---

# Harness overview

Loop Engineer is built by agents. The harness is everything around the models: the
knowledge base they read, the forge they track work in, the checks that tell them they
are wrong, and the loop that ties it together. The repo is the only system of record:
what is not in a file does not exist after the next `/clear`.

## Knowledge base

Every Markdown file carries frontmatter ([frontmatter.md](frontmatter.md)). Each
directory has a generated `INDEX.md` listing title, summary and keywords of its files and
subdirectories. Agents navigate top-down:

1. Open the `INDEX.md` of the most likely directory (root: [INDEX.md](../../INDEX.md)).
   Read summaries only; a good summary carries the answer.
2. Unsure where to look: grep frontmatter, e.g. `grep -rl "^keywords:.*context" docs forge`.
3. Open at most the 3 most relevant files in full.
4. Follow `related` links only when the current file points there for the answer.

| Area | Holds | Owner of the facts |
|---|---|---|
| `CLAUDE.md` | Map, commands, hard rules for every agent | root, ≤ 100 lines |
| `docs/harness/` | How the harness works (this folder) | orchestrator, via retros |
| `docs/game/` | Game design (type `gdd`) | design tasks |
| `docs/architecture/` | Architecture, code conventions, ADRs | architecture tasks |
| `docs/research/` | Sourced research behind decisions (type `research`) | read-only reference |
| `forge/` | Work state: board, epics, tasks, reviews, retros, handoff | forge workflow |
| `.claude/agents/` | Role definitions (implementer, reviewer, planner, doc-gardener) | harness text |
| `.claude/skills/` | Repeatable procedures, each with `tests.md` scenarios | harness text |
| `tools/harness/` | Indexer, linter, board, scaffolder, hooks | tooling tasks |
| `harness.config.json` | Frontmatter schema and every budget value | single source of truth |

Generated files are never edited by hand: `**/INDEX.md`, `forge/BOARD.md`,
`docs/harness/budgets-table.md`. Edit the sources, then run the generator.

## Forge

The forge is an in-repo Kanban board built from frontmatter Markdown:

```
forge/BOARD.md                     generated board (WIP counts, epic progress)
forge/HANDOFF.md                   orchestrator state, overwritten each cycle
forge/epics/E001-slug/EPIC.md      epic: goal, scope, out of scope, DoD
forge/epics/E001-slug/T001-slug.md task: goal, context, AC, subtasks, notes, log
forge/reviews/R001-T001.md         one review per review round
forge/retros/RT001-slug.md         retrospective with at most 3 actions
```

IDs come only from `npm run harness:new` (never hand-picked). Statuses, transitions,
Definition of Ready and Done: [workflow.md](workflow.md).

## The loop

The main session is the **orchestrator**. It plans, routes, verifies and records; it
does not write code. Its protocol ([orchestrator.md](orchestrator.md)) is injected by a
`SessionStart` hook, so it reaches only the main session and survives compaction.
`CLAUDE.md` stays role-neutral because every subagent loads it too.

```
pick task (BOARD) -> check DoR -> delegate (implementer) -> verify checks
  -> stage diff -> review (reviewer, fresh context) -> done + commit "T###: title"
  -> every N tasks: retro -> harness improves
```

One task = one subagent run = one review = one commit. Subagents never spawn
subagents (depth 1) and never commit. Agents and model routing:
[delegation.md](delegation.md).

## Checks

Deterministic checks run before any LLM judgement, cheapest first:
`tsc` → `biome` → `vitest` → `npm run harness:check` → Opus review. Commands are listed
in `CLAUDE.md`. Lint messages name the rule and the fix; budgets and their breach
handling: [budgets.md](budgets.md).

## Hooks

Wired in `.claude/settings.json`, implemented in `tools/harness/hooks/`:

| Event | Effect |
|---|---|
| `SessionStart` | Prints [orchestrator.md](orchestrator.md) into the main session (startup, resume, clear, compact) |
| `PostToolUse` on Write/Edit | Refreshes indexes and board after a Markdown edit; never blocks |
| `Stop` | Full refresh and lint; blocks the turn with the error list until clean |
| `SubagentStop` (`implementer`, `doc-gardener`) | Same gate for writer agents before they hand back |

## Self-improvement

Retros run every few done tasks and at epic close; lessons go into the cheapest durable
form (lint > template > rule > skill > CLAUDE.md): [self-improvement.md](self-improvement.md).
