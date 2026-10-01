// Import boundary: ui may import content, sim, run, save, render-fx, audio.
// Nothing may import from src/ui. See docs/architecture/overview.md.
import { signal } from '@preact/signals';
import { GAME_TITLE } from '../content/index.ts';
import { SIM_VERSION } from '../sim/index.ts';

const loops = signal(0);

export function App() {
  return (
    <main>
      <h1>{GAME_TITLE}</h1>
      <p>Placeholder (sim v{SIM_VERSION}).</p>
      <button type="button" onClick={() => loops.value++}>
        Loops: {loops}
      </button>
    </main>
  );
}
