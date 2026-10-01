---
id: T052
epic: E008
title: Save migration framework and frozen fixtures
summary: "migrate() applying n to n+1 steps with validation, separate run and meta tables, frozen v1 fixture saves, and the replayable:false fallback for unmigratable actions."
keywords: ["save", "migrations", "fixtures", "versioning", "schema"]
type: task
status: in-progress
priority: p2
model: sonnet
size: S
depends_on: [T051]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T052: Save migration framework and frozen fixtures

## Goal

Prepare M2: saves from this build must load later, so the migration path and frozen fixtures exist before schema 2.

## Context

- Epic: [E008](EPIC.md)
- [Save system: Migrations, Content changes and replays](../../../../docs/architecture/save.md#migrations)
- [Milestones: M2 exit criterion 7 (M1 saves load via migration)](../../../../docs/game/milestones.md#m2-full-content)
- Code: `src/save/migrations/`, `tests/fixtures/saves/`
- Out of scope: Any real schema 2 migration (E015).

## Acceptance Criteria

- [ ] migrate(raw) applies steps in order and validates; a schema-1 save passes through unchanged (test)
- [ ] Frozen fixtures tests/fixtures/saves/run-v1-*.txt and meta-v1-*.txt load via migrate (test)
- [ ] An unmigratable action log yields replayable:false while the snapshot still loads (test with a synthetic step)

## Subtasks

- [ ] Migration tables
- [ ] Fixtures
- [ ] Fallback

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
