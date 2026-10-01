---
id: T051
epic: E008
title: Export and import save string codec
summary: "Save string LE1. + base64url(deflate-raw(canonical JSON)) via CompressionStream, with prefix, checksum and schema validation and plain-English errors."
keywords: ["save", "export", "import", "codec", "compression"]
type: task
status: done
priority: p2
model: sonnet
size: S
depends_on: [T050]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T051: Export and import save string codec

## Goal

Players and agents can move a run as one string, which bug reports and the replay CLI depend on.

## Context

- Epic: [E008](EPIC.md)
- [Save system: Export / import string](../../../../docs/architecture/save.md#export--import-string)
- [ADR-005 save as action log](../../../../docs/architecture/adr/adr-005-save-action-log.md)
- Code: `src/save/codec.ts`
- Out of scope: UI buttons for export and import (E011 settings or E009), replay CLI (E010).

## Acceptance Criteria

- [x] decode(encode(save)) deep-equals the save, using the native CompressionStream (test in Node)
- [x] decode rejects a wrong prefix, a bad checksum and a newer schema with the plain-English messages from save.md (tests)
- [x] A ~400-action run save is ≤ 60 kB as canonical JSON (test)

## Subtasks

- [ ] Encode
- [ ] Decode and validation
- [ ] Size test

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC evidence: all 3 AC verified in R056 (codec.test.ts); the implementer's task-file edits were lost in the worktree merge
- 2026-10-01: AC1 verified: R056 AC1: npx vitest run src/save (25 passed, round-trip toEqual through native streams)
- 2026-10-01: AC2 verified: R056 AC2: codec.test.ts asserts the prefix, checksum and newer-schema errors with the save.md messages
- 2026-10-01: AC3 verified: R056 AC3: 400-action synthetic save about 18 kB canonical JSON, under 60 kB
- 2026-10-01: done (R056)
