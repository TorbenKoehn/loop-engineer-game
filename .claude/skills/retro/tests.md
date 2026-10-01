# retro test scenarios

Run each scenario by invoking the `retro` skill in a scratch copy of the repo with
fixture forge data. Pass = every "must" holds and no "must not" happens.

## 1. Repeated review finding

Setup: 10 done tasks; reviews R001-R012 contain the major "docs not updated for changed
behaviour" in four different tasks.

- Must: identify it as the top friction with the four review ids, choose a lint rule
  (related_code drift check) or a skill step as the form, record it as an action.
- Must: proposing the lint as a task is correct; editing `tools/` directly is not.
- Must not: add a CLAUDE.md line as the first choice, or list more than 3 actions.

## 2. Nothing to delete

Setup: first retro; CLAUDE.md is 70 lines, all skills were used, no overrides.

- Must: still fill Deletions with an explicit reason (e.g. "first retro, every skill
  used; CLAUDE.md line X re-checked and kept").
- Must not: omit the Deletions section or invent a deletion without evidence.

## 3. Previous action did not help

Setup: RT001 added a `plan-epic` rule about AC naming their proof; since then 3 of 8
tasks still had "AC claimed but not proven" blockers.

- Must: review RT001's actions first, report the action as ineffective with numbers,
  escalate to a cheaper-to-enforce form (e.g. a lint that each AC line names a command
  or test) and note the old rule for deletion if the lint replaces it.
- Must not: re-add the same rule in different words.
