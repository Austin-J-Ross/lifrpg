import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { it, expect } from 'vitest';
import { AppProvider, useApp } from '../../state/AppProvider';
import { decodeState } from '../../persistence/schema';
import legacy from '../../../tests/fixtures/legacy-v1.json';
import { QuestBadge } from './QuestBadge';
function Complete() {
  const { state, send } = useApp();
  return (
    <button
      onClick={() =>
        send({ type: 'quest/complete', id: state.quests[0].id, at: 123 })
      }
    >
      Complete first
    </button>
  );
}
it('links to quests and updates from shared state', () => {
  render(
    <MemoryRouter>
      <AppProvider demoState={decodeState(legacy)}>
        <QuestBadge />
        <Complete />
      </AppProvider>
    </MemoryRouter>,
  );
  expect(
    screen.getByRole('link', { name: '3 active quests. View quests' }),
  ).toHaveAttribute('href', '/quests');
  fireEvent.click(screen.getByRole('button', { name: 'Complete first' }));
  expect(
    screen.getByRole('link', { name: '2 active quests. View quests' }),
  ).toBeInTheDocument();
});
