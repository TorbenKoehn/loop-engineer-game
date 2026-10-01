---
name: retro
description: Runs a data-driven retrospective over the tasks done since the last retro, writes forge/retros/RT###, and applies at most three harness actions in the cheapest durable form. Use every retro_every_tasks done tasks, at epic close, or after a task hit its attempt cap.
context: fork
agent: general-purpose
model: opus
metadata:
  keywords: [retro, retrospective, self-improvement, harness, lessons]
  updated: 2026-10-01
---

# Running a retro

Critical rules:
- Evidence over memory: every friction point cites task, review or lint data.
- At most `retro_actions_max` actions. Each names its form, ranked cheapest first:
  lint/test/hook > template > path rule > skill > agent prompt > CLAUDE.md.
- Deletions are mandatory: prune something, or state why nothing could go.
- Do not commit. Do not edit feature code. Harness text only, and only for actions.

## 1. Collect data (commands, not recall)

```
ls forge/retros/                                   # last retro id and its Actions
git log --format="%h %s" --grep="^RT[0-9]" -1      # last retro commit = <base>
git log --format="%h %s" <base>..HEAD              # tasks done since (T###: ...)
grep -h "started attempt\|changes-requested\|Superseded\|Blocked by" forge/epics/*/T*.md
grep -h "^| F[0-9]* | \(blocker\|major\)" forge/reviews/*.md   # blocking findings
npm run harness:lint -- --json                     # warning counts by rule
grep -rn "budget_override\|budget-override:" docs forge src tools .claude
```

With no previous retro, use the whole history. Restrict review and Log data to tasks
done since `<base>`.

## 2. Analyse

- **Numbers**: tasks done, first-pass approval rate (approved in round 1), average
  attempts, escalations to Opus, re-plans, blocked count, warning total vs
  `budget_warnings_total`, active overrides.
- **Previous actions**: for each, done or not, and did it help (did the friction recur)?
- **Top 3 frictions**: group blocking findings and failed attempts by cause. Ask why
  until the answer is a harness property (missing check, vague template, unclear skill
  step, wrong routing, oversized task), not "the agent made a mistake".

Signal → likely form:

| Signal | Form |
|---|---|
| Same review finding twice | Lint rule (else skill line for implementer and reviewer) |
| Tasks failing on vague AC | `plan-epic` skill or task template |
| Agent re-asks documented facts | That doc's summary and keywords |
| Same procedure pasted three times | New skill (with `tests.md` first) |
| Stop hook blocks repeatedly on one rule | Earlier check (PostToolUse) or a generator |
| Reports too long or missing evidence | Report format in `docs/harness/delegation.md` |
| Skill never relevant for two retros | Retire it |

## 3. Write the retro

`npm run harness:new -- retro --title "<epic or period>"`, then fill:
- **What Went Well**: the numbers, plus what to keep doing.
- **What Went Wrong**: top 3 frictions, each `evidence → root cause`.
- **Learnings**: what the causes say about the harness.
- **Actions**: `- [ ] <change> | form: <rank> | evidence: T###/R### | applied: yes/task T###`.
- **Deletions** (add this heading): what was pruned, or the reason for none.

Also list active budget overrides and whether each reason still holds.

## 4. Apply actions

- Small edits (about 30 lines or less of harness text, a skill step, a summary fix):
  apply now and mark `applied: yes`. After editing a skill, check its `tests.md`
  scenarios still describe the intended behaviour.
- Lint or hook changes, and anything larger: describe it as a task (title, goal, AC) in
  the report for the orchestrator to scaffold in the harness epic. Do not edit `tools/`.
- Keep `CLAUDE.md` under its target; adding a line there requires deleting one.

## 5. Report

Max 25 lines: retro path, the numbers line, actions (applied / proposed task), deletions,
whether a doc-gardener run is due (warnings over budget or drift warnings present).
