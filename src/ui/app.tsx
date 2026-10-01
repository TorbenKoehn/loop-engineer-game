// Import boundary: ui may import content, sim, run, save, render-fx, audio.
// Nothing may import from src/ui. See docs/architecture/overview.md.
import { Sandbox } from './sandbox/view/sandbox.tsx';

/** Until the IDE shell (T055) exists, the start page is the dev combat sandbox (T098). */
export function App() {
  return <Sandbox />;
}
