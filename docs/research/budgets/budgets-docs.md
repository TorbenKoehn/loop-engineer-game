---
title: Budgets for docs, context and harness files
summary: Proposed limits for Markdown docs, frontmatter, folder fan-out, CLAUDE.md, skills, agents, ADRs and doc freshness, with sources.
keywords: [budgets, markdown, context, claude-md, skills, fan-out, frontmatter]
type: research
status: active
updated: 2026-10-01
related: [budgets.md, budgets-code.md, budgets-forge.md, budgets-agents.md]
---

# Budgets: docs, context and harness files

## Contents
- Why docs need budgets
- Markdown files
- Frontmatter
- Folder structure and indexes
- Always-loaded context (CLAUDE.md, rules, memory)
- Skills and agent definitions
- ADRs and freshness
- Sources

Conventions (token estimate, `warn_at`, overrides) are defined in [budgets.md](budgets.md).

## Why docs need budgets

Every doc an agent reads costs context, and context gets worse as it fills.
Anthropic calls the context window "a public good" and says LLM performance
degrades as context fills ([Claude Code best practices][cc-bp]). Chroma
tested 18 models and found reliability falls as input grows, even on simple
retrieval tasks ([Context Rot][chroma]). Anthropic's context-engineering
guidance is to find "the smallest possible set of high-signal tokens"
([context engineering][ctx-eng]). Nygard says "Large documents are never kept
up to date. Small, modular documents have at least a chance" ([ADR][nygard]).
So doc budgets protect both context quality and maintainability.

## Markdown files

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `md_lines` | 300 (warn 200) | error | Physical lines incl. frontmatter. Scope `docs/**`, `forge/**`, `.claude/**`. Generated `INDEX.md`/`BOARD.md` exempt | Split by subtopic into `name-*.md` siblings and keep `name.md` as the overview | Claude Code's target for CLAUDE.md is "under 200 lines"; longer files "reduce adherence" ([memory][cc-mem]). We allow 300 for on-demand docs because they are read only when needed. |
| `md_tokens` | 6000 (warn 4500) | error | `ceil(chars / 3)` | Same as above | Stops long-line files from dodging the line limit. 6000 tokens is about 300 lines of 60 chars. |
| `md_toc_over_lines` | 100 | warn | File > 100 lines with no `## Contents` heading | Add a contents list | Anthropic: reference files over 100 lines need a TOC because agents often preview with `head -100` ([skills BP][skill-bp]). |
| `md_heading_depth` | 3 | warn | Deepest `#` level after the H1 | Flatten the structure or split the file | A 4th level means the file holds several topics. This follows the same idea as one-level-deep references ([skills BP][skill-bp]). |
| `md_code_block_lines` | 40 | warn | Lines inside one fenced block (`json` budget block exempt) | Move the code into a real file and link to it | Code in docs goes stale and costs tokens every time the doc is read. Anthropic prefers scripts that are run rather than read ([skills BP][skill-bp]). |
| `broken_links` | 0 | error | Relative links and `related:` paths must resolve | Fix the link or remove it | Agents follow links mechanically, so a dead link costs a wasted tool call. |

## Frontmatter

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `fm_title_chars` | 60 | error | `title` length | Shorten | Must fit in one INDEX table cell. Mirrors the 64-char skill `name` limit ([skills BP][skill-bp]). |
| `fm_summary_chars` | 200 | error | `summary` length | Shorten, and move detail into the body | INDEX rows are summaries. With 15 rows at 200 chars, an index stays around 1k tokens. |
| `fm_keywords_min` | 3 | error | Length of the `keywords` array | Add keywords | With fewer than 3, grep-based retrieval misses the doc. |
| `fm_keywords_max` | 8 | error | Length of the `keywords` array | Prune | More than 8 keywords dilutes them and they stop discriminating between docs. Bounded by Miller's 7±2 ([Cowan][cowan]). |
| `fm_related_max` | 8 | warn | Length of the `related` array | Turn the doc into a hub, or rely on the INDEX | Working memory holds about 4±1 chunks ([Cowan][cowan]). A doc linking more than 8 others is really an index. |

## Folder structure and indexes

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `dir_files` | 15 (warn 10) | error | `*.md` files per directory, excluding `INDEX.md` | Reorganise into topic subfolders, raise a forge task, regenerate the INDEX | Johnny.Decimal caps each level at 10 items ([JD][jd]). Cowan puts working memory at about 4 chunks. An INDEX longer than ~15 rows stops being scannable. |
| `dir_subdirs` | 10 | warn | Subdirectories per directory | Group them under a parent area | Johnny.Decimal allows 10 areas × 10 categories ([JD][jd]). |
| `dir_depth` | 3 | error | Directory levels below a root (`docs/`, `forge/`, `src/`) | Flatten | Johnny.Decimal uses 3 levels. Claude Code `@` imports stop at 4 hops ([memory][cc-mem]). Each extra level costs one more INDEX read. |
| `index_tokens` | 2500 | warn | Size of a generated `INDEX.md` | Breach of `dir_files` or `fm_summary_chars` upstream | An INDEX is read on every navigation hop, so it must stay cheap. |

## Always-loaded context

