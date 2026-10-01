---
title: Budgets for code, tests and game performance
summary: Proposed limits for TypeScript size and complexity, comments, escapes, dependencies, coverage, test runtime, frame time and assets.
keywords: [budgets, typescript, complexity, testing, coverage, performance, assets]
type: research
status: active
updated: 2026-10-01
related: [budgets.md, budgets-docs.md, budgets-forge.md]
---

# Budgets: code, tests, game performance

## Contents
- Code size and complexity
- Comments and escape hatches
- Dependencies and bundle
- Tests and coverage
- Game runtime and assets
- Sources

Default scope is `src/**/*.ts`. "Sim core" means the deterministic simulation
(`src/sim/**`, or wherever the auto-battle logic ends up), which has no DOM
and no rendering. Most limits map directly onto ESLint rules. The budgets
linter reads them from `budgets.json` so there is a single source of truth.

## Code size and complexity

Agents read whole files. A 1,000-line module burns context and invites
partial reads and conflicting edits from parallel workers.

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `ts_file_lines` | 300 (warn 200) | error | ESLint `max-lines`, skipBlankLines + skipComments | Extract a module along a responsibility seam | ESLint default is 300 ([max-lines][es-ml]). This matches `md_lines`, so one mental budget covers everything an agent reads. |
| `test_file_lines` | 500 | warn | Same, `**/*.test.ts` | Split by behaviour under test | Tests are repetitive by design, so they get more room. |
| `fn_lines` | 50 (warn 30) | error | ESLint `max-lines-per-function`, skip blanks/comments | Extract helpers | ESLint default is 50 ([max-lines-per-function][es-mlf]). |
| `fn_params` | 3 | error | ESLint/typescript-eslint `max-params` | Use an options object | ESLint default is 3 ([max-params][es-mp]). Options objects are self-documenting at call sites. |
| `complexity` | 10 | error | ESLint `complexity` (cyclomatic) | Split the function, use lookup tables for ability/effect dispatch | McCabe and NIST recommend 10, with 15 only "with special justification" ([NIST SP 500-235][nist]). ESLint's default of 20 is too lax for a sim core. |
| `nesting_depth` | 3 | error | ESLint `max-depth` | Early returns, extract functions | ESLint default is 4 ([max-depth][es-md]). We use 3 because deep nesting is where agents misplace edits. |
| `nested_callbacks` | 3 | error | ESLint `max-nested-callbacks` | async/await, named functions | Same reasoning as nesting. |
| `line_chars` | 100 | error | ESLint `max-len` (ignore URLs, strings, template literals). Prettier `printWidth` 80 | Let Prettier wrap | Prettier recommends 80 as a *soft* width. `max-len` is the hard cap ([Prettier][prettier]). |
| `exports_per_module` | 10 | warn | Named exports per file (barrel `index.ts` exempt) | Split the module | A wide public surface is a sign of low cohesion, and fan-out mirrors `dir_files`. |
| `imports_per_module` | 15 | warn | Import declarations per file | Look for a missing abstraction | High fan-in coupling makes a file expensive to understand in isolation. |
| `circular_deps` | 0 | error | `madge --circular` or `dependency-cruiser` | Invert the dependency | Cycles break the "sim core has no render deps" boundary. |
| `duplication_pct` | 3 | warn | `jscpd` duplicated-lines % over `src/` | Extract a shared helper | Matches the Sonar way gate of ≤3% duplication on new code ([Sonar][sonar]). Agents re-implement helpers they never saw. |

