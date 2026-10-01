---
id: T005
epic: E001
title: Playwright smoke test setup
summary: "Set up @playwright/test with Chromium and a smoke test that loads the app and asserts visible text and roles, plus an e2e script."
keywords: ["playwright", "e2e", "smoke", "testing", "chromium"]
type: task
status: done
priority: p1
model: sonnet
size: S
depends_on: [T001]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T005: Playwright smoke test setup

## Goal

Add Playwright with a single smoke test against the Vite app. It asserts text and roles rather than pixels, as the tech stack recommends for AI-written tests.

## Context

- Epic: [E001](EPIC.md)
- Tech stack: [tech-stack.md](../../../../docs/research/game/tech-stack.md) (testing rows)

## Acceptance Criteria

- [x] `npm run e2e` starts the app and passes one smoke test
- [x] The test asserts a heading and a role-based element, not screenshots
- [x] Playwright config uses Chromium only and starts the server via webServer
- [x] e2e artifacts are git-ignored and excluded from unit tests

## Subtasks

- [x] Add @playwright/test and an e2e script
- [x] Write playwright.config.ts with webServer and Chromium project
- [x] Create tests/e2e/smoke.spec.ts
- [x] Make the placeholder App expose the asserted heading
- [x] Keep vitest from picking up tests/e2e and note the browser install step in the test header

## Notes

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: npm run e2e (builds, vite preview webServer, 1 passed)
- 2026-10-01: AC2 verified: smoke.spec.ts asserts h1 heading, Playback group role, result strip text, title, no console errors; no screenshots
- 2026-10-01: AC3 verified: playwright.config.ts has only a chromium project and webServer (build + preview)
- 2026-10-01: AC4 verified: .gitignore has test-results/, playwright-report/, blob-report/; vite.config.ts test.exclude has tests/e2e/**; npm run check green
- 2026-10-01: review requested
- 2026-10-01: done (R033)
