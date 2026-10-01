// Import boundary: ui may import content, sim, run, save, render-fx, audio.
// Nothing may import from src/ui. See docs/architecture/overview.md.
import { Placeholder } from './screens/placeholder.tsx';
import { Title } from './screens/title.tsx';
import { Shell } from './shell/shell.tsx';
import { mode } from './store/run.ts';

/** Switches on `mode` to one screen inside the shell; `mode` is the route (ui.md "Screens"). */
export function App() {
  const m = mode.value;
  return <Shell>{m === 'title' ? <Title /> : <Placeholder mode={m} />}</Shell>;
}
