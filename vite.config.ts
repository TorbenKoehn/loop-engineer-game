import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import { coverageThresholds } from './tools/check/coverage-thresholds.ts';

const t = coverageThresholds();

export default defineConfig({
  plugins: [preact()],
  test: {
    exclude: [...configDefaults.exclude, '.claude/worktrees/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx'],
      reporter: ['text-summary', 'json-summary'],
      thresholds: {
        'src/sim/**': { lines: t.simLines, branches: t.simBranches },
      },
    },
  },
});
