---
title: Claude Code hooks reference
summary: Verified hooks schema for settings.json - events, matchers, stdin payloads, exit codes, JSON output, timeouts and Windows rules - with fixes for this repo's hooks.
keywords: [claude-code, hooks, settings, windows, exit-codes, stop-hook, reference]
type: research
status: active
updated: 2026-10-01
related: [claude-code-formats.md, harness-engineering.md, orchestration-patterns.md]
---

# Claude Code hooks (verified 2026-10-01)

Source: https://code.claude.com/docs/en/hooks and
https://code.claude.com/docs/en/hooks-guide (fetched 2026-10-01).

## Contents
- Where hooks live, schema · Events that matter for this repo · Matchers and the `if` filter
- Stdin payload · Exit codes and JSON output · Timeouts, parallelism, limits
- Windows and shell rules
- Review of this repo's current hooks

## Where hooks live, schema

`~/.claude/settings.json`, `.claude/settings.json` (committed),
`.claude/settings.local.json` (gitignored), managed policy, plugin
`hooks/hooks.json`, skill frontmatter (rest of session after invocation),
subagent frontmatter (while it runs). Hooks from all sources **merge**; identical
handlers across settings files run once. Settings-file hooks also fire for
tool calls inside subagents (payload then has `agent_id`, `agent_type`).
Edits are picked up live; restart if `/hooks` doesn't show them.
`"disableAllHooks": true` turns them off.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "node",
            "args": ["${CLAUDE_PROJECT_DIR}/tools/harness/hooks/post-edit.ts"],
            "timeout": 30, "statusMessage": "Reindexing docs" }
        ]
      }
    ]
  }
}
```

Handler `type`: `command`, `http`, `mcp_tool`, `prompt` (single LLM call), `agent`
(experimental, tool-using verifier). Common fields: `type`, `if`, `timeout` (seconds),
`statusMessage`, `once` (skill frontmatter only). Command fields: `command`, `args`
(exec form), `async`, `asyncRewake` (exit 2 wakes Claude), `shell` (`bash` | `powershell`).

## Events that matter for this repo

| Event | Matcher on | Can block | Typical use here |
|---|---|---|---|
| `SessionStart` | `startup`, `resume`, `clear`, `compact`, `fork` | no | Inject orchestrator brief + board summary (stdout/`additionalContext` becomes context) |
| `UserPromptSubmit` | none | yes | Rarely needed; 30 s default timeout |
| `PreToolUse` | tool name | yes | Protect generated files (INDEX.md, BOARD.md), block edits outside allowed dirs |
| `PostToolUse` | tool name | no (exit 2 shows stderr to Claude) | Regenerate indexes, lint the edited file |
| `PostToolUseFailure` | tool name | no | Log failures for retros |
| `SubagentStart` | agent type | no | Inject per-role context |
| `SubagentStop` | agent type | yes | Enforce "checks green before handback" for writer agents |
| `Stop` | none | yes | Repo-wide gate: index fresh, lint clean |
| `PreCompact` / `PostCompact` | `manual`, `auto` | Pre: yes | Write progress note before compaction |
| `InstructionsLoaded` | load reason | no | Debug which CLAUDE.md/rules loaded |
| `FileChanged` | literal filenames | no | React to files changed by any writer |
| `SessionEnd` | reason | no | 1.5 s shared budget: only trivial logging |

Others exist: `Setup`, `UserPromptExpansion`, `PermissionRequest`, `PermissionDenied`, `PostToolBatch`,
`TaskCreated`, `TaskCompleted`, `TeammateIdle`, `StopFailure`, `Notification`, `MessageDisplay`,
`ConfigChange`, `CwdChanged`, `DirectoryAdded`, `WorktreeCreate`, `WorktreeRemove`,
`PreModelSwitch`, `PostModelSwitch`, `Elicitation`, `ElicitationResult`.

## Matchers and the `if` filter

- `"*"`, `""` or omitted: match all.
- Only letters, digits, `_`, `-`, space, `,`, `|`: exact names, e.g.
  `Edit|Write` or `Edit, Write`. **Case-sensitive.**
- Anything else: unanchored JS regex (`Edit.*` also matches `NotebookEdit`;
  use `^Edit$`). MCP: `mcp__<server>__<tool>`.
- `if`: one permission rule, e.g. `"Edit(**/INDEX.md)"`, `"Bash(git push *)"`.
  Only evaluated on tool events; on other events a hook with `if` never runs.
  Best-effort: use permission rules for hard denies.
- `PostToolUse` on `Edit|Write` does NOT fire when Bash/PowerShell or an
  external process changes a file. For full coverage also scan
  `git status --porcelain` in the Stop hook.

## Stdin payload (JSON)

Common: `session_id`, `prompt_id`, `transcript_path`, `cwd`, `scratchpad_dir`,
`permission_mode` (Manual arrives as `"default"`), `effort.level`,
`hook_event_name`; inside subagents also `agent_id`, `agent_type`.

- Tool events: `tool_name`, `tool_input`, `tool_use_id`; PostToolUse adds
  `tool_response`, `duration_ms`. `tool_input.file_path` for Read/Write/Edit
  is **always absolute** and on Windows uses **backslashes**
  (`"C:\\project\\src\\index.ts"`). Bash: `tool_input.command`.
- `Stop`: `stop_hook_active` (true when already continuing because of a stop
  hook), `last_assistant_message`, `background_tasks`, `session_crons`.
- `SubagentStop`: `stop_hook_active`, `agent_id`, `agent_type`,
  `agent_transcript_path`, `last_assistant_message`. With `SubagentHandback`
  the delivered report is that tool's `tool_input.message`, not
  `last_assistant_message`. Internal agents (prompt suggestions, `/btw`)
  also fire SubagentStop with an empty `agent_type`.
- `SessionStart`: `source`, optional `model`, `agent_type`.
- Read `last_assistant_message`, not `transcript_path` (written async, may lag).

## Exit codes and JSON output

| Exit | Effect |
|---|---|
| 0 | Success. Stdout parsed as JSON if it starts with `{` and ends with `}`; plain stdout becomes context only for `SessionStart`, `UserPromptSubmit`, `UserPromptExpansion`, `PostModelSwitch`; otherwise debug log only. Stderr: debug log only |
| 2 | Blocking error on blockable events; stderr (or JSON `reason`) is the message. PreToolUse: tool blocked, Claude sees reason. Stop/SubagentStop: agent must continue, stderr is its next instruction. PostToolUse: stderr shown to Claude (tool already ran). SessionStart/SubagentStart: shown to user only |
| other (incl. 1) | **Non-blocking error**: action proceeds, first stderr line shown as hook error. A missing script (exit 127) silently disables a gate |

JSON (exit 0): universal `continue` (false stops Claude entirely),
`stopReason`, `systemMessage` (shown to user), `terminalSequence`;
`suppressOutput` has no effect. Decision fields:
- Stop, SubagentStop, PostToolUse, UserPromptSubmit, PreCompact:
  `{"decision": "block", "reason": "..."}`. Stop/SubagentStop also accept
  `hookSpecificOutput.additionalContext` = non-error "keep going" feedback.
- PreToolUse: `hookSpecificOutput.permissionDecision` = `allow|deny|ask|defer`,
  `permissionDecisionReason`, `updatedInput`, `additionalContext`. A `deny`
  holds even in bypassPermissions; an `allow` cannot override settings denies.
- PostToolUse: `additionalContext`, `updatedToolOutput`.
- `hookSpecificOutput` requires `hookEventName`. Misplaced fields are
  ignored silently (see `claude --debug`: "unrecognized keys").
- Choose exit-code style OR JSON style per hook. Exit 2 always blocks.

Write `additionalContext` as facts ("INDEX.md files are generated"), not as
imperative system commands: the latter can trip prompt-injection defenses.

## Timeouts, parallelism, limits

- Default timeout 600 s for command/http/mcp_tool (30 s on UserPromptSubmit,
  10 s on MessageDisplay), 30 s prompt, 60 s agent. A timed-out PreToolUse
  command hook does **not** block: never rely on a slow gate.
- All matching hooks run **in parallel**; concurrent `updatedInput` rewrites
  race (last wins). Parallel subagents also run your hooks concurrently, so
  writers in hooks must be atomic.
- Output cap: `additionalContext`, `systemMessage`, plain stdout each max
  10,000 chars; larger output is saved to a file with a 2,000-char preview.
- Stop-hook loop cap: 8 consecutive blocks, then the turn ends anyway
  (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`). Always honor `stop_hook_active`.
