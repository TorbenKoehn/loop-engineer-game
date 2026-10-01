---
title: Claude Code file formats reference
summary: Verified reference for SKILL.md, subagent files, CLAUDE.md/rules loading, imports and commands-vs-skills, checked against code.claude.com on 2026-10-01.
keywords: [claude-code, skills, subagents, claude-md, frontmatter, rules, reference]
type: research
status: active
updated: 2026-10-01
related: [claude-code-formats-hooks.md, harness-engineering.md, orchestration-patterns.md, claude-code-formats-memory.md]
---

# Claude Code file formats (verified 2026-10-01)

Fetched from the official docs on 2026-10-01 (Claude Code v2.1.28x era).
Version notes are quoted where the docs give them. Hooks are in
[claude-code-formats-hooks.md](claude-code-formats-hooks.md).

## Contents
- Skills (`.claude/skills/<name>/SKILL.md`)
- Subagents (`.claude/agents/<name>.md`)
- CLAUDE.md, rules, imports, commands: [claude-code-formats-memory.md](claude-code-formats-memory.md)
- Gotchas for this repo's frontmatter schema
- Sources

## Skills

**Locations**: `~/.claude/skills/<name>/SKILL.md` (personal),
`.claude/skills/<name>/SKILL.md` (project), nested `<subdir>/.claude/skills/`
(loaded when Claude first reads/edits a file in that subdir), plugin `skills/`.
Project skills load from the start dir and every parent up to the repo root.
Skill dirs are watched: `SKILL.md` text edits are picked up live in-session.

**Frontmatter** (all optional; unknown fields are *silently ignored*; if the
YAML fails to parse the skill loads with no fields set, see `claude --debug`):

| Field | Meaning / constraint |
|---|---|
| `name` | `/` command name; defaults to directory name. Spec: max 64 chars, `a-z0-9-` only, no "anthropic"/"claude" |
| `description` | What + when. Recommended. Combined with `when_to_use` capped at **1,536 chars** in the listing. Spec max 1,024 chars, third person |
| `when_to_use` | Extra trigger text, appended to description, counts toward the cap |
| `argument-hint` | Autocomplete hint, e.g. `[task-id]` |
| `arguments` | Named positional args for `$name` substitution (string or list) |
| `disable-model-invocation` | `true` = only the user can invoke; description is NOT in context; not preloadable into subagents |
| `user-invocable` | `false` = hidden from `/` menu, Claude-only background knowledge |
| `allowed-tools` | Tools pre-approved for the invoking turn only (space/comma list or YAML list), e.g. `Bash(npm run harness:*)` |
| `disallowed-tools` | Tools removed while the skill is active |
| `model` | Model override while active (`/model` values or `inherit`) |
| `effort` | `low`, `medium`, `high`, `xhigh`, `max` |
| `context` | `fork` = run in an isolated forked subagent (no conversation history) |
| `agent` | Subagent type for `context: fork` (`Explore`, `Plan`, `general-purpose`, or a custom agent) |
| `background` | Forked skill runs in background by default (`true`); `false` waits (v2.1.218+) |
| `hooks` | Hooks registered on invocation, live for the rest of the session; `once: true` supported |
| `paths` | Globs limiting when the skill auto-activates |
| `shell` | `bash` (default) or `powershell` for `` !`cmd` `` injection |
| `metadata` | Free-form map for external tooling; Claude Code ignores it |
| `license`, `compatibility` | Agent Skills spec fields, accepted but not acted on |

**Body substitutions**: `$ARGUMENTS`, `$ARGUMENTS[N]`, `$N`, `$name`,
`${CLAUDE_SESSION_ID}`, `${CLAUDE_EFFORT}`, `${CLAUDE_SKILL_DIR}`,
`${CLAUDE_PROJECT_DIR}` (v2.1.196+). Escape with `\$`.

