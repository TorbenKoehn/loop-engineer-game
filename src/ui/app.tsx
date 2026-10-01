// Import boundary: ui may import content, sim, run, save, render-fx, audio.
// Nothing may import from src/ui. See docs/architecture/overview.md.
import { signal } from '@preact/signals';
import type { FunctionComponent } from 'preact';
import { CombatScreen } from './screens/combat.tsx';
import { HarnessSelect } from './screens/harness-select.tsx';
import { Placeholder } from './screens/placeholder.tsx';
import { PromptPick } from './screens/prompt-pick.tsx';
import { Title } from './screens/title.tsx';
import { Shell } from './shell/shell.tsx';
import { mode } from './store/run.ts';

/** A lazy-loaded screen (ui.md "Screens"): renders nothing until its chunk arrives. */
function lazyScreen(load: () => Promise<FunctionComponent>): FunctionComponent {
  const loaded = signal<FunctionComponent | null>(null);
  let started = false;
  return function Lazy() {
    if (!started) {
      started = true;
      void load().then((c) => {
        loaded.value = c;
      });
    }
    const Loaded = loaded.value;
    return Loaded ? <Loaded /> : null;
  };
}

const MapScreen = lazyScreen(() => import('./screens/map/map-screen.tsx').then((m) => m.MapScreen));

/** The screen for the current `mode`; `mode` is the route (ui.md "Screens"). */
export function Screen() {
  const m = mode.value;
  if (m === 'title') return <Title />;
  if (m === 'harnessSelect') return <HarnessSelect />;
  if (m === 'promptPick') return <PromptPick />;
  if (m === 'combatReview') return <CombatScreen />;
  if (m === 'map') return <MapScreen />;
  return <Placeholder mode={m} />;
}

export function App() {
  return (
    <Shell>
      <Screen />
    </Shell>
  );
}
