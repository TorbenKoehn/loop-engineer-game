---
title: Harness engineering - principles and recommendations
summary: Core principles for this repo's agent harness (context, docs as system of record, mechanical enforcement, verification) and a prioritized list of concrete actions.
keywords: [harness, context-engineering, claude-md, progressive-disclosure, enforcement, recommendations]
type: research
status: active
updated: 2026-10-01
related: [harness-engineering-knowledge-base.md, harness-engineering-forge.md, harness-engineering-self-improvement.md, orchestration-patterns.md, claude-code-formats.md, claude-code-formats-hooks.md, ../budgets/budgets-docs.md]
---

# Harness engineering for Loop Engineer

## Contents
- Principles
- Role separation gotcha (important)
- Target layout
- Action list (prioritized)
- What not to do
- Sources

> Research. The adopted harness is described in [docs/harness/](../../harness/overview.md).
> Deviations from this proposal: auto memory stays enabled (it holds the user's personal
> memory), but project knowledge must still live in the repo; game design lives in
> `docs/game/`, architecture and ADRs in `docs/architecture/`.

"Agent = model + harness." The harness is everything around the model that
decides what it sees, what it may do, and how it finds out it was wrong. This
file holds the principles and the action list. Details are split out:

| Topic | File |
|---|---|
| Docs as system of record, INDEX, drift, garbage collection | [harness-engineering-knowledge-base.md](harness-engineering-knowledge-base.md) |
| In-repo forge: tasks, status flow, WIP, DoD, reviews | [harness-engineering-forge.md](harness-engineering-forge.md) |
| Retros, skill and CLAUDE.md maintenance | [harness-engineering-self-improvement.md](harness-engineering-self-improvement.md) |
| Orchestrator, subagents, models, delegation, retries | [orchestration-patterns.md](orchestration-patterns.md) |
| Verified Claude Code file formats | [claude-code-formats.md](claude-code-formats.md), [claude-code-formats-hooks.md](claude-code-formats-hooks.md) |
| Numeric budgets | [budgets-docs.md](../budgets/budgets-docs.md), [budgets-forge.md](../budgets/budgets-forge.md), [budgets-agents.md](../budgets/budgets-agents.md) |

## Principles

**P1. Context is the scarce resource. Spend it like money.**
Recall degrades as the window fills ("context rot", finite "attention
budget"). Aim for "the smallest possible set of high-signal tokens".
→ Everything always-loaded (CLAUDE.md, skill descriptions, hook output) gets a
hard budget; everything else is fetched just-in-time by path.

**P2. Give a map, not a manual.**
OpenAI's Codex team failed with one big AGENTS.md (it crowds out the task,
too much guidance becomes non-guidance, it rots instantly) and switched to a
~100-line AGENTS.md that is a table of contents into `docs/`. Anthropic: keep
CLAUDE.md under 200 lines; for each line ask "Would removing this cause Claude
to make mistakes?". → Root CLAUDE.md ≤ 100 lines, pointing at INDEX.md files.

**P3. The repo is the only system of record.**
"What the agent can't see doesn't exist." Decisions made in chat, in the
orchestrator's head, or in machine-local auto memory are lost at the next
`/clear`. → Every decision, plan, review and retro lands as a frontmatter
Markdown file. Set `"autoMemoryEnabled": false` in `.claude/settings.json`
so knowledge cannot silently drift into `~/.claude/projects/.../memory/`.

**P4. Enforce mechanically; instruct only what cannot be checked.**
CLAUDE.md is "context, not enforced configuration". Hooks "guarantee the
action happens". OpenAI encodes rules as custom linters whose error messages
contain the fix. → If a rule can be a check (frontmatter, line budgets, links,
generated files untouched, status transitions), it is a check in
`tools/harness/`, run by hooks, and its message says how to fix it.

**P5. Guides before, sensors after; computational before inferential.**
Fowler/Böckeler: feedforward guides (docs, skills) plus feedback sensors
(tests, lints, review). Deterministic sensors are cheap and reliable; LLM
review is expensive and fuzzy. → Order every gate: `tsc` → lint → vitest →
harness check → reviewer agent. Never pay for an LLM review on code that fails
`tsc`.

**P6. Progressive disclosure in layers.**
Skills load name+description, then SKILL.md, then linked files. Apply the same
ladder to docs: CLAUDE.md map → directory INDEX.md (title + summary per file)
→ file → `related` links. → Agents navigate by INDEX summaries and read full
files only when the summary says they must.

**P7. One unit of work per context; always leave a clean state.**
Anthropic's long-running harness failed when agents tried to "one-shot the
app"; the fix was one feature per session, a progress file, a git commit and
a structured startup routine. → One forge task per subagent run, one commit
per task, a `forge/HANDOFF.md` state file (history lives in git and in done
task files), and a fixed startup routine for the orchestrator.

**P8. The writer never grades itself.**
"Give Claude a check it can run" and "have a subagent review the diff in a
fresh context". A reviewer prompted to find gaps always finds some, so it
must flag only correctness and acceptance-criteria gaps. → Every task goes
through checks, then an independent reviewer with a severity threshold.

