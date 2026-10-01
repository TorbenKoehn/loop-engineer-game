---
title: Harness engineering - self-improvement loop
summary: How the harness improves itself - failure signals mapped to harness changes, retro format, skill lifecycle with evals, CLAUDE.md pruning rules and harness canary tests.
keywords: [retro, skills, claude-md, self-improvement, evals, maintenance]
type: research
status: active
updated: 2026-10-01
related: [harness-engineering.md, harness-engineering-knowledge-base.md, harness-engineering-forge.md, ../budgets/budgets-forge.md]
---

# Self-improvement: retros, skills, CLAUDE.md

Part of [harness-engineering.md](harness-engineering.md). CONCEPT.md asks the
orchestrator to create and maintain its own skills and harness files. The
risk is accretion: every lesson becomes another always-loaded line until the
rules drown. The loop below forces each lesson into the cheapest durable form
and deletes as much as it adds.

## Contents
- The loop
- Signal → change mapping
- Retro format
- Skill lifecycle
- CLAUDE.md upkeep
- Testing harness changes
- Anti-patterns
- Sources

## The loop

observe (signals) → diagnose (root cause, not symptom) → encode (cheapest
durable form) → verify (canary task) → prune (remove what the new form
replaced).

"Cheapest durable form", in order of preference:
1. **Lint/test/hook** - deterministic, zero context cost, cannot be ignored.
2. **Template or generator** - makes the right shape the default.
3. **Path-scoped rule** - loads only where relevant.
4. **Skill edit / new skill** - loads on demand.
5. **Agent prompt edit** - affects one role.
6. **CLAUDE.md line** - last resort, costs context in every agent forever.

## Signal → change mapping

| Signal (where it shows) | Likely change |
|---|---|
| Same review finding twice (review files) | Lint rule, or a line in the reviewer + implementer skill |
| Agent re-asks something answered in docs | Fix the summary/keywords so INDEX navigation finds it |
| Agent ignores a CLAUDE.md rule | CLAUDE.md too long or rule vague; make it a hook if checkable |
| Orchestrator pastes the same procedure a 3rd time | New skill |
| Task exceeds `attempts` or `review_rounds` | Decomposition or AC quality problem: planner prompt edit |
| Stop hook blocks often on the same rule | Move check earlier (PostToolUse) or add a generator |
| Subagent report too long / missing evidence | Delegation template output contract |
| Hook slower than `hook_ms` | Scope to changed files |
| Skill never triggers (`/skill-doctor`) | Rewrite description or delete the skill |

