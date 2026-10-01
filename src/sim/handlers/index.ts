// Custom handler registry (content-model.md "Custom handlers"): `enemy` handlers run at an
// intent advance; `hook` handlers are passive custom effects asked at one point (mods/custom.ts).
import type { EnemyRt, Sim } from '../combat/state.ts';
import { switchStage } from './stage.ts';

export type EnemyHandler = (sim: Sim, enemy: EnemyRt) => void;
export type Handler =
  | { readonly kind: 'enemy'; readonly run: EnemyHandler }
  | { readonly kind: 'hook'; readonly at: string };

export const HANDLERS = {
  monolith_stage: { kind: 'enemy', run: switchStage },
  double_first_resolve: { kind: 'hook', at: 'fireTools' },
  context_noise_cut: { kind: 'hook', at: 'injectNoise' },
  throttle_shorter: { kind: 'hook', at: 'applyStatus' },
  web_ignores_outage: { kind: 'hook', at: 'outageOf' },
  rot_no_slow: { kind: 'hook', at: 'toolRate' },
  feedback_loop: { kind: 'hook', at: 'pipe' },
} as const satisfies Readonly<Record<string, Handler>>;

type Name = keyof typeof HANDLERS;
export type HookId = { [K in Name]: (typeof HANDLERS)[K]['kind'] extends 'hook' ? K : never }[Name];

/** Every registered handler id, for `validateContent({ handlers })`. */
export const HANDLER_IDS: ReadonlySet<string> = new Set(Object.keys(HANDLERS));

const REGISTRY: Readonly<Record<string, Handler | undefined>> = HANDLERS;

/** The enemy handler `id` names, if registered as one. */
export function enemyHandler(id: string | undefined): EnemyHandler | undefined {
  const h = id === undefined ? undefined : REGISTRY[id];
  return h?.kind === 'enemy' ? h.run : undefined;
}
