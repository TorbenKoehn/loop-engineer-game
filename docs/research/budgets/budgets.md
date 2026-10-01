---
title: Repository budgets overview
summary: Every budget proposed for the agent-run repo, covering docs, code, tests, forge, agents and game runtime, with conventions, override rules and a machine-readable budgets object.
keywords: [budgets, linter, harness, limits, overrides, context]
type: research
status: active
updated: 2026-10-01
related: [budgets-docs.md, budgets-code.md, budgets-forge.md, budgets-agents.md, ../harness/harness-engineering.md]
---

# Repository budgets

> Research proposal. The binding values live in `harness.config.json` (table:
> [docs/harness/budgets-table.md](../../harness/budgets-table.md), policy:
> [docs/harness/budgets.md](../../harness/budgets.md)). Orchestrator deviations from
> this proposal: `dir_depth` 4, `fn_params` 4, `claude_md_lines` 120 (warn 100),
> `skill_description_chars` 1024 (warn 300).

## Contents
- Why budgets
- Detail files
- Conventions
- Severities
- Breach ladder
- Overrides
- Machine-readable budgets object
- Key sources

## Why budgets

CONCEPT.md: "Alles kriegt ein Budget." In an agent-run repo, size is a
proxy for context cost, and context is the scarce resource: LLM performance
"degrades as context fills" ([Claude Code best practices][cc-bp]), and
reliability drops with input length even on simple tasks ([Chroma][chroma]).
Budgets turn "keep things small" into checks a script can run. Each breach
has a defined remedy, so agents can react without asking.

## Detail files

Each budget has a value, severity, measurement, breach action and sourced
rationale in one of these files:

| File | Covers | Count |
|---|---|---|
| [budgets-docs.md](budgets-docs.md) | Markdown, frontmatter, fan-out, CLAUDE.md, skills, agents, ADRs, freshness | 32 |
| [budgets-code.md](budgets-code.md) | TS size and complexity, comments, escapes, deps, bundle, tests, coverage, frame time, assets | 43 |
| [budgets-forge.md](budgets-forge.md) | Epics, tasks, subtasks, diff size, WIP, ageing, reviews, retries, bugs, retros | 25 |
| [budgets-agents.md](budgets-agents.md) | Prompts, reports, turns, parallelism, nesting, context, routing, cost, tool latency | 18 |
| this file | Override meta-budgets | 4 |

## Conventions

- **Tokens** are estimated as `ceil(chars / 3)`. The old rule of thumb is
  about 4 chars per token, but the Opus 4.7+ tokenizer (also used by Opus
  5.5) produces up to 1.35× more tokens. Dividing by 3 keeps the estimate on
  the safe side without an API call in the lint path. For calibration,
  `messages.count_tokens` can be run offline.
- **Lines** are physical lines, frontmatter included. For code, ESLint's
  `skipBlankLines` and `skipComments` apply.
- **Generated files** (`INDEX.md`, `BOARD.md`, `dist/`, lockfiles) are exempt
  from size budgets. Instead, their generators are budgeted (`index_tokens`,
  `board_done_visible`).
- **`warn_at`** is an optional soft threshold below `value`. One budget then
  covers both the nudge and the hard stop.
- **`cmp`** defaults to `max`. Budgets with `cmp: "min"` are floors
  (coverage, keyword minimum).
- **`fixed: true`** marks platform limits (for example the skill name's 64
  chars) or invariants (for example 0 broken links) that cannot be
  overridden.

## Severities

| Severity | Who checks | When | Effect |
|---|---|---|---|
| `error` | `npm run harness:lint` (biome and vitest for code budgets) | Stop hooks, pre-commit and CI; perf budgets in the CI perf job | Commit or CI fails |
| `warn` | Same script | Same | Printed, and summarised on BOARD.md. Capped by `budget_warnings_total` |
| `process` | Orchestrator, or the reviewer subagent's checklist | Delegation, review, retro | Escalation per the breach ladder. Lintable as warnings once counters live in task frontmatter (see [forge](budgets-forge.md)) |

## Breach ladder

Every breach maps to a structural fix, never to "try harder":

| Breached thing | Fix |
|---|---|
| Doc too long | Split into `topic-*.md` siblings and keep `topic.md` as the overview (as this research does) |
| Folder too full or too deep | Forge task "reorganise X" into topic subfolders, then regenerate INDEX |
| Code file or function too big or complex | Extract a module or function. Use options objects for params |
| Task too big (subtasks, diff, files, age, cost) | Decompose into sibling tasks. Land the first slice |
| Epic too big or too old | Split the epic and run a retro |
| Review or attempt limit hit | Escalate: Sonnet → Opus → orchestrator re-plan → user question |
| Context limit hit | Write a handoff to the forge, then compact or start a fresh session |
| WIP limit hit | Stop starting and start finishing |

## Overrides

Markdown overrides go in frontmatter. TS files use a header comment, because
they have no frontmatter.

```yaml
budget_override:
  md_lines: { value: 420, reason: "Generated API table, split planned in T031", until: 2026-11-01 }
```

```ts
// budget-override: fn_lines=80 -- state-machine table, see ADR-004 (until 2026-11-01)
```

Rules, enforced by the meta-budgets below:
- An override may raise a limit to at most 2× its default
  (`override_max_factor`). Anything beyond that needs an ADR and a change to
  the default.
- `reason` must be at least 20 characters and should reference a task or
  ADR.
- `until` is mandatory, at most 30 days out. Once it expires, the override
  stops applying and the original budget is enforced again.
- At most 12 active overrides repo-wide. Overrides are budget debt too.
- `fixed` budgets cannot be overridden.



## Machine-readable budgets object

The proposed `budgets.json` object (value, severity, scope, unit, plus `warn_at`, `cmp`
and `fixed`) was adopted into the `budgets` section of `harness.config.json`, which is
now the single source of truth. The generated
[budgets table](../../harness/budgets-table.md) lists every value; the detail files
above hold the rationale per budget.

## Key sources

Full citations are in each detail file. The most load-bearing:
- Claude Code best practices: https://code.claude.com/docs/en/best-practices
- Claude Code memory (CLAUDE.md under 200 lines, MEMORY.md 200 lines/25 KB): https://code.claude.com/docs/en/memory
- Claude Code skills (5,000-token re-attach, 1% listing budget): https://code.claude.com/docs/en/skills
- Skill authoring best practices (SKILL.md under 500 lines, 1024-char description): https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Claude Code subagents (maxTurns, spawn depth 3, 20 concurrent): https://code.claude.com/docs/en/sub-agents
- Anthropic multi-agent research system: https://www.anthropic.com/engineering/multi-agent-research-system
- Chroma, Context Rot: https://www.trychroma.com/research/context-rot
- SmartBear/Cisco code review study: https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/
- Google eng-practices, Small CLs: https://github.com/google/eng-practices/blob/master/review/developer/small-cls.md
- ESLint rule defaults: https://eslint.org/docs/latest/rules/

[cc-bp]: https://code.claude.com/docs/en/best-practices
[chroma]: https://www.trychroma.com/research/context-rot
