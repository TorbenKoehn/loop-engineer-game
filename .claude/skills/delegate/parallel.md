# Parallel writers with worktrees

Use only when two or three `ready` tasks are independent. Otherwise run them one after
another. Independent means all of:
- disjoint Context paths and no `depends_on` between them;
- at most one touches shared root config (`package.json` and lockfile, `biome.jsonc`,
  `vite.config.ts`, `tsconfig.json`, `harness.config.json`) (RT001); a task that adds a
  dependency runs alone;
- at most one edits a hub file that gains a line per area or variant
  (`src/content/index.ts`, `src/ui/screens/placeholder.tsx` per `Action` variant: T042
  broke T055, RT003); a companion doc both would edit (SKILL.md step 3) goes to one of
  them only, the other logs it as a doc follow-up (RT002, RT003);
- neither changes an exported type or signature that the other's Context imports
  (T021 `spawnDefs` broke the parallel T098 adapter, RT002).

## Start

1. The main tree must be clean (`git status --short` empty): worktrees branch from
   `HEAD`, so uncommitted work would be missing in them and conflict later.
2. Set every task `in-progress` with its `started attempt` Log line, run
   `npm run harness:check` (it errors above `wip_in_progress`, counting main-tree work
   too), and commit `forge: start T###, T###`. Add each to HANDOFF.md In flight.
3. Spawn all implementers in one message, each with `isolation: worktree` and the
   worktree note in its prompt (SKILL.md step 3).

## Bring results back, one task at a time

For each returned agent, in the order they finish (the Agent result names the
worktree path):

```
git -C <wt> add -A
git -C <wt> diff --cached --binary -- . \
  ":(exclude,glob)**/INDEX.md" ":(exclude)forge/BOARD.md" \
  ":(exclude)docs/harness/budgets-table.md" > <scratchpad>/T###.patch
git apply --index <scratchpad>/T###.patch      # in the main tree, which must be clean
```

Generated files are excluded because every worktree regenerates them; `harness:check` in
the main tree rebuilds them.

- `git apply` fails (conflict with a task committed meanwhile): discard the patch and
  re-delegate the task sequentially on the new `HEAD`. Log
  `- <date>: re-run after merge conflict`; this does not count as a failed attempt.
- Applied: continue with SKILL.md step 5 (verify) and step 6 (review, commit) exactly as
  for a sequential task. Only then bring back the next worktree.
- Rework (verify failure or changes-requested): never send the agent into the main tree;
  the permission classifier blocks it (RT002). Undo the patch in the main tree
  (`git apply -R --index <patch>`), copy the review file into the worktree, let the
  agent rework there, then export and apply the patch again.

## Clean up

After the task's commit: `git worktree remove <wt>` and `git branch -D <branch>`. These
are your own temporary worktrees, not user data. Remove the task from In flight in
HANDOFF.md.
