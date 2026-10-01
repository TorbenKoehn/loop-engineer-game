---
title: Budget policy
summary: Every limit lives in harness.config.json (values in budgets-table.md). Severities, the breach ladder (always a structural fix), override rules and how to change a budget.
keywords: [budgets, limits, overrides, breach, lint, policy]
type: guide
status: active
updated: 2026-10-01
related: [frontmatter.md, workflow.md, orchestrator.md, ../research/budgets/budgets.md]
related_code: [harness.config.json]
---

# Budget policy

Size is a proxy for context cost, and context is the scarce resource. Every limit lives
once, in `budgets` in `harness.config.json`. The generated
[budgets-table.md](budgets-table.md) lists them (`npm run harness:budgets`); this page
never repeats values. Rationale and sources: [research](../research/budgets/budgets.md).

## Severities

| Severity | Checked by | Effect |
|---|---|---|
| `error` | `npm run harness:lint` (Stop/SubagentStop hooks, before every commit) | Blocks handback and commit |
| `warn` | Same | Reported; the total is itself budgeted (`budget_warnings_total`) and cleared by gardening |
| `process` | Orchestrator at delegation, reviewer at review, retro | Triggers the breach ladder by hand |

## Breach ladder

A breach is a design signal. The fix is structural, never "try harder" and never a
silent override.

| Breached | Fix |
|---|---|
| Doc too long | Split by heading into `topic-*.md` siblings; keep `topic.md` as the overview |
| Folder too full | Regroup into topic subfolders, fix links, regenerate indexes |
| Folder too deep | Flatten: merge sparse levels |
| Code file, function or params too big | Extract a module or function; use an options object |
| Comment too long | Move the explanation into a doc and link it, or rename until it is obvious |
| Task too big (subtasks, AC, diff, files) | Planner splits it into sibling tasks; land the first slice |
| Epic too big | Split into a follow-up epic; retro if it keeps happening |
| WIP limit hit | Stop starting, start finishing: reviews first, then blocked items |
| Review rounds or attempts hit | Escalation ladder in [workflow.md](workflow.md) |
| Orchestrator context threshold | HANDOFF.md, then compaction or a fresh session ([orchestrator.md](orchestrator.md)) |
| Warning total exceeded | Doc-gardener run before new feature tasks |
| CLAUDE.md or skill too long | Move procedures into skills, area rules into `.claude/rules/`, detail into linked files |

## Overrides

An override raises one per-file limit for one file, with a reason the next reader can
check. Markdown uses frontmatter; TypeScript uses a header comment.

```yaml
budget_override:
  md_lines: { value: 400, reason: "T031: generated reference table, split planned" }
```

```ts
// budget-override: fn_lines=80 -- T044: state-machine table, see ADR-004
```

Rules:
- The reason cites a task or ADR and says why splitting is worse than the breach.
- At most 2× the default. Beyond that, change the default (below) or redesign.
- Overrides are debt: the linter reports each as `info`, every retro lists them and
  removes those whose reason expired.
- An implementer may add an override only when its task says so or the reviewer will
  see the reason in the diff; reviewers treat an unjustified override as `major`.
- Platform limits (skill name length, description hard cap) cannot be overridden.

## Changing a budget

Budgets change through a harness task or a retro action, never inside feature work:
1. Edit the value in `harness.config.json` with the evidence (retro id, task id) in the
   commit body.
2. `npm run harness:budgets` regenerates the table; `npm run harness:check` must pass.
3. A new budget also needs a check in `tools/harness/budgets/` and a test
   (`tools/harness/README.md`). A `process` budget needs a line in the doc that applies
   it (orchestrator, workflow, a skill).
