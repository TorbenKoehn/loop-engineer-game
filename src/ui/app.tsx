// Import boundary: ui may import content, sim, run, save, render-fx, audio.
// Nothing may import from src/ui. See docs/architecture/overview.md.
import { CombatScreen } from './screens/combat.tsx';
import { Placeholder } from './screens/placeholder.tsx';
import { Title } from './screens/title.tsx';
import { Shell } from './shell/shell.tsx';
import { mode } from './store/run.ts';

/** The screen for the current `mode`; `mode` is the route (ui.md "Screens"). */
export function Screen() {
  const m = mode.value;
  if (m === 'title') return <Title />;
  if (m === 'combatReview') return <CombatScreen />;
  return <Placeholder mode={m} />;
}

export function App() {
  return (
    <Shell>
      <Screen />
    </Shell>
  );
}
