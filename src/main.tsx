import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/index.css';
import type { AppState } from './domain/models';
let demoState: AppState | undefined;
if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) {
  const { createDemoState } = await import('./dev/demo');
  demoState = createDemoState();
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App demoState={demoState} />
  </StrictMode>,
);