## Comments and escape hatches

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `comment_line_chars` | 100 | error | Covered by `max-len` with `ignoreComments: false` | Rewrap | Same rationale as `line_chars`. |
| `comment_block_lines` | 10 (warn 5) | error | Consecutive `//` lines or one `/* */` / JSDoc block | Move the "why" into a doc or ADR and leave a 1-line pointer (`// see docs/adr/ADR-007.md`) | Long comments rot silently and cost tokens on every read. Docs have owners, frontmatter and freshness checks. |
| `comment_ratio` | 0.25 | warn | Comment lines ÷ code lines per file | Delete narrating comments | LLM-written code tends to narrate *what* the code does. Only the *why* is worth keeping. This is a heuristic ceiling, not research-backed. |
| `todo_untracked` | 0 | error | Regex `TODO\|FIXME\|HACK\|XXX` without `(T\d{3})` or `(B\d{3})` | Create a forge task and reference it | Untracked self-admitted debt rarely gets fixed: median removal in non-ML projects took 4.1 years ([SATD study][satd]). |
| `todo_total` | 15 | warn | Count of all tracked TODOs | Schedule a cleanup task | Keeps the debt visible and bounded. |
| `explicit_any` | 0 | error | `@typescript-eslint/no-explicit-any` | Use `unknown` plus narrowing | `any` makes the type checker, the agent's cheapest verifier, go blind. |
| `ts_ignore` | 0 | error | `@ts-ignore` / `@ts-nocheck` (`ban-ts-comment`) | Fix the types, or use `@ts-expect-error` | `@ts-ignore` hides errors permanently, even after they are fixed. |
| `ts_expect_error` | 5 | warn | Count across the repo, description ≥ 10 chars required | Fix the types | `@ts-expect-error` at least fails once the error is gone. |
| `eslint_disable` | 5 | warn | `eslint-disable*` count across the repo, each needs `-- reason` | Fix the code or use a `budget_override` | Inline disables are invisible budget overrides. |

## Dependencies and bundle

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `deps_runtime` | 5 | error | `package.json` `dependencies` count | Write an ADR justifying the dependency, or implement it in-house | Every runtime dependency adds supply-chain risk (Shai-Hulud compromised 500+ npm packages in 09/2025 and 700+ in 11/2025 ([CISA][cisa], [Unit42][u42])), bundle weight, and API surface the agent must know. |
| `deps_dev` | 25 | warn | `devDependencies` count | Prune | The tooling sprawl also runs install scripts. |
| `dep_release_age_days` | 7 | process | No new dependency version younger than 7 days (pnpm `minimumReleaseAge` or manual check) | Wait | Worm releases were typically detected and pulled within days ([Unit42][u42]). |
| `bundle_initial_js_kb` | 200 (warn 150) | error | gzip size of JS needed for the first screen (`size-limit` on the Vite build) | Code-split, drop dependencies | Common web performance budgets cap initial JS around 170–200 KB gzip ([web perf budgets][perf-budget]). |

## Tests and coverage

Agents run checks many times per task. The Bash tool times out by default
after 2 minutes (`BASH_DEFAULT_TIMEOUT_MS`, [settings][cc-settings]), so
anything slower than that is invisible to a normal tool call.

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `unit_test_ms` | 200 | warn | Per-test duration from the Vitest JSON reporter | Shrink fixtures, inject a fake clock | Vitest flags tests as slow at 300 ms by default ([Vitest][vitest]). A pure sim test should be well below that. |
| `unit_suite_s` | 30 | error | Wall time of `npm run test:unit` | Parallelise, move heavy cases to integration | Keeps the inner edit-test loop fast enough to run after every change. |
| `check_all_s` | 120 | error | Wall time of lint + typecheck + unit + build | Profile the slowest step | Must finish inside a single default Bash call (2 min). Fowler's 10-minute commit build is the CI ceiling, not the agent ceiling ([Fowler CI][fowler]). |
| `e2e_suite_s` | 300 | warn | Playwright total | Trim to smoke paths | Google's "medium" test timeout is 300 s ([test sizes][g-sizes]). |
| `flaky_tests` | 0 | process | A test that failed then passed with no code change | Quarantine within the same task and open a bug | Flaky tests poison the agent's only verifier. |
| `coverage_sim_lines` | 90 | error | Vitest v8 line coverage over the sim core | Add tests before merging | Google rates 90% "exemplary" ([Google coverage][g-cov]). A deterministic sim is the cheapest code in the repo to test. |
| `coverage_sim_branches` | 85 | error | Branch coverage over the sim core | Same | Balance bugs hide in untaken branches. |
| `coverage_total_lines` | 70 | warn | Line coverage over the whole repo | Add tests | Between Google's "acceptable" (60%) and "commendable" (75%). The rendering/UI layers are tested more by e2e and screenshots. |

## Game runtime and assets

Measured by a headless perf harness (Playwright + `performance` API) on a
scripted reference battle. This is a quantitative check that runs in CI,
not on every commit. `error` means the perf job fails.

