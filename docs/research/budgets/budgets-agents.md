---
title: Budgets for agents and runtime
summary: Proposed limits for subagent prompts, reports, turns, parallelism, nesting, orchestrator context, model routing, cost and hooks.
keywords: [budgets, agents, subagents, context, model-routing, cost, orchestration]
type: research
status: active
updated: 2026-10-01
related: [budgets.md, budgets-forge.md, budgets-docs.md]
---

# Budgets: agents and runtime

## Contents
- Delegation (prompts, reports, turns)
- Parallelism and nesting
- Orchestrator context
- Model routing
- Cost
- Tooling latency
- Sources

Most of these are `process` budgets: the orchestrator applies them when it
delegates. Those that live in config files (`.claude/agents/*.md`,
`.claude/settings.json`) are linted.

## Delegation

Agent success rates drop as tasks get longer: METR's "time horizon" is the
human task length at which a model succeeds 50% of the time ([METR][metr]).
Small tasks keep each subagent well inside its reliable range.

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `subagent_prompt_tokens` | 2000 | process | `chars / 3` of the delegation prompt | Replace inlined content with file paths ("read forge/epics/E003/T004.md") | Just-in-time retrieval: pass "lightweight identifiers (file paths …)" rather than content ([context eng][ctx]). A task file already holds the spec. |
| `subagent_report_tokens` | 2000 | process | Final report size, requested in the prompt ("max 50 lines") | Ask for a condensed report, with detail written to files | Subagents should return "a condensed, distilled summary … (often 1,000-2,000 tokens)" ([context eng][ctx]). Reports land in the orchestrator's context. |
| `subagent_turns_impl` | 90 | error | `maxTurns` in implementer agent definitions (must be present and ≤ 90; 60 until RT004, when 5 of 11 Opus runs hit it) | Partial result. The orchestrator decomposes the task or resumes it once | Claude Code `maxTurns` stops the agent and marks the output partial ([subagents][sub]). Without it, a run is unbounded. |
| `subagent_turns_research` | 30 | error | `maxTurns` in research/explore/review agents | Narrow the question | Anthropic's research system uses 3–10 tool calls for simple queries and 10–15 per subagent for comparisons ([multi-agent][ma]). 30 leaves room for reading code. |
| `subagent_context_tokens` | 200000 | process | Peak context of a subagent (status line / transcript usage) | The task was too big: decompose it before retrying | Quality degrades gradually as context fills ([Chroma][chroma]). Needing more than 200k means more than one task's worth of reading. |

## Parallelism and nesting

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `parallel_subagents` | 4 | process | Concurrent subagents of any kind | Queue | Anthropic's lead agent spawns "3-5 subagents in parallel" ([multi-agent][ma]). The Claude Code hard cap is 20 ([subagents][sub]), so parallelism is limited by orchestrator attention, not the platform. |
| `parallel_writers` | 3 | process | Concurrent subagents that edit files, each in its own git worktree | Queue | Equals `wip_in_progress`. More writers mean more merge conflicts, and the orchestrator must review every diff. |
| `subagent_spawn_depth` | 1 | error | `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` in `.claude/settings.json` | Fix the setting | CONCEPT.md: "Du orchestrierst nur". Only the orchestrator delegates. Default depth is 3 ([subagents][sub]). Nested delegation hides cost and breaks the forge audit trail. |

## Orchestrator context

Opus 5.5 and Sonnet 5.5 have 1M-token windows ([models][models]). A big
window does not mean usable recall: performance "degrades as context fills"
([CC BP][cc-bp], [Chroma][chroma]).

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `orchestrator_context_warn_tokens` | 150000 | process | Status-line context counter | Write `forge/HANDOFF.md` (state, open tasks, decisions), then `/compact` with focus instructions | 150k is the default trigger of the API's server-side compaction (`compact-2026-01-12`). Anthropic's research lead saves its plan to memory before truncation ([multi-agent][ma]). |
| `orchestrator_context_max_tokens` | 300000 | process | Same | Mandatory fresh session started from `HANDOFF.md` and BOARD.md | A clean session with a better prompt "almost always outperforms" a long, cluttered one ([CC BP][cc-bp]). The forge files are the durable memory, so a restart loses nothing. |

