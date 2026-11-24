import { Link } from 'react-router';
import { useApp } from '../state/AppProvider';
import { HealthRings } from '../features/domains/HealthRings';
import { QuestList } from '../features/quests/QuestList';
import { QuestBadge } from '../features/quests/QuestBadge';
export function HomePage() {
  const {
    state: { profile, classes },
  } = useApp();
  const highestLevel = classes.reduce(
    (highest, { level }) => Math.max(highest, level),
    0,
  );
  return (
    <div className="home-layout">
      <section className="character-sheet" aria-label="Character">
        <header className="profile-header">
          <h2 id="display-name">
            {[profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
              'Adventurer'}
          </h2>
          {highestLevel > 0 && <p>Top class level {highestLevel}</p>}
        </header>
        <div className="character-overview">
          <div className="full-body-portrait">
            {profile.portrait ? (
              <img src={profile.portrait} alt="Full-body character portrait" />
            ) : (
              <Link
                className="portrait-placeholder"
                to="/about"
                aria-label="Add a full-body photo"
              >
                <span aria-hidden="true">◇</span>
              </Link>
            )}
          </div>
          <HealthRings />
        </div>
      </section>
      <section
        className="page quest-panel today-panel"
        aria-labelledby="today-heading"
      >
        <header className="quest-title">
          <h1 id="today-heading" tabIndex={-1}>
            Today
          </h1>
          <QuestBadge />
        </header>
        <QuestList
          layout="today"
          emptyAction={classes.length ? '/quests' : '/classes'}
        />
      </section>
    </div>
  );
}
