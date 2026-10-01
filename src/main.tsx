import { render } from 'preact';
import { App } from './ui/app.tsx';

const root = document.getElementById('app');
// `?sandbox` opens the dev combat sandbox; `import.meta.env.DEV` is false in production
// builds, so the branch and the lazily imported sandbox module are dropped there.
if (root && import.meta.env.DEV && new URLSearchParams(location.search).has('sandbox')) {
  void import('./ui/sandbox/sandbox.tsx').then(({ Sandbox }) => render(<Sandbox />, root));
} else if (root) {
  render(<App />, root);
}
