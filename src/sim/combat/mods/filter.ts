// Item filters on tools (docs/architecture/content-model.md "Core types": Filter), shared by
// primes and passive mods. A leaf module: no sim state.
import type { Filter, ToolDef } from '../../../content/types/index.ts';

const TOOL_FIELDS = ['tag', 'tool', 'maxWeight', 'maxCooldownMs'] as const;

/** Tool fields of a filter must all match; `family` is about enemies and never excludes a tool. */
export function matchesTool(def: ToolDef, f: Filter): boolean {
  return (
    (f.tag === undefined || def.tags.includes(f.tag)) &&
    (f.tool === undefined || def.id === f.tool) &&
    (f.maxWeight === undefined || def.weight <= f.maxWeight) &&
    (f.maxCooldownMs === undefined || def.cooldownMs <= f.maxCooldownMs)
  );
}

/** With a tool its fields must match; without one (agent-wide stats) the filter has none. */
export const fits = (f: Filter, tool?: ToolDef): boolean =>
  tool ? matchesTool(tool, f) : TOOL_FIELDS.every((k) => f[k] === undefined);
