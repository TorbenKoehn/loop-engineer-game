---
title: Harness engineering - knowledge base and drift control
summary: How to run docs as the system of record - placement, summaries, INDEX navigation, mechanical checks with remediation messages, drift detection and doc gardening.
keywords: [docs, index, frontmatter, drift, garbage-collection, doc-gardening, linter]
type: research
status: active
updated: 2026-10-01
related: [harness-engineering.md, harness-engineering-self-improvement.md, ../budgets/budgets-docs.md, claude-code-formats.md]
---

# Knowledge base: docs as the system of record

Part of [harness-engineering.md](harness-engineering.md). Numeric limits live
in [budgets-docs.md](../budgets/budgets-docs.md) and `harness.config.json`; this file
covers structure and process.

## Contents
- What goes where
- Writing frontmatter that navigates
- INDEX.md and the navigation protocol
- Mechanical checks (and how to word their errors)
- Drift detection
- Doc gardening and garbage collection
- Sources

## What goes where

One owner per fact. If two files state the same rule, one of them will rot.

| Knowledge | Home | Loaded |
|---|---|---|
| Map, commands, hard rules | root `CLAUDE.md` (≤ 100 lines) | every session, every agent |
| Orchestrator protocol | `docs/harness/orchestrator.md` via SessionStart hook | main session only |
| Conventions for one area | `.claude/rules/<area>.md` with `paths:` | when matching files are read |
| Repeatable procedures | `.claude/skills/<name>/SKILL.md` | description always, body on use |
| Role behaviour | `.claude/agents/<role>.md` body | that agent only |
| Why a decision was made | `docs/decisions/ADR-NNN-*.md` (Nygard: context, decision, consequences) | on demand |
| Game design | `docs/design/` (type `gdd`) | on demand |
| Work state | `forge/` | on demand (BOARD.md each cycle) |
| Why this line of code is odd | a short code comment | with the code |

ADRs are immutable once `active`: a changed decision gets a new ADR that
links the old one, and the old one becomes `deprecated`. That keeps history
without editing the past.

## Writing frontmatter that navigates

The summary is what an agent reads instead of the file, so it must carry
the answer, not announce it.

- **summary**: state the finding or rule. Bad: "This document describes task
  statuses." Good: "Tasks flow backlog → ready → in-progress → review → done;
  only the reviewer moves review → done."
- **keywords**: the words an agent would grep for, singular, lowercase,
  including synonyms the text itself does not use (`kanban` on a board doc).
- **related**: only files a reader of this file will likely need next; max 8.
  Not a "see also" dump.
- **Proposed new optional field `related_code`**: repo paths (files or dirs)
  the doc describes, e.g. `[src/sim/combat.ts]`. It powers mechanical drift
  detection (below). Add it to `harness.config.json` base fields.
- `updated` changes only on a content change, never on a reformat. The
  linter cannot tell the difference, so the instruction lives in the
  `writing-docs` skill.

## INDEX.md and the navigation protocol

INDEX.md files are generated (`generated: true`, "do not edit" banner) and
must be byte-stable: sort entries by filename, no timestamps in the body, so
regeneration produces no diff when nothing changed.

Navigation protocol, taught once in CLAUDE.md (3 lines) and in every
delegation prompt that needs research:

1. Open the INDEX.md of the most likely directory. Read summaries only.
2. If unsure where to look: grep frontmatter, e.g.
   `rg -l "^keywords:.*\bstatus\b" docs forge`.
3. Open at most the 3 most relevant files in full.
4. Follow `related` links only when the current file says the answer is there.

Recommended INDEX layout additions:
- List `deprecated` docs in a final "Deprecated" section (the llms.txt
  "Optional" idea): readers under budget pressure skip it.
- Root INDEX.md lists each subdirectory's INDEX.md with that directory's
  one-line purpose, so the root stays tiny as the repo grows.

## Mechanical checks (and how to word their errors)

OpenAI's rule: "A lint failure should not merely say something failed. It
should tell the agent how to fix the issue." Every finding is one line:
`<file>:<line> [rule-id] <what is wrong>. Fix: <exact action or command>.`

