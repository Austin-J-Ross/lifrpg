import { Link } from 'react-router';
import { useState } from 'react';
import { AboutMenu } from '../components/ui/AboutMenu';
import { useApp } from '../state/AppProvider';
import { HealthRings } from '../features/domains/HealthRings';
import { QuestList } from '../features/quests/QuestList';
import { QuestForm } from '../features/quests/QuestForm';
import {
  questSizeKeys,
  questSizes,
  type QuestSize,
} from '../domain/definitions';
const sizeLabels: Record<QuestSize, string> = {
  tiny: 't',
  small: 'S',
  medium: 'M',
  large: 'L',
  veryLarge: 'XL',
};
export function HomePage() {
  const {
    state: { profile, classes },
  } = useApp();
  const [filter, setFilter] = useState<QuestSize | 'all'>('all');
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
          <span className="loadout-size-label" id="loadout-size-label">
            Task size
          </span>
          <div
            className="loadout-filters"
            role="group"
            aria-labelledby="loadout-size-label"
          >
            <button
              type="button"
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {questSizeKeys.map((size) => (
              <button
                type="button"
                key={size}
                aria-label={
                  sizeLabels[size] + ' (' + questSizes[size].label + ')'
                }
                aria-pressed={filter === size}
                onClick={() => setFilter(filter === size ? 'all' : size)}
              >
                {sizeLabels[size]}
              </button>
            ))}
          </div>
          <button
            id="add-home-quest"
            className="add-button loadout-add"
            type="button"
            onClick={() => setAddingQuest(true)}
          >
            <span aria-hidden="true">+</span> Add task
          </button>
        </div>
        <p className="loadout-hint">Slide right to complete</p>
        <QuestList
          layout="today"
          emptyAction={classes.length ? '/quests' : '/classes'}
          sizeFilter={filter}
        />
        {addingQuest && (
          <QuestForm
            initialSize={filter === 'all' ? undefined : filter}
            onClose={() => setAddingQuest(false)}
          />
        )}
      </section>
    </div>
  );
}
