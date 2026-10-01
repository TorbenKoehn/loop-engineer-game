import fs from 'node:fs';
import path from 'node:path';
import type { BudgetDef, Config } from './types.ts';

export const CONFIG_NAME = 'harness.config.json';

/** Walk up from a directory to the nearest harness.config.json, or null. */
export function walkUp(start: string): string | null {
  let dir = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(dir, CONFIG_NAME))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Hook root: the payload cwd (worktree-aware) first, then env and process cwd. */
export function hookRoot(payloadCwd?: string): string {
  return (payloadCwd ? walkUp(payloadCwd) : null) ?? findRoot();
}

export function findRoot(start: string = process.cwd()): string {
  const env = process.env.HARNESS_ROOT ?? process.env.CLAUDE_PROJECT_DIR;
  if (env && fs.existsSync(path.join(env, CONFIG_NAME))) return path.resolve(env);
  let dir = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(dir, CONFIG_NAME))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`${CONFIG_NAME} not found from ${start}`);
    dir = parent;
  }
}

export function loadConfig(root: string): Config {
  const text = fs.readFileSync(path.join(root, CONFIG_NAME), 'utf8');
  return JSON.parse(text) as Config;
}

/** Budget definition by id; throws on unknown ids so renamed budgets fail loudly. */
export function budget(config: Config, id: string): BudgetDef {
  const def = config.budgets[id];
  if (!def) throw new Error(`unknown budget "${id}" (harness.config.json)`);
  return def;
}