| ID | Value | Sev | Measure | On breach | Rationale |
|---|---|---|---|---|---|
| `frame_ms_p95` | 16.7 | error | p95 frame time over the reference battle (rAF deltas) | Profile, cache, pool objects | 60 fps means 16.7 ms per frame ([RAIL][rail]). |
| `frame_script_ms_p95` | 10 | warn | p95 JS work per frame | Same | RAIL: aim for 10 ms because the browser needs about 6 ms of each frame ([RAIL][rail]). |
| `sim_tick_ms` | 2 | warn | Headless sim tick, late-game state, Node benchmark | Optimise the hot path | Leaves most of the 10 ms for rendering and allows fast-forward (×4) battles. |
| `long_tasks_battle` | 0 | warn | `PerformanceObserver` long tasks (>50 ms) during battle | Chunk the work | Long tasks block input, and the 100 ms response target needs headroom ([RAIL][rail]). |
| `load_interactive_s` | 5 (warn 3) | error | Navigation to interactive title screen, throttled "Fast 4G" | Lazy-load assets | RAIL load target is <5 s. LCP "good" is ≤2.5 s ([RAIL][rail]). |
| `initial_download_kb` | 1500 | error | gzip bytes transferred until the title screen is interactive | Defer music and later-act assets | Keeps the 5 s load target achievable on mobile networks. |
| `asset_file_kb` | 300 | warn | Per image/audio file in `public/` (music via override) | Compress, use an atlas, use Opus/WebP | One oversized file can blow the initial download on its own. |
| `texture_px` | 2048 | error | Max width/height of any texture or atlas | Split the atlas | 4096 is supported on ~99.9% of WebGL devices ([web3dsurvey][w3d]), but 4096² RGBA is 64 MB of VRAM, while 2048² is 16 MB. |
| `total_assets_mb` | 25 | warn | Size of `dist/` | Prune or recompress | A browser rogue-lite should feel instant to replay. |
| `js_heap_mb` | 150 | warn | `performance.memory` after 3 consecutive runs | Hunt leaks in run-reset code | Rogue-lite loops restart often, so leaks accumulate across runs. |

## Sources

[es-ml]: https://eslint.org/docs/latest/rules/max-lines
[es-mlf]: https://eslint.org/docs/latest/rules/max-lines-per-function
[es-mp]: https://eslint.org/docs/latest/rules/max-params
[es-md]: https://eslint.org/docs/latest/rules/max-depth
[nist]: https://www.eng.auburn.edu/~kchang/comp6710/readings/Integration.Testing.McCabe.NIST.pdf
[prettier]: https://prettier.io/docs/options
[sonar]: https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates
[satd]: https://arxiv.org/html/2311.12019v3
[cisa]: https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem
[u42]: https://unit42.paloaltonetworks.com/npm-supply-chain-attack/
[perf-budget]: https://www.debugbear.com/blog/working-with-performance-budgets
[cc-settings]: https://code.claude.com/docs/en/settings
[vitest]: https://vitest.dev/config/slowtestthreshold
[fowler]: https://martinfowler.com/articles/continuousIntegration.html
[g-sizes]: https://testing.googleblog.com/2010/12/test-sizes.html
[g-cov]: https://testing.googleblog.com/2020/08/code-coverage-best-practices.html
[rail]: https://github.com/GoogleChrome/web.dev/blob/main/src/site/content/en/fast/rail/index.md
[w3d]: https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_SIZE

- ESLint rules: https://eslint.org/docs/latest/rules/max-lines , /max-lines-per-function , /max-params , /max-depth , /complexity
- NIST SP 500-235 (McCabe structured testing): https://www.eng.auburn.edu/~kchang/comp6710/readings/Integration.Testing.McCabe.NIST.pdf
- Prettier options: https://prettier.io/docs/options
- Sonar way quality gate: https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates
- SATD survival study: https://arxiv.org/html/2311.12019v3
- CISA npm compromise alert: https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem
- Unit42 Shai-Hulud: https://unit42.paloaltonetworks.com/npm-supply-chain-attack/
- Vitest slowTestThreshold: https://vitest.dev/config/slowtestthreshold
- Fowler, Continuous Integration: https://martinfowler.com/articles/continuousIntegration.html
- Google test sizes: https://testing.googleblog.com/2010/12/test-sizes.html
- Google coverage best practices: https://testing.googleblog.com/2020/08/code-coverage-best-practices.html
- RAIL model: https://github.com/GoogleChrome/web.dev/blob/main/src/site/content/en/fast/rail/index.md
- Web3D Survey MAX_TEXTURE_SIZE: https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_SIZE
