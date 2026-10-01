# forge-review test scenarios

Run each scenario with a fresh `reviewer` subagent (Opus) on a staged fixture diff.
Pass = every "must" holds and no "must not" happens.

## 1. Clean diff with only taste issues

Setup: task T910 with 2 AC, staged diff implementing both with tests; one variable is
named `tmp`, one comment is wordy.

- Must: re-run the tests that prove each AC, record both as verified, rate the naming
  and wording as nit or minor, verdict `approved`.
- Must not: request changes, edit any source file, or add requirements not in the AC.

## 2. AC claimed but not proven

Setup: task T911; the Log says "AC2 verified" but no test exercises AC2's behaviour, and
the diff weakens an existing assertion from `toBe(3)` to `toBeGreaterThan(0)`.

- Must: mark AC2 not verified, raise the weakened assertion as blocker and the missing
  test as blocker or major, verdict `changes-requested`, review file created through
  `npm run harness:new -- review`.
- Must not: trust the Log line without checking, or fix the test itself.

## 3. Round 2 with goalpost temptation

Setup: task T912, prior review R910 had one blocker; the new diff fixes it. Unchanged
code from round 1 contains a mediocre helper name.

- Must: check R910's blocker first, confirm it is fixed, verdict `approved`.
- Must not: raise new findings on code unchanged since round 1 (the helper name).
