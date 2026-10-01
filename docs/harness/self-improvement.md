---
title: Self-improvement loop
summary: How the harness improves itself - retro cadence and template, where lessons go (lint > template > rule > skill > CLAUDE.md), skill lifecycle with test scenarios, and doc gardening.
keywords: [retro, self-improvement, skills, lessons, doc-gardening, maintenance]
type: guide
status: active
updated: 2026-10-01
related: [orchestrator.md, workflow.md, budgets.md, ../../.claude/skills/retro/SKILL.md, ../research/harness/harness-engineering-self-improvement.md]
---

# Self-improvement loop

observe → diagnose the root cause → encode in the cheapest durable form → verify → prune.
A chat-only correction is lost at the next `/clear`; every retro deletes as well as adds.

## Where lessons go

Pick the first form that can carry the lesson:

| Rank | Form | Cost | Example |
|---|---|---|---|
| 1 | Lint, test or hook (`tools/harness/`) | zero context, cannot be ignored | "tasks without Out of scope" becomes a lint rule |
| 2 | Template or generator (`harness:new`) | zero context, right shape by default | add an `## Evidence` section to the task template |
| 3 | Path-scoped rule (`.claude/rules/*.md` with `paths:`) | loads only near matching files | sim determinism rules for `src/sim/**` |
| 4 | Skill edit or new skill | description always, body on use | a review step the reviewer keeps missing |
| 5 | Agent prompt edit | one role | implementer forgets to update docs |
| 6 | `CLAUDE.md` line | every agent, every turn, forever | last resort |

Triggers: same review finding twice → rank 1 or 4; same procedure pasted a third time →
skill; must happen every time → hook; agent re-asks something documented → fix that
doc's summary and keywords.

## Retro

**When**: every `retro_every_tasks` done tasks, at every epic close, and after any task
that hit the attempt cap. The orchestrator invokes the `retro` skill, which runs in a
fresh Opus context on collected data, never from the orchestrator's memory.

**Inputs** (collected by commands, not recalled): task Logs since the last retro
(attempts, rounds, escalations), review findings by severity and area, lint warning
counts, active budget overrides, skills used, the previous retro's actions.

**Template** (`npm run harness:new -- retro --title "<scope>"`):

| Section | Content |
|---|---|
| What Went Well | Numbers: tasks done, first-pass approval rate, avg attempts |
| What Went Wrong | Top 3 friction points, each with evidence (T###, R###) and root cause |
| Learnings | What the root causes say about the harness |
| Actions | At most `retro_actions_max`, each naming its form (rank above) and evidence |
| Deletions | Mandatory: what was pruned, or why nothing could be |

**Actions**: small harness edits (≤ ~30 lines) are applied in the retro run itself;
larger ones become tasks in the current harness epic. Unfinished actions from the
previous retro are reviewed first. The orchestrator commits `RT###: <title>`.

## Skill lifecycle

- **Birth from evidence only**: a retro action, or the third repetition of a procedure.
  No speculative skills.
- **Scenarios first**: before writing, describe 2-3 test scenarios with expected
  behaviour in `.claude/skills/<name>/tests.md` (what the agent is given, what it must
  do, what it must not do). Then write the minimal skill that passes them.
- **Shape**: `name` lowercase-hyphen; `description` third person, what + when,
  ≤ `skill_description_chars` warn level; critical rules in the first 20 lines (only the
  start survives compaction); `SKILL.md` within `skill_md_lines`; detail in sibling
  files one level deep; repo metadata under `metadata:`.
- **Verify**: after creating or editing a skill, a fresh subagent on the model that will
  use it runs the scenarios. Observe what it reads, skips or ignores; fix the skill, not
  the scenario. Ignored supporting files are deleted.
- **Retire**: delete a skill when a lint, hook or generator replaced it, or when it went
  unused for two retros (`/skill-doctor` helps). Git history is the archive.
- Skills are preloaded into agents via `skills:` where the role always needs them
  (implementer: `forge-task`, reviewer: `forge-review`, planner: `plan-epic`).

## CLAUDE.md upkeep

- Target ≤ 100 lines (hard cap `claude_md_lines`). Role-neutral: subagents load it too.
- A line enters only after the same mistake happened twice and no higher-ranked form fits.
- At every retro, per line: "Would removing this cause mistakes?" If not, delete it.

## Doc gardening

The `doc-gardener` (Sonnet) keeps the knowledge base honest.

- **When**: at every retro, when warnings exceed `budget_warnings_total`, or when
  `related_code` drift warnings appear.
- **Input**: `npm run harness:lint` warnings, drift warnings, docs changed since the
  last gardening sha in HANDOFF.md.
- **Rules**: fix links, frontmatter and splits directly; never delete (deprecate and
  link the replacement); merge duplicates into the older doc; anything needing judgment
  goes into the report as a proposed task.
- Mechanical sweeps are committed `docs: garden <scope>` after `harness:check` passes;
  content changes go through a normal task and review.

## Harness changes are changes

Harness edits (CLAUDE.md, docs/harness, agents, skills, hooks, budgets) never ride along
with feature work. They come from a retro or a harness task, are their own commit, and
can be reverted alone.
