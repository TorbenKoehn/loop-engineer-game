---
name: forge-review
description: Reviews one forge task's staged diff against its acceptance criteria, rates findings blocker/major/minor/nit, and writes the review file with a verdict. Use when a task T### is in status review and needs an independent verdict.
metadata:
  keywords: [review, code-review, verdict, severity, acceptance-criteria]
  updated: 2026-10-01
---

# Reviewing a forge task

Critical rules:
- You judge; you never fix. The only file you write is your review file.
- Judge against: the task's Acceptance Criteria and Out of scope, the hard rules in
  `CLAUDE.md`, budgets, and `docs/architecture/` conventions. Nothing else.
- Any blocker or major → `changes-requested`. Otherwise → `approved`.
- Minor and nit never block. A reviewer asked for gaps always finds some; that is not a
  reason to request changes.

## Steps

1. **Read the task file**: Goal, Acceptance Criteria, Context (incl. Out of scope), Log.
2. **Read prior reviews** of this task (###`). From round 2 on,
   check every prior blocker and major first.
3. **Read the diff**: `git diff --cached --stat`, then `git diff --cached`. Also
   `git status --short`: unstaged or untracked files are a finding (major) because they
   would miss the commit.
4. **Verify each AC.** Re-run the command or test that proves it (targeted, e.g.
   `npx vitest run <name>`); read the code path it exercises. Record per AC: verified,
   with the command and result, or not verified, with the reason.
5. **Scan for problems** in this order: correctness and edge cases; determinism and
   state (sim code must stay seeded and render-free); tests actually asserting the AC;
   scope creep beyond Out of scope; weakened tests, AC or lint; generated files edited;
   budget breaches and unjustified overrides; docs not updated for changed behaviour;
   untracked TODOs. Diff size is production lines, not the raw total
   (`docs/harness/budgets.md#measuring-task-diffs`); state both in the Summary.
6. **Rate each finding** (table below). When unsure between two levels, pick the lower.
7. **Write the review file**:
   `npm run harness:new -- review --task T### --verdict <approved|changes-requested>`,
   then fill its sections (format below). Do not touch any other file.
8. **Report**: review path, verdict, counts by severity. Max 15 lines.

## Severity

| Level | Means | Examples | Blocks |
|---|---|---|---|
| blocker | Wrong behaviour or a broken guarantee | AC unmet or unproven; failing or skipped check; crash or data loss; non-determinism in sim; AC/tests/lint weakened; generated file hand-edited | yes |
| major | Correct today, but violates a rule or will cost soon | AC without a test; budget breach or unjustified override; scope creep; changed behaviour with stale docs; untracked TODO; files left unstaged | yes |
| minor | Quality issue with a clear better option | unclear naming, duplicated logic, missing edge-case test beyond the AC | no |
| nit | Taste | formatting the linter allows, wording | no |

Round 2 and later: new findings only on lines changed since the last review or for AC
still unmet. Do not raise issues that existed unchanged in the previous round.

## Review file format

```markdown
## Summary
Round N. One or two sentences on what changed and the overall state.
- [x] AC1 verified: npx vitest run context-meter (14 passed)
- [ ] AC2 not verified: no test covers run end at 0 context

## Findings
| # | Sev | Where | Finding | Required fix |
|---|---|---|---|---|
| F1 | blocker | src/sim/turn.ts:41 | drain applied twice on combo actions | apply once in resolveAction |
| F2 | nit | src/sim/turn.ts:12 | `tmp` name | `pendingDrain` |

## Verdict
changes-requested: F1 (blocker).
```

"Required fix" states the outcome, not a rewrite. Leave Findings with "None." when clean.
