---
title: Orchestration patterns - parallelism, retries, hooks
summary: When to run subagents in parallel, the retry and escalation ladder, and the hooks that keep orchestration honest.
keywords: [orchestration, parallelism, retries, escalation, hooks, worktree]
type: research
status: active
updated: 2026-10-01
related: [orchestration-patterns.md, ../budgets/budgets-agents.md]
---

# Orchestration patterns - parallelism, retries, hooks

Part of [orchestration-patterns.md](orchestration-patterns.md).

## Parallelism

- Parallel only when tasks are independent and their expected file sets
  (from the task's Context section) are disjoint.
- Max `parallel_writers` (3) implementers, each `isolation: worktree`; up to
  `parallel_subagents` (4) total. Read-only fan-out (research, review of
  different tasks) is safe; parallel writers into one checkout are not.
- Spawn parallel subagents in one message so they run concurrently; Anthropic
  measured up to 90% less time for complex research with parallel subagents
  and tool calls.
- Remember the synchronous bottleneck: the orchestrator cannot steer a
  running subagent. Keep tasks small enough that waiting is cheap.
- Merge worktrees one at a time, re-running checks after each merge.

## Retries and escalation

| Failure | First response | Second |
|---|---|---|
| Tool/network flake (timeout, 5xx) | Retry the same subagent once (SendMessage resume) | Mark blocked with the error |
| Ambiguous spec (agent stops with questions) | Orchestrator fixes AC/Context in the task file, delegates fresh | Ask the user |
| Review `changes-requested` on Sonnet | Fresh implementer on **Opus** with the review file as input | Orchestrator re-plans or splits |
| Same failure after Opus round | Re-plan: split task, check dependencies | Blocked + user question |
| Report partial (`maxTurns` hit) | Resume once if progress is visible | Decompose |
| Hook keeps blocking (stop cap reached) | Read the lint output, fix the rule or the generator | Retro item |

Resume (SendMessage) when the agent's context is valuable and the fix is
small; start fresh when it went off track, because "a clean session with a
better prompt almost always outperforms a long session with accumulated
corrections". Every retry increments `attempts`; at the cap, stop.

## Hooks that keep orchestration honest

- `PostToolUse` matcher `Agent`: add `additionalContext` stating "Subagent
  reports are unverified until npm run harness:check and the task's tests are
  re-run" (fact-phrased, so it is not treated as injection).
- `SubagentStop` matcher `implementer|doc-gardener`: block handback while the
  agent's touched files fail lint, honoring `stop_hook_active`.
- `SessionStart` matcher `startup|resume|clear|compact`: inject the
  orchestrator brief and the BOARD summary.
- `PreCompact`: remind to update HANDOFF.md (exit 0 with context, no block).
