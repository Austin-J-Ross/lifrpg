import { Link } from 'react-router';
import { useState } from 'react';
import { AboutMenu } from '../components/ui/AboutMenu';
import { useApp } from '../state/AppProvider';
import { HealthRings } from '../features/domains/HealthRings';
import { QuestList } from '../features/quests/QuestList';
import { QuestForm } from '../features/quests/QuestForm';
import { TaskTypeIcon } from '../features/quests/TaskTypeIcon';
import { questKinds, type QuestKind } from '../domain/models';
export function HomePage() {
  const {
    state: { profile, classes },
  } = useApp();
  const [filter, setFilter] = useState<QuestKind | 'all'>('all');
  const [addingQuest, setAddingQuest] = useState(false);
  const highestLevel = classes.reduce(
    (highest, { level }) => Math.max(highest, level),
    0,
  );
  return (
    <div className="home-layout">
      <header className="character-banner">
        {profile.portrait ? (
          <img className="character-icon" src={profile.portrait} alt="" />
        ) : (
          <Link
            className="character-icon"
            to="/about"
            aria-label="Add a full-body photo"
          >
            <span aria-hidden="true">◇</span>
          </Link>
        )}
        <div className="character-identity">
          <h2 id="display-name">
            {[profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
              'Adventurer'}
          </h2>
          {highestLevel > 0 && <p>Top class level {highestLevel}</p>}
        </div>
        <AboutMenu />
        <HealthRings />
      </header>
      <section className="character-sheet" aria-label="Character">
        <div className="full-body-portrait">
          {profile.portrait ? (
            <img src={profile.portrait} alt="Full-body character portrait" />
          ) : (
            <div className="portrait-placeholder" aria-hidden="true">
              ◇
            </div>
          )}
        </div>
      </section>
      <section className="page today-panel" aria-labelledby="loadout-heading">
        <h1 className="sr-only" id="loadout-heading" tabIndex={-1}>
          Quest loadout
        </h1>
        <div className="loadout-toolbar">
          <div
            className="loadout-filters"
            role="group"
            aria-label="Filter by task type"
          >
            {questKinds.map((kind) => (
              <button
                type="button"
                key={kind}
                data-task-kind={kind}
                aria-label={kind === 'quest' ? 'Quests' : 'Habits'}
                title={kind === 'quest' ? 'Quests' : 'Habits'}
                aria-pressed={filter === kind}
                onClick={() => setFilter(filter === kind ? 'all' : kind)}
              >
                <TaskTypeIcon kind={kind} decorative />
              </button>
            ))}
          </div>
          <button
            id="add-home-quest"
            className="add-button loadout-add"
            type="button"
            aria-label="Add task"
            onClick={() => setAddingQuest(true)}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
        <p className="loadout-hint">Slide right to complete</p>
        <QuestList
          layout="today"
          emptyAction={classes.length ? '/quests' : '/classes'}
          kindFilter={filter}
        />
        {addingQuest && <QuestForm onClose={() => setAddingQuest(false)} />}
      </section>
    </div>
  );
}
