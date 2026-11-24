import { Link } from 'react-router';
import { useApp } from '../state/AppProvider';
import { HealthRings } from '../features/domains/HealthRings';
import { QuestBadge } from '../features/quests/QuestBadge';
export function HomePage() {
  const {
    state: { profile },
  } = useApp();
  return (
    <section className="page character-sheet" aria-label="Home">
      <header className="profile-header">
        <h1 id="display-name" tabIndex={-1}>
          {[profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
            'Adventurer'}
        </h1>
      </header>
      <div className="character-overview">
        <div className="full-body-portrait">
          {profile.portrait ? (
            <img src={profile.portrait} alt="Full-body character portrait" />
          ) : (
            <Link className="portrait-placeholder" to="/about">
              <span aria-hidden="true">◇</span>
              Add a full-body photo
            </Link>
          )}
          <QuestBadge />
        </div>
        <HealthRings />
      </div>
    </section>
  );
}