CLAUDE.md is loaded by the orchestrator **and by every subagent**: the full
CLAUDE.md hierarchy loads unless `omitClaudeMd` is set ([subagents][cc-sub]).
Any byte in CLAUDE.md is paid for N+1 times.

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `claude_md_lines` | 150 (warn 100) | error | Lines per CLAUDE.md | Move procedures into skills and area rules into path-scoped `.claude/rules/` | Anthropic's target is under 200 ([memory][cc-mem]). We are stricter because it is multiplied across subagents. Per line, ask "Would removing this cause Claude to make mistakes?" ([CC BP][cc-bp]). |
| `claude_md_tokens` | 2500 | error | `ceil(chars / 3)` | Same as above | Same rationale as `claude_md_lines`. |
| `always_loaded_tokens` | 6000 | error | Sum of CLAUDE.md, unscoped rules, `@` imports and the auto-memory index | Path-scope rules, move material into skills | Imports "don't reduce its context cost" ([memory][cc-mem]). Claude Code warns when the combined size is too large. |
| `rule_file_lines` | 60 | warn | Lines per `.claude/rules/*.md` file | Split by path scope | A rule file should cover one topic per file ([memory][cc-mem]). |
| `auto_memory_lines` | 150 | warn | Lines in the auto-memory `MEMORY.md` | Merge entries, move detail into topic files | Hard truncation happens at 200 lines or 25 KB ([memory][cc-mem]). |

## Skills and agent definitions

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `skill_md_lines` | 300 (warn 200) | error | Lines in `SKILL.md` | Progressive disclosure: move material into `reference/*.md` | Anthropic says <500 ([skills BP][skill-bp]). We use 300, see `skill_md_tokens`. |
| `skill_md_tokens` | 5000 | error | `ceil(chars / 3)` | Same as above | After compaction only "the first 5,000 tokens" of each invoked skill are re-attached ([CC skills][cc-skills]). Anything past that is lost mid-session. |
| `skill_name_chars` | 64 | error | Length of `name` | Rename | Hard platform limit ([skills BP][skill-bp]). |
| `skill_description_chars` | 1024 (warn 400) | error | Length of `description` | Lead with the trigger and trim | Hard limit is 1024. Claude Code truncates entries at 1536 chars and the whole listing at 1% of the context window ([CC skills][cc-skills]). |
| `skill_count` | 20 | warn | Project skills | Merge overlapping skills or retire unused ones | Every description sits in every session. With overlapping triggers, skill selection gets worse. |
| `skill_ref_depth` | 1 | error | Links from a reference file to another reference file | Link from SKILL.md directly | "Keep references one level deep from SKILL.md" ([skills BP][skill-bp]). |
| `agent_def_count` | 8 | warn | `.claude/agents/*.md` files | Merge roles | Each agent definition adds roster tokens and routing ambiguity. |
| `agent_descriptions_tokens` | 3000 | warn | Sum of agent `description` fields | Shorten them | Claude Code warns at 15,000 ([subagents][cc-sub]). We stay far below that. |

## ADRs and freshness

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `adr_lines` | 100 | warn | Lines per ADR | Split the decision | A Nygard ADR is 1–2 pages, one decision per record ([Nygard][nygard], [adr.github.io][adr]). |
| `adr_active` | 15 | warn | ADRs with `status: active` in `docs/adr/` | Write `architecture-overview.md` that consolidates them, move superseded ADRs to `docs/adr/archive/` | Same as the `dir_files` fan-out. An agent should not need to read 20 ADRs to learn the current architecture. |
| `doc_stale_days` | 90 | warn | `today - updated` for `status: active` docs (forge excluded) | Review: bump `updated`, revise, or set `status: archived` | Software Engineering at Google treats docs like code, with owners and freshness checks in CI ([SWE@Google][swe-docs]). |
| `harness_review_days` | 14 | process | Days since the last harness-review task (CLAUDE.md, skills, agents) | Orchestrator schedules a review task | CONCEPT.md requires harness files to be maintained "regelmässig". Anthropic: "review it when things go wrong, prune it regularly" ([CC BP][cc-bp]). |

## Sources

[cc-bp]: https://code.claude.com/docs/en/best-practices
[cc-mem]: https://code.claude.com/docs/en/memory
[cc-skills]: https://code.claude.com/docs/en/skills
[cc-sub]: https://code.claude.com/docs/en/sub-agents
[skill-bp]: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
[ctx-eng]: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
[chroma]: https://www.trychroma.com/research/context-rot
[nygard]: https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions
[adr]: https://adr.github.io/
[jd]: https://johnnydecimal.com/10-19-concepts/13-system-expansion/13.21-expand-an-area/
[cowan]: https://www.cambridge.org/core/services/aop-cambridge-core/content/view/44023F1147D4A1D44BDC0AD226838496/S0140525X01003922a.pdf/the-magical-number-4-in-short-term-memory-a-reconsideration-of-mental-storage-capacity.pdf
[swe-docs]: https://abseil.io/resources/swe-book/html/ch10.html

- Claude Code best practices: https://code.claude.com/docs/en/best-practices
- Claude Code memory / CLAUDE.md: https://code.claude.com/docs/en/memory
- Claude Code skills: https://code.claude.com/docs/en/skills
- Claude Code subagents: https://code.claude.com/docs/en/sub-agents
- Skill authoring best practices: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Effective context engineering: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Chroma, Context Rot: https://www.trychroma.com/research/context-rot
- Nygard, Documenting Architecture Decisions: https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- Johnny.Decimal: https://johnnydecimal.com/
- Cowan, The magical number 4 (BBS 2001): https://philpapers.org/rec/COWTMN
- Software Engineering at Google, ch. 10: https://abseil.io/resources/swe-book/html/ch10.html
