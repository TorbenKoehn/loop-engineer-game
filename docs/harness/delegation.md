---
title: Delegation and model routing
summary: Which agent and model gets which work (Opus decides, Sonnet does), the delegation prompt template, the report format subagents must return, and the parallelism limits.
keywords: [delegation, subagents, model-routing, opus, sonnet, prompt-template, report]
type: guide
status: active
updated: 2026-10-01
related: [orchestrator.md, workflow.md, ../../.claude/skills/delegate/SKILL.md, ../research/harness/orchestration-patterns.md]
---

# Delegation and model routing

Subagents see none of the conversation. Everything they need is in the prompt or in
files the prompt names. Pass paths, not content.

## Agent roster

| Agent | Default model | Writes | Use for |
|---|---|---|---|
| `implementer` | sonnet | code, tests, docs, its task file | Executing one `ready` task |
| `reviewer` | opus | one review file | Reviewing one staged task diff |
| `planner` | opus | epics, task files | Epic or GDD section → tasks with AC |
| `doc-gardener` | sonnet | docs (mechanical fixes) | Lint warnings, broken links, stale docs, drift |
| `Explore` (built-in) | inherit | nothing | Searches that need more than ~5 file reads |
| `general-purpose` | opus override | as prompted | Harness tasks, ADRs, research without a role |

Retros run through the `retro` skill (forked Opus context). Spawn depth is 1: only the
orchestrator delegates; agent definitions do not include the `Agent` tool.

## Model routing

Opus decides, Sonnet does. Mistakes in plans and reviews multiply downstream, so the
expensive model goes where the leverage is.

| Work | Model |
|---|---|
| Epic planning, task decomposition, acceptance criteria | Opus |
| Architecture, ADRs, sim-core balance logic | Opus |
| Code review, retros | Opus |
| Harness text: CLAUDE.md, docs/harness, agents, skills | Opus |
| Hard bugs: root cause unknown, or a previous attempt failed | Opus |
| Fully specified implementation within `route_sonnet_max_diff_lines` / `route_sonnet_max_files` | Sonnet |
| Tests for existing code, mechanical refactors, renames | Sonnet |
| Docs upkeep, gardening, research gathering with a clear question | Sonnet |

The task's `model` field is the default. Escalate per call with the Agent tool's `model`
parameter (it overrides the agent's frontmatter); there are no `-opus` agent copies.
Effort: `high` for planner and reviewer, default for implementers, `low` for gardening.

## Prompt template

Keep it under `subagent_prompt_tokens`. The task file is the spec; the prompt frames it.

```
TASK T### (epic E###), attempt N - read <task path> first, then its Context paths.
Objective: <one sentence outcome, copied from Goal>.
Inputs: <review file R###-T###.md to address, if any>. <worktree note, if any>.
Constraints: touch only <paths/globs>; respect Out of scope and budgets;
  do not commit; do not edit Acceptance Criteria or generated files.
Done means: every AC checked with an evidence line in the Log; check sequence
  from CLAUDE.md green; status set to review.
Stop and report instead of guessing if: an AC is ambiguous, a dependency is
  missing, you need files outside the allowed paths, or a budget cannot be met.
Report: use the format in docs/harness/delegation.md#report-format (max 40 lines).
```

Reviewer prompt: `Review T### (staged diff, round N). Task: <path>. Prior reviews:
<paths or none>. Use the forge-review skill. Report max 15 lines.`

Planner prompt: `Plan <EPIC.md path or docs/game section>. Constraints: <scope notes>.
Use the plan-epic skill. Report the task list only.`

## Report format

Subagents end with exactly this block; detail goes into files (task Notes/Log, review
file), not into the report.

```
STATUS: review | blocked | partial | done
TASK: T###            (or the epic / scope for planner and gardener)
FILES: <changed paths, one line, comma separated>
CHECKS: tsc=0 biome=0 vitest=0 harness=0   (exit codes, or "not run: <why>")
AC: 1 ok, 2 ok, 3 ok   (or "n/a")
QUESTIONS: <numbered, only if blocked; each answerable in one line>
NOTES: <max 5 lines: surprises, follow-up candidates, budget pressure>
```

The orchestrator trusts none of it until verified (`delegate` skill, step 5).

## Parallelism

- Default is sequential: one writer at a time in the main tree.
- Up to 3 parallel writers (`parallel_writers`), only for tasks with disjoint Context
  paths, each spawned with `isolation: worktree`, all in one message. Read-only agents
  (Explore, research) may run alongside, up to `parallel_subagents` in total.
- Reviews and commits always happen in the main tree, one task at a time. Worktree
  results are applied as patches (`delegate` skill, `parallel.md`).
- The orchestrator cannot steer a running subagent; keep tasks small so waiting is cheap.
