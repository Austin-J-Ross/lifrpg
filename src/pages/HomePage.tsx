import { Link } from 'react-router';
import { AboutMenu } from '../components/ui/AboutMenu';
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
      </header>
      <section className="character-sheet" aria-label="Character">
        <div className="character-overview">
          <div className="full-body-portrait">
            {profile.portrait ? (
              <img src={profile.portrait} alt="Full-body character portrait" />
            ) : (
              <div className="portrait-placeholder" aria-hidden="true">
                ◇
              </div>
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
