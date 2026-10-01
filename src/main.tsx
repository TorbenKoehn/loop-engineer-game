import { render } from 'preact';
import { App } from './ui/app.tsx';
import { Sandbox } from './ui/sandbox/sandbox.tsx';

// `?sandbox` opens the dev combat sandbox (T098) instead of the game.
const sandbox = new URLSearchParams(location.search).has('sandbox');
const root = document.getElementById('app');
if (root) render(sandbox ? <Sandbox /> : <App />, root);
