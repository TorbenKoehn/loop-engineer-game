import type { Finding } from '../core/types.ts';
import { codeChecks } from './code/code.ts';
import { dirChecks } from './dirs.ts';
import { docChecks } from './docs/docs.ts';
import { driftChecks } from './docs/drift.ts';
import { linkChecks } from './docs/links.ts';
import { skillChecks } from './docs/skills.ts';
import { forgeChecks } from './forge/forge.ts';
import { integrityChecks } from './forge/integrity.ts';
import { metaChecks } from './meta.ts';
import { overrideChecks } from './overrides.ts';
import type { Check, Ctx } from './util.ts';

/** Add a budget check by appending a Check to one of these lists (and the budget to config). */
export const registry: Check[] = [
  ...docChecks,
  ...linkChecks,
  ...skillChecks,
  ...driftChecks,
  ...codeChecks,
  ...dirChecks,
  ...forgeChecks,
  ...integrityChecks,
  ...metaChecks,
  ...overrideChecks,
];

export function runBudgets(ctx: Ctx): Finding[] {
  return registry.flatMap((c) => c.run(ctx));
}

export type { Ctx } from './util.ts';