- Env for hooks: `CLAUDE_PROJECT_DIR` (stays at session root even in
  worktrees; `cwd` in the payload follows Claude), `CLAUDE_EFFORT`,
  `CLAUDE_ENV_FILE` (SessionStart/CwdChanged/FileChanged), `CLAUDE_CODE_REMOTE`.
  There is no `CLAUDE_MODEL`.

## Windows and shell rules

1. **Shell form** (no `args`) runs via **Git Bash** on Windows, PowerShell only
   if Git Bash is missing; `"shell": "powershell"` forces PowerShell (pwsh 7 if
   present, else 5.1). Git Bash may source your profile: any unconditional
   `echo` there corrupts JSON stdout.
2. **Exec form** (`args` present, even `[]`) spawns without a shell. On
   Windows `command` must be a real `.exe`: `node` works, `npx`/`npm`/`.cmd`
   shims and `.sh` scripts do not. Placeholders like `${CLAUDE_PROJECT_DIR}`
   are substituted into `args` with no quoting issues.
3. **Recommended here**: `"command": "node", "args": ["${CLAUDE_PROJECT_DIR}/tools/harness/hooks/x.ts"]`.
   Node 24 strips TS types natively (erasable syntax only: no `enum`,
   `namespace`, parameter properties; import with `.ts` extensions).