```
docs/design/combat.md [md_lines] 341 lines > 300. Fix: split by section into
  combat-*.md files and link them from combat.md; run npm run harness:index.
forge/epics/E001-core/T004-loop.md [ac_missing] no "## Acceptance criteria".
  Fix: add 1-5 "- [ ]" items that a test or command can verify.
docs/INDEX.md [generated_edit] generated file differs from generator output.
  Fix: do not edit INDEX.md; edit the source doc's frontmatter and run
  npm run harness:index.
```

Checks the linter should own (beyond the budgets already configured):

| Rule | Severity | Why |
|---|---|---|
| Frontmatter schema per type (exists) | error | Indexes and board depend on it |
| Relative links and `related` targets resolve | error | Dead links are the cheapest drift signal |
| `related_code` paths exist | error | Doc describes deleted code |
| Generated files equal generator output | error | Stops hand edits of INDEX/BOARD |
| `npm run <x>` mentioned in CLAUDE.md/skills exists in package.json | error | Stale commands are the classic instruction rot |
| Skill/agent `description` present, ≤ 300 chars, third person (no "I"/"you" start) | warn | Discovery quality |
| `related_code` changed in git after the doc's `updated` | warn | Likely drift |
| `updated` older than `stale_doc_days` | warn | Review candidate |
| Duplicate titles across docs | warn | Two owners for one topic |

Run order: PostToolUse lints only the edited file (fast, < 3 s); Stop runs
the full check; a pre-commit hook (`git` hook, not Claude hook) runs the same
full check so human commits obey the same rules.

## Drift detection

Drift = docs say X, repo does Y. Detect the cheap kinds mechanically and
sample the expensive kind with an agent.

| Drift kind | Detection | Cost |
|---|---|---|
| Broken link / missing file | linter | free |
| Command in docs no longer exists | linter (package.json scripts, tool paths) | free |
| Doc older than the code it describes | `git log -1 --format=%cs -- <related_code>` > `updated` | free |
| INDEX out of sync | regenerate + compare | free |
| Contradiction between docs | gardener agent reading docs that share keywords | tokens |
| Doc contradicts behaviour | gardener agent checks claims against code/tests | tokens |
| CLAUDE.md/skills outdated | `/doctor prompt-audit` (v2.1.283+) | tokens |

## Doc gardening and garbage collection

OpenAI runs a recurring doc-gardening agent that "scans for stale
documentation and opens corrective pull requests", plus background tasks
that scan for deviations from "golden principles". Translate that to:

- **Agent**: `doc-gardener` (Sonnet, tools Read/Grep/Glob/Edit/Write/Bash,
  `maxTurns` 30). It fixes mechanical findings directly and files a forge
  task for anything needing judgment.
- **Cadence**: at every retro (every 10 done tasks or epic close, per
  `retro_every_tasks`), and whenever `budget_warnings_total` is exceeded.
- **Input**: the linter's warn list + docs whose `related_code` changed since
  the last gardening run (store that commit sha in `forge/HANDOFF.md`).
- **Rules for the gardener**: never delete; set `status: deprecated` and
  link the replacement. Merge duplicates into the older file. Split files
  over budget along their headings. Commit separately from feature work
  (`docs: garden <scope>`), so reviews stay small.
- **Golden principles file** (`docs/harness/golden-principles.md`, ≤ 30
  lines): the taste rules that are not yet lints. Each retro either turns one
  into a lint or deletes it. The file shrinking over time is the success
  metric.

## Sources
- https://openai.com/index/harness-engineering/ (via
  https://b-lab.team/en/content/64932f27-92ac-4c9c-8bdb-3c24523add07 and
  https://gist.github.com/intellectronica/1a9018ed642096fc81b0eeb1f2c8b63c)
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- https://code.claude.com/docs/en/memory (prompt audit, size guidance)
- https://llmstxt.org/ ("Optional" section convention)
- https://agents.md/ (map-style instruction files, nearest file wins)
- https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions (ADR format)
