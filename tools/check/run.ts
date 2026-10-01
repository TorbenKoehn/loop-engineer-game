// Unified check gate: tsc -> biome -> vitest -> build -> e2e -> harness:check, fail fast.
// Run via `npm run check`. Cross-platform (Windows .cmd shims via shell: true).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { totalLinesWarning } from './coverage-thresholds.ts';
import { changedPaths, e2eSkipReason } from './skip.ts';

interface Step {
  label: string;
  command: string;
  /** Returns a reason to skip the step, or undefined to run it. Throws a message to fail. */
  skipIf?: () => string | undefined;
}

const BIOME_PKG = '@biomejs/biome';

/** Skip Biome only when it is not declared; declared but not installed is a hard failure. */
function biomeSkip(): string | undefined {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
    devDependencies?: Record<string, string>;
    dependencies?: Record<string, string>;
  };
  const declared = BIOME_PKG in { ...pkg.dependencies, ...pkg.devDependencies };
  if (!declared) return `${BIOME_PKG} is not declared in package.json`;
  if (!existsSync(`node_modules/${BIOME_PKG}/package.json`))
    throw new Error(`${BIOME_PKG} is declared but not installed: run npm install`);
  return undefined;
}

const e2eSkip = () => e2eSkipReason(changedPaths());

const steps: Step[] = [
  { label: 'typecheck (tsc)', command: 'npm run typecheck' },
  { label: 'lint (biome)', command: 'npm run lint', skipIf: biomeSkip },
  { label: 'test + coverage (vitest)', command: 'npm run test:coverage' },
  { label: 'build (vite)', command: 'npm run build', skipIf: e2eSkip },
  { label: 'e2e (playwright)', command: 'npm run e2e', skipIf: e2eSkip },
  { label: 'harness (harness:check)', command: 'npm run harness:check' },
];

const total = steps.length;
for (const [i, step] of steps.entries()) {
  const tag = `[check ${i + 1}/${total}] ${step.label}`;
  let skip: string | undefined;
  try {
    skip = step.skipIf?.();
  } catch (e) {
    console.error(`\n${tag}: FAILED - ${(e as Error).message}`);
    process.exit(1);
  }
  if (skip) {
    console.log(`${tag}: SKIPPED - ${skip}`);
    continue;
  }
  console.log(`\n${tag}: ${step.command}`);
  const result = spawnSync(step.command, { stdio: 'inherit', shell: true });
  if (result.status === 0 && step.command.includes('test:coverage')) {
    const warning = totalLinesWarning();
    if (warning) console.warn(`${tag}: ${warning}`);
  }
  if (result.status !== 0) {
    console.error(
      `\n[check] FAILED at step ${i + 1}/${total}: ${step.label} (exit ${result.status ?? 'signal'})`,
    );
    process.exit(result.status || 1);
  }
}
console.log('\n[check] all steps passed');
