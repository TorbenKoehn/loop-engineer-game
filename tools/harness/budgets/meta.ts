import fs from 'node:fs';
import path from 'node:path';
import type { Check, Ctx } from './util.ts';
import { at, check } from './util.ts';

function readJson(ctx: Ctx, rel: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(ctx.scan.root, rel), 'utf8')) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

const count = (v: unknown): number => (v && typeof v === 'object' ? Object.keys(v).length : 0);

const deps: Check = {
  id: 'deps',
  run: (ctx) => {
    const pkg = readJson(ctx, 'package.json');
    if (!pkg) return [];
    return [
      ...check(ctx, 'deps_runtime', at('package.json'), count(pkg.dependencies)),
      ...check(ctx, 'deps_dev', at('package.json'), count(pkg.devDependencies)),
    ];
  },
};

const SETTINGS = '.claude/settings.json';

const spawnDepth: Check = {
  id: 'subagent_spawn_depth',
  run: (ctx) => {
    const settings = readJson(ctx, SETTINGS);
    if (!settings) return [];
    const env = (settings.env ?? {}) as Record<string, unknown>;
    const depth = Number(env.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH);
    if (Number.isNaN(depth)) {
      return [
        {
          file: SETTINGS,
          severity: 'error',
          rule: 'subagent_spawn_depth',
          message: 'env CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH is not set',
        },
      ];
    }
    return check(ctx, 'subagent_spawn_depth', at(SETTINGS), depth);
  },
};

export const metaChecks: Check[] = [deps, spawnDepth];
