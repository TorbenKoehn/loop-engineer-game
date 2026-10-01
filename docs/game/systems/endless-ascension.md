---
title: Endless loop and lint rules
summary: Post-Ship Endless mode (looping phases with rising scale) and the a-la-carte lint-rule ascension system with exact effects, points and caps.
keywords: [endless, ascension, lint-rules, difficulty, scaling, unlocks]
type: gdd
status: active
updated: 2026-10-01
related: [meta-progression.md, combat.md, economy.md, ../milestones.md]
---

# Endless loop and lint rules

Both unlock after the first "Shipped!" and belong to milestone M2.

## Endless loop

After the Deploy boss the player chooses **Ship it** (end the run, normal payout) or
**Keep looping**. Keep looping:

1. Restore 50% of missing Trust. Keep the whole loadout, credits and memories.
2. Increment `loop` (starts at 1 after the first Ship). Start Phase 1 again with a new map
   (`fork(runSeed, 'map/loop' + loop + '/' + phase)`).
3. Enemy scaling adds per loop: Severity `+60` points, damage `+40`, noise `+25` on the
   phase scale (see [combat](combat.md)). Example: Phase 1 in loop 2 uses `SEV_SCALE`
   160.
4. One extra lint rule is force-enabled per loop: random among rules not yet active
   (`fork(runSeed, 'loop/' + loop)`), shown on the loop card.
5. Rewards: +40 TD per completed loop. Score = loops completed, then nodes cleared.

Endless ends only on Trust 0 or "Ship it" at a loop's end. Saves work as normal.

## Lint rules (ascension)

À la carte modifiers chosen on the run setup screen. Each has points; the sum is the
**lint level**. TD multiplier `+10%` per point.

| Rule | Points | Exact effect |
|---|---|---|
| `max-context: 75%` | 2 | Window `× 75 / 100` (floor, min 40) |
| `rate-limit: strict` | 2 | All enemy Throttles last +1000 ms; Rate Limit throttles the 2 fastest tools |
| `no-internet` | 2 | [Web] tools never offered; owned ones are disabled (no effect, no output) |
| `scope-creep: always` | 3 | Every Task adds a Scope Creep at the back |
| `no-undo` | 1 | Idle Cycle heals 15% instead of 30% |
| `strict-deadline` | 2 | All Deadlines −10 000 ms |
| `budget-cuts` | 1 | Shop prices × 125 / 100 (floor) |
| `flaky-elites` | 2 | Critical Bugs +25% Severity |
| `legacy-bosses` | 3 | Bosses +20% Severity and +20% damage |
| `noisy-neighbours` | 1 | All noise × 150 / 100 |
| `no-interest` | 1 | Interest disabled |
| `pager-duty` | 2 | Max Trust −15 at run start |

Maximum total: 23 points.

### Caps and unlock pacing

- Available lint points cap = `4 + 4 × ships` (max 23), where `ships` counts runs that
  reached "Shipped!" at the highest lint level unlocked so far. This keeps the ladder
  StS-like: beat your level to unlock more.
- Lint rules stack with Endless forced rules; a forced rule already active gives nothing
  extra (the loop then picks another).
- Achievements exist for lint levels 5, 10, 15 and 23 ([achievements](../ux/achievements-stats.md)).

### Design intent per rule

Each rule attacks one pillar-relevant skill: `max-context` and `noisy-neighbours` test
context management; `rate-limit` and `strict-deadline` test tempo; `budget-cuts` and
`no-interest` test economy; `scope-creep`, `flaky-elites`, `legacy-bosses` and
`pager-duty` test raw build strength; `no-internet` and `no-undo` remove crutches.
