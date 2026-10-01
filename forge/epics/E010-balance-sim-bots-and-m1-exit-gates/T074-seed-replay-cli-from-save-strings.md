---
id: T074
epic: E010
title: Seed replay CLI from save strings
summary: "tools/balance/replay.ts that decodes a save string, prints the run summary, dumps any fight as canonical JSONL and refuses mismatched content versions."
keywords: ["replay", "cli", "bug-reports", "save-string", "debugging"]
type: task
status: backlog
priority: p2
model: sonnet
size: S
depends_on: [T051, T042]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T074: Seed replay CLI from save strings

## Goal

Agents reproduce player bug reports from one pasted string.

## Context

- Epic: [E010](EPIC.md)
- [Save system: Export / import string (bug reports)](../../../docs/architecture/save.md#export--import-string)
- [Testing: replay command](../../../docs/architecture/testing.md#balance-sim-toolsbalance)
- Code: `tools/balance/replay.ts`
- Out of scope: Browser-side replay UI (E017).

## Acceptance Criteria

- [ ] `node tools/balance/replay.ts <save-string>` prints the run summary
- [ ] `--fight p1-r3-c2 --log` prints that fight's canonical JSONL
- [ ] A save from another contentVersion prints "content changed since save" and exits non-zero

## Subtasks

- [ ] Decode and replay
- [ ] Fight dump
- [ ] Version guard

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
