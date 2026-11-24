import { useClock } from '../../components/ui/useClock';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useApp } from '../../state/AppProvider';
import { DAY } from '../../domain/deadlines';
import type { Quest } from '../../domain/models';
import { EmptyState } from '../../components/ui/EmptyState';
import styles from './QuestList.module.css';
function QuestItem({
  quest,
  onComplete,
  now,
  today,
}: {
  quest: Quest;
  onComplete: () => void;
  now: number;
  today: boolean;
}) {
  const { state } = useApp();
  const c = state.classes.find((c) => c.id === quest.classId)!;
  const skill = c.skills.find((s) => s.id === quest.skillId)!;
  const overdue = quest.deadline < now,
    days = Math.max(1, Math.ceil(Math.abs(quest.deadline - now) / DAY));
  return (
    <article className={styles.item + ' ' + (overdue ? styles.overdue : '')}>
      <button
        className={today ? 'add-button ' + styles.complete : 'complete-button'}
        type="button"
        data-complete={quest.id}
        aria-label={'Complete ' + quest.title}
        onClick={onComplete}
      >
        {today && 'Complete'}
      </button>
      <div className={styles.copy}>
        <h3>{quest.title}</h3>
        <p className={styles.className}>
          {c.name} · {skill.name}
        </p>
      </div>
      <span className={styles.reward}>+{quest.xp} XP</span>
      <div className={styles.meta}>
        <time
          className={styles.deadline}
          dateTime={new Date(quest.deadline).toISOString()}
        >
          {overdue
            ? 'Overdue · ' + days + 'd'
            : days === 1
              ? 'Due within 24 hours'
              : 'Due in ' + days + ' days'}{' '}
          ·{' '}
          {new Date(quest.deadline).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
          , 11:59 PM
        </time>
        <span
          className={overdue && !quest.noDamage ? styles.damage : undefined}
        >
          {c.domain} ·{' '}
          {quest.noDamage || !quest.rate
            ? 'No damage'
            : 'Planned −' + quest.rate + '/day'}
        </span>
      </div>
    </article>
  );
}
export function QuestList({
  layout,
  emptyAction,
}: {
  layout?: 'today';
  emptyAction?: '/classes' | '/quests';
}) {
  const { state, send, notify } = useApp();
  const now = useClock();
  const ref = useRef<HTMLDivElement>(null),
    focus = useRef(false);
  useEffect(() => {
    if (focus.current) {
      focus.current = false;
      (
        ref.current?.querySelector<HTMLButtonElement>('[data-complete]') ||
        document.querySelector<HTMLElement>(
          '#today-empty-action, #add-quest, #portrait-quest-badge',
        )
      )?.focus();
    }
  }, [state.quests]);
  const today = layout === 'today';
  if (!state.quests.length) {
    return today ? (
      <div className={styles.todayEmpty}>
        <p>No active quests.</p>
        <Link
          id="today-empty-action"
          className="add-button"
          to={emptyAction ?? '/quests'}
        >
          {emptyAction === '/classes'
            ? 'Create a class to start'
            : 'Go to Quests'}
        </Link>
      </div>
    ) : (
      <EmptyState>All clear. A little breathing room, well earned.</EmptyState>
    );
  }
  const quests = today
    ? [...state.quests].sort((a, b) => a.deadline - b.deadline)
    : state.quests;
  return (
    <div ref={ref} className={today ? styles.today : undefined}>
      {quests.map((q) => (
        <QuestItem
          key={q.id}
          quest={q}
          now={now}
          today={today}
          onComplete={() => {
            focus.current = true;
            if (send({ type: 'quest/complete', id: q.id }))
              notify(q.title + ' complete! +' + q.xp + ' XP');
          }}
        />
      ))}
    </div>
  );
}
