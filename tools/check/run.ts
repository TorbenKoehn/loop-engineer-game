// Unified check gate: tsc -> biome -> vitest -> harness:check, fail fast.
// Run via `npm run check`. Cross-platform (Windows .cmd shims via shell: true).
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

interface Step {
  label: string;
  command: string;
  /** Returns a reason to skip the step, or undefined to run it. */
  skipIf?: () => string | undefined;
}

const steps: Step[] = [
  { label: "typecheck (tsc)", command: "npx tsc --noEmit" },
  {
    label: "lint (biome)",
    command: "npx biome check .",
    skipIf: () =>
      existsSync("node_modules/@biomejs/biome/package.json")
        ? undefined
        : "Biome is not installed (add @biomejs/biome as devDependency)",
  },
  { label: "test (vitest)", command: "npm test" },
  { label: "harness (harness:check)", command: "npm run harness:check" },
];

const total = steps.length;
for (const [i, step] of steps.entries()) {
  const tag = `[check ${i + 1}/${total}] ${step.label}`;
  const skip = step.skipIf?.();
  if (skip) {
    console.log(`${tag}: SKIPPED - ${skip}`);
    continue;
  }
  console.log(`\n${tag}: ${step.command}`);
  const result = spawnSync(step.command, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    console.error(`\n[check] FAILED at step ${i + 1}/${total}: ${step.label} (exit ${result.status ?? "signal"})`);
    process.exit(result.status || 1);
  }
}
console.log("\n[check] all steps passed");
