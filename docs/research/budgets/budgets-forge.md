---
title: Budgets for the forge and process
summary: Proposed limits for epics, tasks, subtasks, diff size, WIP per kanban column, review rounds, retries, bugs and item ageing.
keywords: [budgets, forge, kanban, wip, code-review, tasks, process]
type: research
status: active
updated: 2026-10-01
related: [budgets.md, budgets-agents.md, budgets-code.md]
---

# Budgets: forge and process

## Contents
- Work item shape
- Change size
- Flow (WIP and ageing)
- Quality loop (reviews, retries, bugs, retros)
- Making process budgets lintable
- Sources

## Work item shape

A task is the unit of delegation: one subagent, one fresh context, one
reviewable diff. Every limit below follows from that.

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `epics_active` | 2 | error | EPIC.md files with `status: active` | Finish or park an epic first | Little's Law: lead time = WIP ÷ throughput ([Kanban][wip]). With one orchestrator, 2 lets one epic wait on review while the other runs. |
| `tasks_per_epic` | 12 (warn 8) | error | `T*.md` files in the epic folder | Split into a follow-up epic | Keeps the epic folder under `dir_files` (15). An epic you can't hold in your head is a roadmap, not an epic ([Cowan][cowan]). |
| `subtasks_per_task` | 7 (warn 5) | error | `- [ ]` / `- [x]` items in the task body | Promote to two tasks | Miller's 7±2 is the outer bound ([Cowan][cowan]). More checklist items means multiple diffs. |
| `acceptance_criteria_min` | 1 | error | Items under `## Acceptance criteria` | Write one | With nothing verifiable, the agent stops when the work "looks done" ([CC BP][cc-bp]). |
| `acceptance_criteria_max` | 5 | warn | Same | Split the task | 3–5 is the common agile guidance. More than 10 means "an epic in disguise" ([scrum.org][ac]). |

## Change size

Diffs are reviewed by a fresh-context reviewer subagent, and review quality
collapses on large diffs, for agents as for humans.

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `task_diff_lines` | 400 (warn 200) | error | `git diff --numstat base..HEAD`, added + deleted lines, excluding lockfiles, generated INDEX/BOARD and snapshots | Decompose: land the first slice, create follow-up tasks | SmartBear/Cisco (2,500 reviews, 3.2M LOC): review 200–400 LOC at a time, because defect detection drops sharply above 400 ([SmartBear][sb]). Google: about 100 lines is reasonable, 1000 is too large ([Google small CLs][g-cl]). LinearB: idle time doubles from ≤100 to 200 lines ([LinearB][lb]). |
| `task_files_changed` | 15 | warn | Files in the diff | Split by layer | "A 200-line change … spread across 50 files would usually be too large" ([Google][g-cl]). |
| `commit_diff_lines` | 400 | warn | Per commit, same exclusions | Commit in smaller steps | Small commits make rewinds and bisection cheap. |
| `commit_subject_chars` | 72 | error | First line of the commit message (commit-msg hook) | Rephrase | Git convention: 50 ideal, 72 hard limit ([Beams][beams]). |

## Flow (WIP and ageing)

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `wip_in_progress` | 3 | error | Tasks with `status: in-progress` | Don't start new work; finish or unblock | Equals `parallel_writers` (see [agents](budgets-agents.md)). Common heuristic: team size plus one ([Kanban][wip]). |
| `wip_review` | 3 | error | `status: review` | Run reviews before starting tasks | A review queue is the classic hidden bottleneck. |
| `wip_blocked` | 3 | warn | `status: blocked` | Escalate the blockers to the user | Too many blocked items means the plan rests on unanswered questions. |
| `wip_ready` | 8 | warn | `status: ready` | Stop refining, start doing | About 2× in-progress, so the next pull is always ready ([Kanban][wip]) without refining far ahead. |
| `backlog_items` | 40 | warn | `status: backlog` across the forge | Groom: archive or merge | A long backlog is stale context that nobody reads. |
| `board_done_visible` | 20 | warn | Done cards rendered on the generated BOARD.md | Generator archives older items to `forge/archive/` | Keeps BOARD.md cheap to read on every orchestration cycle. |
| `in_progress_age_days` | 2 | warn | `today - started` | Check whether the task is too big, then decompose | A task should fit in one agent session. Trunk-based branches live "a day or two" ([TBD][tbd]). |
| `branch_age_days` | 2 | warn | Age of an unmerged task branch or worktree | Merge or abandon | Same rationale ([TBD][tbd]). |
| `blocked_age_days` | 3 | warn | `today - blocked_since` | Escalate to the user. After 7 days, re-plan around it | Blocked items silently pin WIP slots. |
| `epic_age_days` | 21 | warn | `today - started` for an active epic | Run a retro: re-scope or split | Keeps epics at milestone size. |

