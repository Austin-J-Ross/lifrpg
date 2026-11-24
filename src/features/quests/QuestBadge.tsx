import { Link } from 'react-router';
import { useApp } from '../../state/AppProvider';
import { activeQuestCount } from '../../state/reducer';
import styles from './QuestBadge.module.css';
export function QuestBadge() {
  const { state } = useApp();
  const count = activeQuestCount(state);
  return (
    <Link
      id="portrait-quest-badge"
      className={styles.badge}
      to="/quests"
      aria-label={
        count +
        ' active ' +
        (count === 1 ? 'quest' : 'quests') +
        '. View quests'
      }
    >
      <span id="portrait-quest-count" className={styles.count}>
        {count}
      </span>
    </Link>
  );
}
