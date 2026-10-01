---
title: Claude Code memory, rules and commands reference
summary: Verified loading rules for CLAUDE.md, .claude/rules, @imports, AGENTS.md and auto memory, plus how slash commands merged into skills.
keywords: [claude-code, claude-md, rules, imports, memory, reference]
type: research
status: active
updated: 2026-10-01
related: [claude-code-formats.md, claude-code-formats-hooks.md]
---

# Claude Code memory, rules and commands reference

Part of [claude-code-formats.md](claude-code-formats.md).

## CLAUDE.md, rules, imports

**Load order** (all concatenated, nothing overrides): managed
(`C:\Program Files\ClaudeCode\CLAUDE.md` on Windows), `~/.claude/CLAUDE.md`,
then from filesystem root down to cwd: `CLAUDE.md` or `.claude/CLAUDE.md`, then
`CLAUDE.local.md` per directory. Subdirectory CLAUDE.md files load **on demand**
when Claude reads a file in that subdirectory. Content arrives as a user
message after the system prompt, i.e. advisory, not enforced.

**Size**: target **under 200 lines per file**; a warning appears for long files
and for a combined total. Files over 4 MiB are skipped. Imports do not reduce
cost (they load at launch). `/doctor` proposes trims; `/doctor prompt-audit`
(v2.1.283+) finds stale or contradictory instructions.

**Imports**: `@path/to/file` anywhere outside code spans/fences; relative to
the importing file; max depth **4 hops**; escape spaces with `\ `. External
paths trigger a one-time approval dialog.

**HTML comments**: block-level `<!-- ... -->` in CLAUDE.md are stripped before
injection: zero-token maintainer notes.

**Compaction**: the project-root CLAUDE.md is re-read from disk after
`/compact`; nested CLAUDE.md and path rules reload only when matching files
are read again.

**`.claude/rules/*.md`** (recursive): without frontmatter they load at launch
like `.claude/CLAUDE.md`; with `paths:` (YAML list or comma string of globs,
brace expansion allowed) they load when Claude reads a matching file.
`paths` is the only field read; other fields are ignored and the frontmatter is
stripped before injection.

**AGENTS.md** (v2.1.277+): read only when no CLAUDE.md/CLAUDE.local.md exists
on the path, unless "Project instructions" is set to `claude-md-and-agents-md`.
For cross-tool sharing use `@AGENTS.md` inside CLAUDE.md (no symlinks on
Windows: they check out as one-line text files).

**Auto memory**: `~/.claude/projects/<project>/memory/MEMORY.md`, first 200
lines or 25KB loaded each session; machine-local, not in git. Disable per
project with `"autoMemoryEnabled": false` if repo docs must stay the only
system of record.

## Slash commands vs skills

"Custom commands have been merged into skills." `.claude/commands/x.md` and
`.claude/skills/x/SKILL.md` both create `/x`; commands keep working and accept
the same frontmatter except `name` and `paths`. Prefer skills: supporting
files, invocation control, auto-loading. Maintenance built-ins: `/context`,
`/memory`, `/doctor`, `/skills`, `/skill-doctor`, `/agents`, `/hooks`,
`/compact`, `/clear`, `/init`.