4. PowerShell shell form: use `${CLAUDE_PROJECT_DIR}` or
   `$env:CLAUDE_PROJECT_DIR` in double quotes; bare `$CLAUDE_PROJECT_DIR`
   resolves to `$null`.
5. Normalize `file_path` (`p.replaceAll('\\', '/')`) before string matching;
   a `/docs/` check never matches `C:\...\docs\...`. Prefer `path.relative`.
6. Don't depend on `jq` (absent on stock Windows); parse stdin in Node.
7. Keep stdout clean: only the JSON object. Log diagnostics to stderr.

## Review of this repo's current hooks (2026-10-01)

Point-in-time review; fixes belong to the tooling (`tools/harness/`). Exec-form `node`
hooks are correct for Windows. Issues found:

1. **SubagentStop without matcher** runs the repo-wide lint for every
   subagent, including read-only and internal agents (empty `agent_type`), which
   cannot comply and burn up to 8 forced continuations. Fix:
   set `"matcher": "implementer|doc-gardener"` (writer agent names; a named
   matcher does not match the empty type) or skip in-script by `agent_type`.
2. **Repo-wide lint during parallel work**: one worker's half-written file
   fails another worker's SubagentStop. Scope SubagentStop checks to files the
   agent touched (collect `tool_input.file_path` per `agent_id` in
   PostToolUse into a scratch file) and keep the full lint on main `Stop`.
3. **Concurrent regeneration**: PostToolUse rewrites all INDEX.md/BOARD.md on
   every Markdown edit, also from parallel subagents. Write via temp file +
   rename and only rewrite when content changed, or regenerate only in Stop.
4. `MultiEdit` in the matcher is harmless but undocumented. Bash-written files
   bypass the PostToolUse reindex; the Stop hook regenerates anyway.
5. Add a **PreToolUse guard** that denies `Write|Edit` on generated files
   (`**/INDEX.md`, `forge/BOARD.md`) with a reason naming the generator
   command, so agents fix sources instead of outputs.
6. `stop.ts` catches exceptions and exits 0, so a crashing linter passes the
   gate silently. In gate hooks exit 2 with the error (still honoring
   `stop_hook_active`); keep PostToolUse hooks at exit 0 plus stderr.