**P9. Fight entropy continuously.**
Agent-written repos accumulate drift; OpenAI runs a doc-gardening agent and
recurring "garbage collection" that turns repeated review comments into
lints. → Scheduled gardener runs plus a rule: a mistake seen twice becomes a
check, a skill edit or a CLAUDE.md line, never just a chat correction.

**P10. Grow the harness from observed failures.**
"Start with simple prompts ... add multi-step agentic systems only when
simpler solutions fall short." Claude Code's own guidance lists triggers
(mistake twice → CLAUDE.md; same playbook third time → skill; must happen
every time → hook). → No speculative skills or agents; each harness addition
cites the failure or retro that motivated it.

## Role separation gotcha (important)

Every custom subagent loads all CLAUDE.md levels. A CLAUDE.md line like "You
only orchestrate, never write code" is therefore also read by the implementer
and can make it refuse work. Options, in order of preference:

1. Keep CLAUDE.md **role-neutral** (shared conventions only) and inject the
   orchestrator protocol through a `SessionStart` hook (matcher
   `startup|resume|clear|compact`) that prints `docs/harness/orchestrator.md`.
   SessionStart context reaches only the main session, and it re-fires after
   compaction, so the protocol survives `/compact`.
2. Alternatively run the main session as `claude --agent orchestrator`. This
   replaces the whole Claude Code system prompt, losing built-in tool
   guidance; only worth it if you also want `tools: Agent(...)` allowlisting.
3. Worker agents that need nothing from CLAUDE.md can set `omitClaudeMd: true`.

## Target layout

Superseded: the adopted layout is described in
[docs/harness/overview.md](../../harness/overview.md).

## Action list (prioritized)

**Now (before the first game epic)**
1. Write root CLAUDE.md as a map: one-paragraph purpose, the 5 commands
   (`npm run harness:check`, `harness:new`, `test`, `tsc`, dev server), the
   frontmatter schema pointer, "generated files are never hand-edited", "one
   task = one commit". Nothing that a linter already enforces.
2. Move the orchestrator protocol into `docs/harness/orchestrator.md` and
   inject it with a SessionStart hook (see role separation above).
3. Fix the hook issues listed in
   [claude-code-formats-hooks.md](claude-code-formats-hooks.md#review-of-this-repos-current-hooks-2026-10-01):
   SubagentStop matcher, scoped lint, atomic regeneration, PreToolUse guard for
   generated files, crash = fail for gates.
4. Add `"autoMemoryEnabled": false` to `.claude/settings.json`.
5. Create the agent roster from [orchestration-patterns.md](orchestration-patterns.md)
   (planner, implementer, reviewer, researcher, doc-gardener; QA later).
6. Add path-scoped rules: `.claude/rules/forge.md` (`paths: forge/**`) with the
   task template rules; `.claude/rules/code.md` (`paths: src/**`) with code
   conventions. This keeps CLAUDE.md small.

**Next (during epic 1)**
7. Add `forge/HANDOFF.md` and the orchestrator startup routine (read
   HANDOFF.md, BOARD.md, `git log --oneline -10`; pick the top ready task). Delegation prompt template as a skill (`delegating-tasks`).
8. Add drift checks to the linter: broken relative links, `related` targets
   exist, `related_code` paths exist and are not newer than `updated`.
9. Add a Playwright-based smoke check for the game so "done" means "seen
   running", not "compiles" (Anthropic: browser testing "dramatically improved
   performance").

**Later (after 2-3 epics)**
10. First retro → first skill edits. Run `/skill-doctor` and
    `/doctor prompt-audit` at each retro.
11. Scheduled doc-gardener run every N done tasks (see knowledge-base file).
12. A small harness eval set (3-5 canonical tasks) to test harness changes
    before adopting them (evaluation-driven, per Anthropic skill guidance).

## What not to do

- No llms.txt or AGENTS.md duplicates: the INDEX.md tree already is the map,
  and only Claude Code reads this repo. Borrow llms.txt's "Optional" section
  idea for low-priority INDEX entries if needed.
- No `@imports` of big docs into CLAUDE.md: imports load at launch and cost
  the same as inline text.
- No speculative skills, agents or MCP servers (P10).
- No rules restated in three places (CLAUDE.md + skill + agent prompt):
  contradictions make Claude "pick one arbitrarily". One owner per rule.

## Sources
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- https://www.anthropic.com/engineering/building-effective-agents
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- https://www.anthropic.com/engineering/multi-agent-research-system
- https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- https://code.claude.com/docs/en/best-practices
- https://code.claude.com/docs/en/features-overview
- https://code.claude.com/docs/en/memory
- https://openai.com/index/harness-engineering/ (403 to fetchers; read via
  https://b-lab.team/en/content/64932f27-92ac-4c9c-8bdb-3c24523add07 and
  https://gist.github.com/intellectronica/1a9018ed642096fc81b0eeb1f2c8b63c)
- https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html