Claude Code's own trigger list agrees: mistake twice → CLAUDE.md; same
playbook third time → skill; must happen every time → hook ("A repeated
mistake or a recurring review comment is a CLAUDE.md edit, not a one-off
correction in chat").

## Retro format

When: every 10 done tasks or at epic close (`retro_every_tasks`), and after
any task that hit its attempt cap. Run by an Opus agent in fresh context with
the data below, not by the orchestrator from memory.

Inputs (collected by a script, not recalled):
- Done tasks since last retro with `attempts`, `review_rounds`, `cost_usd`.
- Review findings grouped by severity and file area.
- Lint findings counts by rule; Stop/SubagentStop block counts (hooks append
  one JSON line per block to a gitignored `.harness/events.jsonl`).
- `/skill-doctor` and `/doctor prompt-audit` output.

Retro file sections: What happened (numbers) · Top 3 friction points with
root cause · Actions (max 3, each becomes a forge task with AC, labelled
`harness`) · Deletions (what gets removed, mandatory, may be "none" with a
reason). Unfinished actions from the previous retro are reviewed first.

## Skill lifecycle

**Birth** - only from evidence: a retro action, or the third repetition of
a procedure. Name it gerund-style (`delegating-tasks`, `writing-docs`).

**Evaluation first** (Anthropic skill best practices): before writing, run a
representative task without the skill, note the failures, write 3 test
scenarios with expected behaviour, then write the minimal skill that fixes
them. Store scenarios in `.claude/skills/<name>/evals.md`.

**Claude A / Claude B**: the authoring agent (Opus) writes the skill; a fresh
subagent (the model that will actually use it) runs the scenarios. Observe
what it reads, misses or ignores; feed that back. Ignored bundled files get
deleted; repeatedly read files move into SKILL.md.

**Description** (the trigger): third person, what + when, concrete nouns the
orchestrator will actually say. ≤ 300 chars in this repo even though Claude
Code allows 1,536, because all descriptions share 1% of the context window.
Bad: `Helps with tasks`. Good: `Creates forge tasks and moves them between
statuses with precondition checks. Use when planning work, delegating a
task, or recording a review verdict in forge/.`

**Body**: imperative steps, critical rules in the first 20 lines (only the
first 5,000 tokens survive compaction), references one level deep, forward
slashes, scripts for anything deterministic ("solve, don't defer").

**Side effects**: skills that commit, move statuses or run gardening get
`disable-model-invocation: true` only if the user should be the sole trigger;
the orchestrator needs most forge skills invocable, so prefer
`allowed-tools` scoping instead.

**Retirement**: delete a skill when a hook/lint/generator replaced it, or
when `/skill-doctor` shows it unused for two retros. Git history is the
archive.

Initial skills worth creating now (procedures already known to repeat):
`delegating-tasks` (prompt template + output contract), `managing-forge`
(task creation, transitions, review files), `writing-docs` (frontmatter,
summary rules, splitting), `reviewing-changes` (severity rubric; preloaded
into the reviewer via `skills:`), `running-retros`. Game-domain skills come
later, from retros.

## CLAUDE.md upkeep

- Cap: 100 lines (config allows 150; stay well below so additions are cheap).
- A line enters only after the second occurrence of the same mistake, and
  only if it cannot be a check, rule file or skill.
- Deletion test at every retro, per line: "Would removing this cause Claude
  to make mistakes?" If Claude already behaves correctly without it, delete it
  or turn it into a hook.
- `IMPORTANT` on at most one or two lines; emphasis everywhere means nowhere.
- No content an agent can derive from the code (layout listings, dependency
  lists); `/doctor` proposes exactly these cuts.
- Use block HTML comments for maintainer notes (stripped, zero tokens).
- Same rules for `.claude/rules/*.md` and agent bodies; run
  `/doctor prompt-audit` at each retro to catch contradictions and dead
  references.

## Testing harness changes

A harness change can silently make every future task worse. Keep 3 canary
tasks (`docs/harness/canaries.md`): one doc task, one small code task, one
review task, each with known-good outcome. After a change to CLAUDE.md, a
skill used by implementers, an agent prompt or a hook, run the affected canary
in a fresh subagent and compare attempts, review findings and token usage
against the last recorded run. Anthropic's research team saw that "a few test
cases" are enough early on because effects are large.

## Anti-patterns

- Rules from imagination: a skill or CLAUDE.md line without a recorded failure.
- Self-grading retros: the agent that did the work writes the lessons.
- Editing the harness mid-task: harness changes are their own tasks and
  commits, so a bad change can be reverted alone.
- Fixing the symptom in chat: a correction that is not written down will be
  needed again after the next `/clear`.
- Unbounded logs: the events file is gitignored and truncated by the retro
  script; only retro summaries are kept.

## Sources
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- https://code.claude.com/docs/en/features-overview (build your setup over time)
- https://code.claude.com/docs/en/best-practices (CLAUDE.md pruning)
- https://code.claude.com/docs/en/memory (size, prompt audit, HTML comments)
- https://code.claude.com/docs/en/skills (listing budget, compaction re-attach)
- https://www.anthropic.com/engineering/multi-agent-research-system (small evals early)
- https://gist.github.com/intellectronica/1a9018ed642096fc81b0eeb1f2c8b63c (garbage collection day)
