---
name: delegate
description: Orchestrator procedure for handing a forge task to a subagent - pick agent and model, build the prompt from the template, spawn, then verify the result independently before review. Use whenever the main session delegates implementation, review, planning or gardening.
metadata:
  keywords: [delegation, orchestrator, subagent, verification, model-routing]
  updated: 2026-10-01
---

# Delegating and verifying

Critical rules:
- One task per subagent run. Paths, not pasted content. Prompt under
  `subagent_prompt_tokens`.
- A report is a claim. Nothing moves to review or done until you verified it yourself.
- Subagents never commit and never spawn subagents. You commit, after approval.
- Parallel writers only via worktrees and [parallel.md](parallel.md).

## 1. Choose agent and model

Use the roster and routing table in `docs/harness/delegation.md`. Start from the task's
`model` field; apply the escalation ladder in `docs/harness/workflow.md` (e.g. after a
changes-requested on Sonnet, the next run uses `model: opus`). Pass the model as the
Agent tool's `model` parameter only when it differs from the agent's default.

## 2. Pre-flight

- Task meets the Definition of Ready; `depends_on` tasks are `done`.
- WIP below `wip_in_progress` and `wip_review` (see `forge/BOARD.md`).
- `git status --short` shows nothing but your own forge bookkeeping. Unknown changes:
  find their owner (HANDOFF.md) before starting anything.
- Notes added after planning (review follow-ups, wiring notes) are scope. More than two
  such obligations: the planner re-sizes or splits the task first (T059 carried six and
  overran turns and diff, RT003). A follow-up bigger than a Notes line gets its own task.
- A UI task created before RT003 (`git log --diff-filter=A` older than d4a2b36) goes to
  the planner to re-size against plan-epic step 4 first. Such M screens ran 380-645
  production lines against the ~300 aim; T067 and T061 hit maxTurns (RT005).
- Set `status: in-progress`, append `- <date>: started attempt N (<model>)` to the Log.
  Attempt N = previous `started attempt` lines + 1. At the `task_attempts` cap, stop and
  follow the ladder's last step instead.

## 3. Build the prompt

Fill the template in `docs/harness/delegation.md#prompt-template`:
- task path and attempt number; for rework, the latest review file path;
- allowed paths, as globs: the task's Context paths and their tests, plus its companion
  files (RT003), so follow-ups and scope stops do not pile up:
  - docs whose `related_code` names a file in those paths
    (`grep -l "^related_code:.*<dir>" -r docs`) and the doc that describes the behaviour;
  - new UI or content text: its string area `src/content/strings/en-<area>.ts` and
    `areas.gen.ts` (via `npm run content:index`);
  - an AC that names Playwright: `tests/e2e/<name>.spec.ts`;
  - a new `Action` variant: `src/ui/screens/placeholder.tsx`;
  - a file an AC names (T095 blocked on `delegate/SKILL.md`);
  - a change to fight outcomes (`src/sim/**`, content numbers, `src/run/combat.ts`):
    `src/run/combat.test.ts`, `tests/e2e/combat.spec.ts` and `tools/golden/fixtures/**`
    via `npm run golden:update` (T029, T033, T046, T024, RT004);
- for worktrees: "You run in a git worktree: run `npm ci` if node_modules is missing.
  Edit files only inside this worktree."

Reviewer and planner prompts use the short forms in the same file.

## 4. Spawn

Agent tool: `subagent_type` = agent name, `description` = `T###: <title>`, the prompt,
optional `model`. Sequential work runs in the foreground; parallel writers are spawned
together in one message with `isolation: worktree`. Agents load at session start: one
added or changed in this session is not spawnable by name until a restart, so use
`general-purpose` told to read and follow `.claude/agents/<name>.md` first.

## 5. Verify the result

Check, in order, and stop at the first failure:
1. The report ends with the report block; `STATUS` matches the task file's status.
2. `git status --short`: changed files lie inside the allowed paths; no generated file
   was hand-edited (regeneration by `harness:check` is fine).
3. `git diff -U0 -- <task file>`: under Acceptance Criteria only `[ ]` → `[x]` changes.
4. Every checked AC has an evidence line in the Log.
5. The check sequence from `CLAUDE.md`, each command piped through `tail -n 15`; all exit 0.
   `check` runs build and e2e on a clean tree or when `src/` or `tests/e2e/` changed. Again on main after a
   worktree merge.
6. `git add -A -- <allowed paths>`, then `npm run harness:diff`: exit 0, or the breach is
   flagged in the task's Notes (budgets.md#measuring-task-diffs).

On failure: resume the same agent once via SendMessage with the exact failure output
(no new attempt). If the resumed run fails again, start the next attempt per the ladder.
On `STATUS: blocked`: answer the questions in the task's Notes if the docs answer them,
then delegate a fresh attempt; otherwise re-plan with the planner.

## 6. Review and record

1. `npm run harness:check`, then `git add -A` (regenerated files staged too; the staged
   diff is what the reviewer sees and what gets committed).
2. Spawn `reviewer` with the reviewer prompt (task path, round N, prior reviews).
3. Read the verdict from the review file's frontmatter, not from the report.
   - approved: set `status: done`, Log `- <date>: done (R###)`, `npm run harness:check`,
     `git add -A`, `git commit -m "T###: <title>"`.
   - changes-requested: set `status: in-progress`, Log
     `- <date>: R### changes-requested (<n> blocker, <n> major)`, go to step 1.

## Other agents

- **planner**: verify every new task with `npm run harness:check`; spot-check one task
  for observable AC and Context paths; commit `E###: plan <epic title>`.
- **doc-gardener**: verify `harness:check` is clean and `git diff --stat` touches only
  docs; commit `docs: garden <scope>`; scaffold proposed tasks you agree with.
- **retro** (skill, forked): read the retro file, spot-check the applied edits, scaffold
  proposed tasks into the harness epic, commit `RT###: <title>`.
