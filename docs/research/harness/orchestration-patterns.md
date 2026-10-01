---
title: Orchestration patterns for the orchestrator and subagents
summary: How the orchestrator delegates - agent roster, Opus vs Sonnet routing, delegation prompt template, output contract, review loops, context hygiene, parallelism and retry ladder.
keywords: [orchestration, subagents, delegation, model-routing, review, parallelism, retries]
type: research
status: active
updated: 2026-10-01
related: [harness-engineering.md, harness-engineering-forge.md, ../budgets/budgets-agents.md, claude-code-formats.md, claude-code-formats-hooks.md, orchestration-patterns-resilience.md]
---

# Orchestration patterns

The main session (Opus 5.5) only orchestrates: it plans, routes, verifies and
records. Workers are subagents. Numbers referenced here (turn caps, parallel
writers, escalation thresholds) are defined in [budgets-agents.md](../budgets/budgets-agents.md).

## Contents
- The orchestrator loop
- Which Anthropic pattern where
- Agent roster
- Model routing: Opus vs Sonnet
- Delegation prompt template and output contract
- Verification and review loops
- Context hygiene for the orchestrator
- Parallelism, retries, hooks: [orchestration-patterns-resilience.md](orchestration-patterns-resilience.md)
- Anti-patterns
- Sources

## The orchestrator loop

1. **Orient**: read `forge/HANDOFF.md`, `forge/BOARD.md`, `git log --oneline -10`.
2. **Select**: reviews first, then unblock, then the top ready task.
3. **Delegate**: one task per subagent, prompt from the template below.
4. **Verify**: re-run the checks yourself; never accept "tests pass" as text.
5. **Review**: spawn the reviewer in fresh context on the diff + task file.
6. **Record**: move status, write HANDOFF.md, commit.
7. **Reflect**: at retro cadence, run the retro instead of step 2.

The orchestrator itself does not read source files beyond small spot checks,
does not write code, and does not run open-ended searches. It uses the
built-in Explore agent or the researcher for that.

## Which Anthropic pattern where

| Pattern | Use in this repo |
|---|---|
| Prompt chaining | Epic → planner decomposes → tasks → implement → review (fixed stages) |
| Routing | Task `model` field and agent choice per task kind |
| Parallelization (sectioning) | Independent tasks with disjoint files; parallel research questions |
| Parallelization (voting) | Rare: 2 reviewers on risky sim-core changes, block on either blocker |
| Orchestrator-workers | The main loop itself |
| Evaluator-optimizer | Implementer ↔ reviewer, capped at `review_rounds` |

"Start simple": sequential single-task delegation first. Add parallel writers
only once the review queue keeps up.

## Agent roster

Keep it to 5-6 roles. Escalation uses the per-invocation `model` parameter
(it overrides frontmatter), so no `implementer-opus` duplicate is needed.

| Agent | model | tools | maxTurns | Notes |
|---|---|---|---|---|
| `planner` | opus | Read, Grep, Glob, Write, Bash | 30 | Decomposes epics into task files via `npm run harness:new`; `effort: high` |
| `implementer` | sonnet | Read, Grep, Glob, Edit, Write, Bash | 60 | No `Agent` tool; `isolation: worktree` when run in parallel |
| `reviewer` | opus | Read, Grep, Glob, Bash, Write | 30 | `skills: [reviewing-changes]`; frontmatter PreToolUse hook denies Write outside `forge/reviews/` |
| `researcher` | sonnet | Read, Grep, Glob, WebSearch, WebFetch, Write | 30 | Writes only to `docs/research/` |
| `doc-gardener` | sonnet | Read, Grep, Glob, Edit, Write, Bash | 30 | See knowledge-base file |
| `qa-playtester` (later) | sonnet | Read, Bash, Playwright MCP | 30 | Plays the build, screenshots, checks behavioural AC |

Set `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` (only the orchestrator
delegates; keeps the forge audit trail complete). Descriptions are written
for the orchestrator's routing, e.g. reviewer: "Reviews one forge task's diff
against its acceptance criteria and writes a review file. Use after an
implementer hands back a task."

## Model routing: Opus vs Sonnet

Prices (2026-10-01): Opus 5.5 $4 / $20 per MTok in/out, Sonnet 5.5 $2 / $10;
both 1M context. Anthropic positions Opus 5.5 "for long-running agentic coding
and knowledge work" and Sonnet 5.5 as "the best combination of speed and
intelligence".

