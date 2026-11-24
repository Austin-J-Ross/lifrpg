import { useApp } from '../../state/AppProvider';
import { QuestBadge } from '../quests/QuestBadge';
import styles from './CharacterPortrait.module.css';
export function CharacterPortrait() {
  const {
    state: { profile },
  } = useApp();
  return (
    <span className={styles.portrait} data-testid="character-portrait">
      <span className={styles.avatar} aria-hidden="true">
        {Array.from(profile.firstName)[0]?.toUpperCase() || 'A'}
      </span>
      <QuestBadge />
    </span>
  );
}
