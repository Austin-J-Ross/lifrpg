import { useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../state/AppProvider';
import { activeQuestCount, isActiveQuest } from '../state/reducer';
import type { Quest } from '../domain/models';
import { PageHeading } from '../components/ui/PageHeading';
import { QuestList } from '../features/quests/QuestList';
import { QuestForm } from '../features/quests/QuestForm';
export function QuestsPage() {
  const { state } = useApp();
  const [form, setForm] = useState<Quest | 'new' | null>(null);
  const completed = state.quests
    .filter(
      (quest): quest is Quest & { completedAt: number } =>
        !isActiveQuest(quest),
    )
    .sort((a, b) => b.completedAt - a.completedAt);
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
              onClick={() => setForm('new')}
            >
              + New quest
            </button>
          ) : (
            <Link className="text-link" to="/classes">
              Create a class first →
            </Link>
          )}
        </header>
        <QuestList onEdit={setForm} />
        <p className="quest-footer">
          Quest damage is applied at midnight local time.
        </p>
      </section>
      <section
        className="quest-panel completed-quests"
        aria-labelledby="completed-quests-heading"
      >
        <h2 id="completed-quests-heading">
          Completed quests{' '}
          <span className="quest-history-count">{completed.length}</span>
        </h2>
        {completed.length ? (
          <ul className="quest-history">
            {completed.map((quest) => {
              const entry = state.classes.find(
                (item) => item.id === quest.classId,
              );
              const skill = entry?.skills.find(
                (item) => item.id === quest.skillId,
              );
              const date = new Date(quest.completedAt);
              return (
                <li key={quest.id}>
                  <div>
                    <h3>{quest.title}</h3>
                    <p>
                      {entry?.name} · {skill?.name}
                    </p>
                  </div>
                  <div className="quest-history-reward">
                    <strong>+{quest.xp} XP</strong>
                    <time dateTime={date.toISOString()}>
                      {date.toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                      })}
                    </time>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="quest-intro">No completed quests yet.</p>
        )}
      </section>
      {form && (
        <QuestForm
          quest={form === 'new' ? undefined : form}
          onClose={() => setForm(null)}
        />
      )}
    </section>
  );
}