| Use Opus when | Use Sonnet when |
|---|---|
| Output is a decision others build on (plans, ADRs, task decomposition, AC) | The task file fully specifies the change |
| Judgment over correctness (reviews, retros, game balance) | Mechanical work: renames, moves, docs fixes, test scaffolds |
| A Sonnet attempt failed review once | Research gathering with a clear question |
| Cross-cutting change (> 5 files or > 200 diff lines est.) | Diff < 200 lines in ≤ 5 files |
| Writing harness text (skills, agent prompts, CLAUDE.md) | Running checks / collecting metrics |

Rule of thumb: Sonnet does, Opus decides. Mistakes in planning and review
multiply across every task downstream, so that is where the expensive model
pays off; token usage explains most of the performance variance in
Anthropic's multi-agent system, so spend it where the leverage is. Effort:
`high` for planner/reviewer, default for implementers, `low` for gardening.

## Delegation prompt template and output contract

Each subagent "needs an objective, an output format, guidance on the tools and
sources to use, and clear task boundaries". Without them, subagents
"misinterpreted the task or performed the exact same searches". Subagents
see none of the conversation, so everything must be in the prompt or in files
it points to. Pass paths, not pasted content.

```
TASK T004 (epic E001) - read forge/epics/E001-core/T004-context-meter.md first.
Objective: <one sentence outcome>.
Read before coding: <2-5 paths>. Do not read: node_modules, docs/research.
Constraints: only touch src/sim/** and its tests; budgets per CLAUDE.md;
  follow the task's Out of scope.
Done means: every AC checked with evidence; npm run harness:check,
  npx tsc --noEmit, npm test all exit 0; one commit "T004: <subject>".
Stop and report instead of guessing if: an AC is ambiguous, a dependency is
  missing, or you need to touch files outside the allowed paths.
Report (max 40 lines): status (review|blocked), commit sha, files changed,
  commands run with exit codes, AC checklist, open questions. Put long
  details into the task's Notes section, not the report.
```

The output contract matters as much as the input: reports land in the
orchestrator's context (target 1,000-2,000 tokens). Anthropic's research
system lets subagents write artifacts to the filesystem to avoid a "game of
telephone"; here the task file and the commit are the artifacts.

## Verification and review loops

- Computational checks before inferential review (cheap, deterministic first).
- The orchestrator re-runs the checks; the reviewer reads the diff and the
  task file only, never the implementer's reasoning ("a fresh context
  improves code review since Claude won't be biased toward code it just wrote").
- Reviewer instruction: "flag only gaps that affect correctness or the stated
  requirements"; severity rubric in the forge file. A reviewer asked for gaps
  always finds some, so minor/nit never trigger a round.
- Cap: `review_rounds` = 2, then escalate (below).
- For behaviour (the game), add a playtest check: screenshot + scripted
  input via Playwright. Anthropic's long-running harness: browser testing
  "dramatically improved performance".

## Context hygiene for the orchestrator

- Read INDEX summaries and BOARD.md, not whole directories. Delegate any
  search that needs more than ~5 file reads to Explore or the researcher.
- Ask for short reports; read details from files only when a decision needs them.
- Never paste file contents into delegation prompts; give paths.
- After two failed corrections of the same thing, stop: re-plan in the task
  file and delegate fresh rather than patching through chat.
- Write `forge/HANDOFF.md` before compaction (PreCompact hook can remind) and
  start a fresh session at the context ceiling in budgets-agents.md; the
  forge is the memory, so nothing is lost.
- Put compaction guidance in the orchestrator brief: "When compacting, keep
  active task ids, open decisions, and the last verification results."

## Parallelism, retries and hooks

Moved to [orchestration-patterns-resilience.md](orchestration-patterns-resilience.md).

## Anti-patterns

- Orchestrator "just quickly" fixing code itself: breaks the audit trail and
  fills its context with file contents.
- Vague delegation ("improve combat"), no stop conditions, no output limit.
- Nested delegation by workers (hidden cost, no forge record).
- Parallel writers in one checkout; trusting reports without re-running checks.
- Reviewer and implementer sharing context, or the reviewer fixing code.

## Sources
- https://www.anthropic.com/engineering/building-effective-agents
- https://www.anthropic.com/engineering/multi-agent-research-system
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- https://code.claude.com/docs/en/best-practices
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/hooks
- https://platform.claude.com/docs/en/about-claude/models/overview
