---
title: Frontmatter reference
summary: Fields every Markdown file needs, per-type fields and statuses, native formats for skills, agents, CLAUDE.md and INDEX.md, and how to write summaries and keywords that navigate.
keywords: [frontmatter, schema, metadata, summary, keywords, related, types]
type: guide
status: active
updated: 2026-10-01
related: [overview.md, budgets.md, ../../tools/harness/README.md]
related_code: [harness.config.json]
---

# Frontmatter reference

The source of truth is `frontmatter` in `harness.config.json`; `npm run harness:lint`
validates against it. If this page and the config disagree, the config wins and this
page is drift: fix it.

## Base fields (all typed docs)

```yaml
---
title: Context meter                    # short noun phrase, fits an INDEX cell
summary: Context drains per action...   # the answer, not an announcement; <= fm_summary_chars
keywords: [context, meter, mana]        # fm_keywords_min..fm_keywords_max, lowercase, grep words
type: gdd                               # see types below
status: active                          # from the type's status set
updated: 2026-10-01                     # last content change (not reformatting)
related: [combat.md, ../architecture/sim.md]   # optional, <= fm_related_max
related_code: [src/sim/context.ts]      # optional, code this doc describes (drift check)
budget_override:                        # optional, see budgets.md
  md_lines: { value: 400, reason: "T031: reference table, split planned" }
---
```

`generated: true` marks generator output; never set it by hand.
Paths in `related` and `related_code` resolve relative to the file, falling back to the
repo root. The linter reports unresolved paths, and warns when `related_code` changed in
git after the doc's `updated` date.

## Types and statuses

| Type | Statuses | Extra fields | Use |
|---|---|---|---|
| `doc`, `guide` | draft, active, deprecated | | Guides, conventions, HANDOFF |
| `research` | same | | `docs/research/` |
| `adr` | same | | Decisions in `docs/architecture/` |
| `gdd` | same | | Game design in `docs/game/` |
| `index` | same | | Generated `INDEX.md` and `BOARD.md` only |
| `epic` | backlog, ready, in-progress, review, done, blocked | `id` E###, `priority` | `forge/epics/m*/*/EPIC.md` |
| `task` | same as epic | `id` T###, `epic`, `priority`, `model`, `size`, `depends_on`, `assignee` | Task files |
| `review` | docs set | `id` R###, `task`, `verdict` | `forge/reviews/` |
| `retro` | docs set | `id` RT### | `forge/retros/` |

`priority`: p0 (now) to p3 (someday). `model`: opus or sonnet. `size`: S or M; L does not
exist, split instead. Forge items are created only with `npm run harness:new`, which
fills the fields; replace its placeholder summary with a real one.

## Native formats (not the base schema)

| File | Frontmatter |
|---|---|
| `.claude/skills/*/SKILL.md` | Claude Code fields: `name`, `description` (third person, what + when). Repo metadata goes under `metadata:` (`keywords`, `updated`). Supporting files in the skill folder need none |
| `.claude/agents/*.md` | Claude Code fields: `name`, `description`, `tools`, `model`, `maxTurns`, `skills`, ... |
| `CLAUDE.md` | None. Frontmatter would be injected as text into every agent; use a block HTML comment for maintainer notes |
| `INDEX.md`, `forge/BOARD.md` | Generated; only checked for freshness |
| `.claude/rules/*.md` | Only `paths:` is read by Claude Code; base fields allowed |

## Writing fields that navigate

- **summary**: state the finding or rule. Bad: "This document describes task statuses."
  Good: "Tasks flow backlog → ready → in-progress → review → done; only the
  orchestrator sets done."
- **keywords**: words an agent would grep for, including synonyms the text does not use
  (`kanban` on a board doc). Singular, lowercase, hyphenated compounds.
- **related**: only the files a reader will likely need next. Not a "see also" dump.
- **updated**: bump on content change only. A deprecated doc keeps its date and links its
  replacement in the first body line.
- **status**: never delete a doc that others may link; set `deprecated` and point to the
  replacement. The gardener removes deprecated docs once nothing links them.
