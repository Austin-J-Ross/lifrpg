import { useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../state/AppProvider';
import { activeQuestCount } from '../state/reducer';
import { PageHeading } from '../components/ui/PageHeading';
import { QuestList } from '../features/quests/QuestList';
import { QuestForm } from '../features/quests/QuestForm';
export function QuestsPage() {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <section className="page">
      <PageHeading title="Your quests" />
      <section className="quest-panel" aria-labelledby="quest-heading">
        <header className="quest-title">
          <h2 id="quest-heading">
            Active quests{' '}
            <span id="quest-count">{activeQuestCount(state)}</span>
          </h2>
          {state.classes.length ? (
            <button
              id="add-quest"
              className="add-button"
              onClick={() => setOpen(true)}
            >
              + New quest
            </button>
          ) : (
            <Link className="text-link" to="/classes">
              Create a class first →
            </Link>
          )}
        </header>
        <QuestList />
        <p className="quest-footer">
          Damage rates are planned penalties. Automatic health damage is not
          implemented.
        </p>
      </section>
      {open && <QuestForm onClose={() => setOpen(false)} />}
    </section>
  );
}