## Quality loop

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `review_rounds` | 2 | process | `review_rounds` counter in task frontmatter | Round 3 escalates: Sonnet → Opus re-implementation, then orchestrator re-plans, then user | Anthropic: "After two failed corrections, /clear and write a better initial prompt" ([CC BP][cc-bp]). Accumulated failed attempts pollute context. |
| `task_attempts` | 3 | process | `attempts` counter (1 initial + 2 retries) | Stop. Write a failure note, re-plan or decompose the task, ask the user if it's still unclear | Same rationale. Retrying an unchanged prompt rarely changes the outcome. |
| `open_bugs` | 10 | warn | Bug items not `done` | Stop-the-line: no new feature tasks until ≤ 7 | Caps quality debt. |
| `critical_bugs_open` | 0 | process | Bugs with `severity: critical` | Blocks epic close and release | Same rationale as `open_bugs`. |
| `retro_every_tasks` | 10 | process | Done tasks since the last retro (also at every epic close) | Orchestrator schedules a retro | CONCEPT.md: the harness maintains itself. Retros feed the skill and CLAUDE.md updates. |
| `retro_actions_max` | 3 | process | Action items per retro | Prioritise | Unfinished retro actions are noise. Three keep the loop honest. |

## Making process budgets lintable

`process` budgets become mechanically checkable once the forge records
their counters in frontmatter. Recommended task fields:

```yaml
status: in-progress        # backlog|ready|in-progress|review|blocked|done
started: 2026-10-01
blocked_since: null
attempts: 1
review_rounds: 0
model: sonnet              # current implementer model
cost_usd: 0.0              # filled from session usage
diff_lines: 0              # filled by the review step
```

The linter can then *warn* on `review_rounds > 2` or `attempts > 3`. Escalation
itself stays an orchestrator decision, because a lint error cannot pick the
right remedy.

## Sources

[wip]: https://businessmap.io/kanban-resources/getting-started/what-is-wip
[cowan]: https://philpapers.org/rec/COWTMN
[cc-bp]: https://code.claude.com/docs/en/best-practices
[ac]: https://www.scrum.org/forum/scrum-forum/94804/what-best-practices-writing-user-stories-how-many-acceptance-criteria-should-normally-maximal-user-story-have
[sb]: https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/
[g-cl]: https://github.com/google/eng-practices/blob/master/review/developer/small-cls.md
[lb]: https://linearb.io/blog/reducing-pr-review-time
[beams]: https://cbea.ms/git-commit/
[tbd]: https://trunkbaseddevelopment.com/short-lived-feature-branches/

- Kanban WIP limits / Little's Law: https://businessmap.io/kanban-resources/getting-started/what-is-wip
- SmartBear/Cisco review study: https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/
- Google eng-practices, Small CLs: https://github.com/google/eng-practices/blob/master/review/developer/small-cls.md
- LinearB PR size and review time: https://linearb.io/blog/reducing-pr-review-time
- Chris Beams, How to Write a Git Commit Message: https://cbea.ms/git-commit/
- Trunk-based development, short-lived branches: https://trunkbaseddevelopment.com/short-lived-feature-branches/
- Claude Code best practices: https://code.claude.com/docs/en/best-practices
- Acceptance criteria count discussion: https://www.scrum.org/forum/scrum-forum/94804
