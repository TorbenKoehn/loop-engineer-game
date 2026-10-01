// Item rules of one fight and the queue of triggers the sim raises for rules/engine.ts.
import type { Rule, Trigger } from '../../../content/types/index.ts';
import type { CombatInput } from '../types.ts';

/** One rule of the prompt, a skill, a memory or a lesson; passive ones never fire (T033). */
export interface RuleRt {
  /** `<kind>:<def id>#<rule index>`, e.g. `skill:rubber_duck#0`; the oncePerRun key. */
  readonly id: string;
  readonly src: string; // owning def id: prime ids (`prime:grep_first`), charge causes
  readonly rule: Rule;
  hits: number; // trigger matches this fight (nth)
  /** t of the last firing, -1 before the first (oncePerFight, cooldown). */
  lastT: number;
}

export interface Fire {
  readonly on: Trigger['on'];
  /** Slot of the tool that fired or gave Guardrails: the rule's own tool (`tool`, conds). */
  readonly slot?: number;
  /** damaged: the hit before Guardrails; trustBelow: Trust after the hit. */
  readonly n?: number;
  readonly fromTool?: boolean;
  /** Indices of the rules whose effects raised it; those never see it (no recursion). */
  readonly chain: readonly number[];
}

export type FireSpec = Omit<Fire, 'chain'>;

export interface RulesRt {
  /** Collection order = slot order: prompt, skills, memories, lessons. */
  readonly list: readonly RuleRt[];
  readonly pending: Fire[];
  chain: readonly number[]; // of the rule whose effects run now
  readonly usedOncePerRun: string[];
}

type Owner = { readonly id: string; readonly rules: readonly Rule[] };
const KINDS = ['prompt', 'skill', 'memory', 'lesson'] as const;

export function createRules(input: CombatInput): RulesRt {
  const { prompt, skills, memories, lessons } = input;
  const owners: readonly (readonly Owner[])[] = [[prompt], skills, memories, lessons];
  const list = owners.flatMap((defs, k) =>
    defs.flatMap((def) =>
      def.rules.map((rule, ix) => ({ id: `${KINDS[k]}:${def.id}#${ix}`, src: def.id, rule })),
    ),
  );
  const rules = list.map((r) => ({ ...r, hits: 0, lastT: -1 }));
  return { list: rules, pending: [], chain: [], usedOncePerRun: [...input.agent.usedOncePerRun] };
}

/** Queues a trigger; inside a rule's effects it carries that rule's chain. */
export function raise(rules: RulesRt, spec: FireSpec): void {
  rules.pending.push({ ...spec, chain: rules.chain });
}
