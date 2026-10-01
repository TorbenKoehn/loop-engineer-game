---
id: T005
epic: E001
title: Playwright smoke test setup
summary: "Set up @playwright/test with Chromium and a smoke test that loads the app and asserts visible text and roles, plus an e2e script."
keywords: ["playwright", "e2e", "smoke", "testing", "chromium"]
type: task
status: ready
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

- [ ] `npm run e2e` starts the app and passes one smoke test
- [ ] The test asserts a heading and a role-based element, not screenshots
- [ ] Playwright config uses Chromium only and starts the server via webServer
- [ ] e2e artifacts are git-ignored and excluded from unit tests

## Subtasks

- [ ] Add @playwright/test and an e2e script
- [ ] Write playwright.config.ts with webServer and Chromium project
- [ ] Create tests/e2e/smoke.spec.ts
- [ ] Make the placeholder App expose the asserted heading
- [ ] Keep vitest from picking up tests/e2e and note the browser install step in the test header

## Notes

## Log

- 2026-10-01: created
