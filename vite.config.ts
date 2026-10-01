import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [preact()],
  test: {
    exclude: [...configDefaults.exclude, '.claude/worktrees/**'],
  },
});
