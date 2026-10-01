// The tool catalogue (docs/game/content/tools.md), in catalogue order.
// M1: the 12 vertical-slice tools; the other 24 join with E014.
import { summarize } from './agent.ts';
import { autocomplete, editFile, sed } from './edit.ts';
import { cat, grep, readFile } from './search.ts';
import { bruteForce, retryWithBackoff } from './shell.ts';
import { lint, runTests } from './testing.ts';
import { webSearch } from './web.ts';

export const tools = [
  grep,
  cat,
  readFile,
  sed,
  editFile,
  autocomplete,
  lint,
  runTests,
  retryWithBackoff,
  bruteForce,
  webSearch,
  summarize,
] as const;

/** Literal union of every tool id in the catalogue. */
export type ToolKey = (typeof tools)[number]['id'];