**Dynamic context**: a line with `` !`git status --short` `` (or a ```` ```! ````
fence) runs once at render time and inlines stdout. Non-zero exit aborts the
whole invocation (exit 1 of grep/find/diff is tolerated). Permission rules
apply; `allowed-tools` can pre-approve the command.

**Loading and budgets**
- Name + description of every model-invocable skill are in context every turn.
  The listing budget is **1% of the context window** (`skillListingBudgetFraction`);
  on overflow, descriptions of the least-used skills are dropped first.
- The body loads only on invocation and then stays in context (not re-read).
  After compaction, the most recent invocation of each skill is re-attached
  (first 5,000 tokens per skill, 25,000 tokens shared): put critical rules first.
- Keep the body **under 500 lines**; move reference material to sibling files
  linked directly from SKILL.md (one level deep; ToC for files > 100 lines).
- `skillOverrides` in settings: `on`, `name-only`, `user-invocable-only`, `off`.
- `/skills` lists skills, `/skill-doctor` (v2.1.252+) finds unused/costly ones.

**Minimal example**

```markdown
---
name: forge-task
description: Creates and transitions forge task files (epics, tasks, reviews). Use when planning work, changing task status, or writing a review in forge/.
allowed-tools: Bash(npm run harness:*)
---
# Forge task workflow
1. Create tasks only via `npm run harness:new -- task ...`.
2. ...
For field rules see [reference.md](reference.md).
```

## Subagents

**Locations / priority** (high to low): managed settings, `--agents` CLI JSON,
`.claude/agents/` (walks up from cwd; closest wins), `~/.claude/agents/`,
plugin `agents/`. Duplicate names inside one directory: one loads, order undefined.

**Frontmatter**

| Field | Req | Meaning / values |
|---|---|---|
| `name` | yes | Unique id; no `:` (file is not loaded, v2.1.218+). Filename need not match |
| `description` | yes | When to delegate. Add "Use proactively ..." to encourage auto-delegation |
| `tools` | no | Allowlist (comma string or YAML list). Omitted = inherit all subagent tools |
| `disallowedTools` | no | Denylist; `Bash(git push *)` still removes the whole tool |
| `model` | no | `sonnet`, `opus`, `haiku`, `fable`, full ID (e.g. `claude-opus-5-5`), or `inherit` |
| `permissionMode` | no | `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan`, `manual` (alias of default) |
| `maxTurns` | no | Turn cap; output returned marked partial (v2.1.246+), resumable |
| `skills` | no | Skills whose FULL content is preloaded at start |
| `mcpServers` | no | Server names or inline configs |
| `hooks` | no | Hooks active only while this agent runs; `Stop` becomes `SubagentStop` |
| `memory` | no | `user`, `project` (`.claude/agent-memory/<name>/`), `local`; loads first 200 lines/25KB of its MEMORY.md |
| `background` | no | `true` = always run in background |
| `omitClaudeMd` | no | Skip user/project/local CLAUDE.md (v2.1.271+) |
| `effort` | no | `low` ... `max` |
| `isolation` | no | `worktree` = temp git worktree, auto-removed if unchanged |
| `color` | no | `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan` |
| `initialPrompt` | no | First turn when used as main-session agent (`--agent`) |

The Markdown body is the agent's **system prompt** (it does not get the Claude
Code system prompt).

**Model resolution order**: per-invocation `model` parameter, then frontmatter
`model`, then `CLAUDE_CODE_SUBAGENT_MODEL`, then the main conversation's model.
`CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` overrides everything (v2.1.257+).

**What a subagent starts with**: its system prompt, the delegation message,
all CLAUDE.md levels + rules (unless `omitClaudeMd`), git status snapshot,
preloaded skills, a sibling roster. It does NOT get conversation history,
output style, or main-session auto memory. Explore and Plan skip CLAUDE.md
and git status. Rules that must reach a worker belong in CLAUDE.md or must be
restated in the delegation prompt.

**Tools**: subagents never get `AskUserQuestion`, `EnterPlanMode`,
`ScheduleWakeup`, `Workflow`; background subagents (the default) are limited to
Read, Grep, Glob, LSP, Bash, PowerShell, Edit, Write, NotebookEdit, WebFetch,
WebSearch, TodoWrite, Skill, ToolSearch, worktree tools, Monitor, TaskStop,
SendMessage, Artifact (+ MCP tools).

**Limits**: nesting depth default 3 layers (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`,
`1` disables nesting); 20 concurrent subagents (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`,
v2.1.217+). Omit `Agent` from `tools` to stop an agent from spawning.

**Resume**: each invocation is fresh; continue a finished subagent via
`SendMessage` (by id or name). Explore/Plan cannot be resumed.

**Main-session agent**: `claude --agent <name>` or `"agent": "<name>"` in
`.claude/settings.json`. The agent's prompt then *replaces* the whole Claude
Code system prompt (CLAUDE.md still loads). Only there does
`tools: Agent(worker, reviewer)` restrict spawnable types.

## CLAUDE.md, rules, imports, slash commands

Moved to [claude-code-formats-memory.md](claude-code-formats-memory.md).

## Gotchas for this repo's frontmatter schema

- **SKILL.md / agent files**: do not force `title/summary/keywords` onto them.
  Validate them with Claude Code's own schema (`name`, `description`) and map
  `description` to the index summary, as `harness.config.json` already does.
  If extra repo metadata is wanted in a skill, put it under `metadata:`.
- **CLAUDE.md**: the docs only promise stripping for rules frontmatter and
  HTML comments, so assume YAML frontmatter in CLAUDE.md is injected as text
  every turn. Keep CLAUDE.md frontmatter-free and put metadata into a block
  HTML comment (stripped, zero tokens).
- **Rules files** may carry the repo frontmatter: only `paths` is read and the
  block is stripped before injection.
- Descriptions are the trigger: a vague skill description means the skill
  never loads. Third person, "what + when", concrete keywords.
- Use forward slashes in every path inside skills and docs.

## Sources
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/slash-commands
- https://code.claude.com/docs/en/features-overview
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
