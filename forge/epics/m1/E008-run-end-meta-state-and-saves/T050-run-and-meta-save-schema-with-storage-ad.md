---
id: T050
epic: E008
title: Run and meta save schema with storage adapter
summary: "RunSaveV1 and MetaSaveV1 with canonical JSON and SHA-256 checksum, a storage adapter over localStorage with memory fallback, key rotation to backups and run-end ordering."
keywords: ["save", "schema", "storage", "checksum", "localstorage"]
type: task
status: done
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
- [Save system: Formats, Storage](../../../../docs/architecture/save.md#formats)
- [ADR-005 save as action log](../../../../docs/architecture/adr/adr-005-save-action-log.md)
- Code: `src/save/schema.ts`, `src/save/storage.ts`, `src/save/checksum.ts`
- Out of scope: Export string (next task), migrations, autosave timing and UI (later tasks).

## Acceptance Criteria

- [x] Saves serialise to canonical JSON (sorted keys, no whitespace) with a SHA-256 checksum; loading rejects a tampered checksum (test)
- [x] The storage adapter falls back to memory when localStorage throws and reports memoryOnly (test with a throwing fake)
- [x] Keys le:run:current, le:run:backup, le:meta and le:meta:backup are used; saving rotates current to backup
- [x] At run end meta is written first, then the run save is removed (test with fake storage)

## Subtasks

- [x] Schema types
- [x] Canonical JSON and checksum
- [x] Adapter and keys
- [x] Run-end ordering

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: SHA-256 is a synchronous pure-TS implementation (src/save/checksum.ts), not crypto.subtle, so the pagehide autosave (T053) can complete; verified against FIPS vectors and node:crypto. save.md: setup is SetupSnapshot, adapter named SaveStorage (avoids the DOM Storage name), run end also removes le:run:backup.
- 2026-10-01: AC1 verified: npx vitest run src/save (19 passed); schema.test.ts "serialises to canonical JSON with a SHA-256 checksum" and "rejects a tampered checksum or tampered data"
- 2026-10-01: AC2 verified: storage.test.ts "falls back to memory and reports memoryOnly when localStorage throws" (throwing open() and throwing FakeWeb) and "switches to memory when a later write throws"
- 2026-10-01: AC3 verified: storage.test.ts "uses the documented keys" and "rotates the current run and meta save to the backup key on save"
- 2026-10-01: AC4 verified: storage.test.ts "writes meta first, then removes the run saves" (recorded call order on fake storage) and "keeps the run save when the meta write crashes"
- 2026-10-01: npm run check exit 0 (595 tests); src/save coverage 99% lines, 97% branches; production diff 300 lines (checksum 72, schema 88, storage 140)
- 2026-10-01: review requested
- 2026-10-01: done (R055)