## Model routing

CONCEPT.md allows only Opus 5.5 and Sonnet 5.5. Sonnet costs half as much
(in $2 / out $10 per MTok vs $4 / $20) ([pricing][models]).

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `route_sonnet_max_diff_lines` | 200 | process | Estimated diff of the task (planner writes `estimate_lines`) | Above it → Opus | The lower bound of the SmartBear window. Larger changes need more design judgment. |
| `route_sonnet_max_files` | 5 | process | Files the plan expects to touch | Above it → Opus | Cross-file consistency is where the weaker model slips. |
| `route_escalate_after_rounds` | 1 | process | Failed review rounds on Sonnet | Round 2 runs on Opus with the review notes | Cheaper than a second Sonnet failure (see `review_rounds` in [forge](budgets-forge.md)). |

Routing table (process):
- Always Opus: epic planning, task decomposition, architecture/ADR, sim-core
  balance logic, code review, debugging after 1 failed attempt, retros,
  harness/skill edits.
- Sonnet by default: well-specified tasks under both thresholds, tests for
  existing code, docs, research gathering, mechanical refactors and renames.
- Effort: Opus 5.5 defaults to `medium` ([models][models]). Use `high` for
  planning and review, `low` for mechanical tasks.

## Cost

Rough per-task estimate for an implementation task (50 turns, ~60k
average context, mostly cache reads at $0.20/MTok, ~40k output tokens):
Opus ≈ $2, Sonnet ≈ $1. These are assumptions, to be replaced with measured
data after the first epic.

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `task_cost_usd` | 5 | process | Sum of session cost of every agent run on a task, recorded as `cost_usd` | Stop and check for thrashing, then decompose | At 2.5× the estimate, the task is looping, not progressing. |
| `epic_cost_usd` | 60 | process | Sum over the epic's tasks, reviews and retros | Retro on efficiency (skills, prompts, routing) | 12 tasks × (implementation + review) ≈ $36, plus headroom. |

## Tooling latency

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `hook_ms` | 3000 | warn | Wall time per hook invocation (hook logs its own duration) | Scope the hook to changed files | Hooks run on every matching tool call, so their latency multiplies across a session. |
| `lint_s` | 10 | error | Wall time of the budgets linter on the full repo | Cache, or lint only changed files | Runs pre-commit and often in-loop. It must stay well below `check_all_s` (120). |
| `budget_warnings_total` | 25 | warn | Count of all `warn` findings in a full lint run | Orchestrator opens a cleanup task | Unbounded warnings get ignored. This is a budget on the budgets. |

## Sources

[ctx]: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
[ma]: https://www.anthropic.com/engineering/multi-agent-research-system
[sub]: https://code.claude.com/docs/en/sub-agents
[cc-bp]: https://code.claude.com/docs/en/best-practices
[chroma]: https://www.trychroma.com/research/context-rot
[models]: https://platform.claude.com/docs/en/about-claude/models/overview
[metr]: https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/

- Effective context engineering: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- How we built our multi-agent research system: https://www.anthropic.com/engineering/multi-agent-research-system
- Claude Code subagents (maxTurns, spawn depth, concurrency cap): https://code.claude.com/docs/en/sub-agents
- Claude Code best practices: https://code.claude.com/docs/en/best-practices
- Chroma, Context Rot: https://www.trychroma.com/research/context-rot
- Models and pricing (Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, 1M context; claude-api skill cache 2026-09-25): https://platform.claude.com/docs/en/about-claude/models/overview
- METR time horizons (task length vs agent success): https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/
