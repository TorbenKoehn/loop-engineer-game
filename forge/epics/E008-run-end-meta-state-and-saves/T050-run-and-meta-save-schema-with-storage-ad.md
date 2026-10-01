---
id: T050
epic: E008
title: Run and meta save schema with storage adapter
summary: "RunSaveV1 and MetaSaveV1 with canonical JSON and SHA-256 checksum, a storage adapter over localStorage with memory fallback, key rotation to backups and run-end ordering."
keywords: ["save", "schema", "storage", "checksum", "localstorage"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T040, T049]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T050: Run and meta save schema with storage adapter

## Goal

Persist runs and meta progress safely: tampered or broken data is detected, and private-mode browsers still play.

## Context

- Epic: [E008](EPIC.md)
- [Save system: Formats, Storage](../../../docs/architecture/save.md#formats)
- [ADR-005 save as action log](../../../docs/architecture/adr/adr-005-save-action-log.md)
- Code: `src/save/schema.ts`, `src/save/storage.ts`, `src/save/checksum.ts`
- Out of scope: Export string (next task), migrations, autosave timing and UI (later tasks).

## Acceptance Criteria

- [ ] Saves serialise to canonical JSON (sorted keys, no whitespace) with a SHA-256 checksum; loading rejects a tampered checksum (test)
- [ ] The storage adapter falls back to memory when localStorage throws and reports memoryOnly (test with a throwing fake)
- [ ] Keys le:run:current, le:run:backup, le:meta and le:meta:backup are used; saving rotates current to backup
- [ ] At run end meta is written first, then the run save is removed (test with fake storage)

## Subtasks

- [ ] Schema types
- [ ] Canonical JSON and checksum
- [ ] Adapter and keys
- [ ] Run-end ordering

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
