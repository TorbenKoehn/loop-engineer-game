// The context bar rendered from folded views, one per zone (T060). Components are plain
// functions, so the vnode tree is walked directly: no DOM needed.
import type { ComponentChild, VNode } from 'preact';
import { describe, expect, it } from 'vitest';
import type { CombatEvent, Ref } from '../../../sim/events.ts';
import { type CtxView, emptyCtx, foldCtx, ZONES } from '../context.ts';
import { ContextBar } from './context-bar.tsx';

type Props = Record<string, unknown> & { children?: ComponentChild };

/** Every element vnode below `node`, depth first. */
function elements(node: ComponentChild): VNode<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object') return [];
  const v = node as VNode<Props>;
  if (typeof v.type === 'function')
    return [v, ...elements((v.type as (p: Props) => VNode)(v.props))];
  return [v, ...elements(v.props.children)];
}

function render(ctx: CtxView, policy = 80, labels = new Map<Ref, string>()) {
  const tree = ContextBar({ ctx, policy, labels }) as VNode<Props>;
  const all = elements(tree);
  const cls = (name: string) => all.filter((v) => String(v.props.class ?? '').includes(name));
  return { tree, cls, json: JSON.stringify(tree) };
}

let seq = 0;
const ev = (e: object): CombatEvent => ({ seq: seq++, t: seq * 100, ...e }) as CombatEvent;

const START = ev({
  kind: 'fightStart',
  v: 30000,
  d: { W: 60, B: 20, S: 20, N: 0, zone: 1, trust: 80, maxTrust: 80 },
});
const drift = (n: number, S: number, N: number) =>
  ev({ kind: 'tokens', src: 'e3', dst: 'ctx', v: n, d: { S, N, F: S + N, kind: 'noise' } });
const zoneTo = (to: number, F: number) =>
  ev({ kind: 'zoneChanged', src: 'ctx', v: to, d: { from: 0, to, F, W: 60 } });

describe('ContextBar', () => {
  it('shows baseline, signal, noise, both ticks, the policy marker and F/W', () => {
    const ctx = [START, drift(6, 24, 6)].reduce(foldCtx, emptyCtx);
    const { cls, json } = render(ctx, 80, new Map<Ref, string>([['e3', 'Context Drift']]));
    expect(cls('ctx__seg--base')).toHaveLength(1);
    expect(cls('ctx__seg--signal')).toHaveLength(1);
    expect(cls('ctx__seg--noise')).toHaveLength(1);
    expect(cls('ctx__tick').map((v) => v.props.style)).toEqual([{ left: '25%' }, { left: '70%' }]);
    expect(cls('ctx__policy')[0]?.props.style).toEqual({ left: '80%' });
    expect(json).toContain('Context Drift: 6k');
    expect(json).toContain('30/60k');
  });

  it.each(ZONES.map((zone, ix) => [zone, ix] as const))(
    'zone %s: class, pattern and label',
    (zone, ix) => {
      const ctx = [START, zoneTo(ix, 10)].reduce(foldCtx, emptyCtx);
      const { cls, tree } = render(ctx);
      expect(cls(`zone zone--${zone}`)).toHaveLength(1);
      expect(tree.props['data-zone']).toBe(zone);
      expect(cls('zone zone--')[0]?.props['aria-label']).toMatch(/^Zone: /);
    },
  );

  it('warns when the policy is disabled and omits the marker for never', () => {
    const off = foldCtx(emptyCtx, { ...START, d: { ...START.d, policyOff: 1 } } as CombatEvent);
    expect(render(off, 70).cls('ctx__warn')).toHaveLength(1);
    expect(render(emptyCtx, 70).cls('ctx__warn')).toHaveLength(0);
    expect(render(emptyCtx, 0).cls('ctx__policy')).toHaveLength(0);
  });

  it('removal trims noise to the logged N and compaction clears it', () => {
    const ctx = [START, drift(6, 20, 6), drift(4, 20, 10)].reduce(foldCtx, emptyCtx);
    expect(ctx.noise).toEqual([{ src: 'e3', n: 10 }]);
    const removed = ev({ kind: 'tokens', v: -3, d: { S: 20, N: 7, F: 27, kind: 'removal' } });
    expect(foldCtx(ctx, removed).noise).toEqual([{ src: 'e3', n: 7 }]);
    const packed = ev({ kind: 'compaction', d: { kind: 'auto', S: 26 } });
    expect(foldCtx(ctx, packed)).toMatchObject({ S: 26, N: 0, noise: [] });
  });
});
