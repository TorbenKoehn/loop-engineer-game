// Keyboard helpers for screens (ui.md "Input"): initial focus and arrow keys between cards.
import { useEffect, useRef } from 'preact/hooks';

/** A ref whose element takes focus once, when the screen mounts. */
export function useInitialFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => ref.current?.focus(), []);
  return ref;
}

const STEP: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/** Container keydown: arrow keys move focus between its enabled buttons, wrapping. */
export function arrowFocus(e: KeyboardEvent): void {
  const step = STEP[e.key];
  if (!step || !(e.currentTarget instanceof HTMLElement)) return;
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>('button:enabled')];
  const at = items.indexOf(document.activeElement as HTMLElement);
  items[(at + step + items.length) % items.length]?.focus();
  e.preventDefault();
}
