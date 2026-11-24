import { useClock } from '../../components/ui/useClock';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../../state/AppProvider';
import { DAY, daysPastDeadline } from '../../domain/deadlines';
import { questSizeFor, type QuestSize } from '../../domain/definitions';
import { skillProgress } from '../../domain/progression';
import type { Quest } from '../../domain/models';
import { EmptyState } from '../../components/ui/EmptyState';
import styles from './QuestList.module.css';
import { QuestCompletion, type QuestAward } from './QuestCompletion';
import { QuestSwipeRow } from './QuestSwipeRow';
function QuestItem({
  quest,
  onComplete,
  now,
  onSwipe,
}: {
  quest: Quest;
  onComplete: () => void;
  now: number;
  onSwipe?: () => boolean;
}) {
  const { state } = useApp();
  const c = state.classes.find((c) => c.id === quest.classId)!;
  const skill = c.skills.find((s) => s.id === quest.skillId)!;
  const overdue = quest.deadline < now,
    days = Math.max(1, Math.ceil(Math.abs(quest.deadline - now) / DAY));
  if (onSwipe) {
    return (
      <QuestSwipeRow
        quest={quest}
        entry={c}
        skillName={skill.name}
        damage={
          quest.noDamage
            ? 0
            : daysPastDeadline(quest.deadline, now) * quest.rate
        }
        onSwipe={onSwipe}
        onConfirm={onComplete}
      />
    );
  }
  return (
    <article className={styles.item + ' ' + (overdue ? styles.overdue : '')}>
      <button
        className="complete-button"
        type="button"
        data-complete={quest.id}
        aria-label={'Complete ' + quest.title}
        onClick={onComplete}
      />
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
  sizeFilter = 'all',
}: {
  layout?: 'today';
  emptyAction?: '/classes' | '/quests';
  sizeFilter?: QuestSize | 'all';
}) {
  const { state, send } = useApp();
  const [completion, setCompletion] = useState<{
    quest: Quest;
    award?: QuestAward;
    failed?: boolean;
  } | null>(null);
  const now = useClock();
  const ref = useRef<HTMLDivElement>(null),
    focus = useRef(false);
  useEffect(() => {
    if (focus.current) {
      focus.current = false;
      (
        ref.current?.querySelector<HTMLButtonElement>('[data-complete]') ||
        document.querySelector<HTMLElement>(
          '#today-empty-action, #add-home-quest, #add-quest, #portrait-quest-badge',
        )
      )?.focus();
    }
  }, [completion]);
  function complete(quest: Quest) {
    const skill = state.classes
      .find(({ id }) => id === quest.classId)
      ?.skills.find(({ id }) => id === quest.skillId);
    if (!skill || !state.quests.some(({ id }) => id === quest.id)) return false;
    if (!send({ type: 'quest/complete', id: quest.id })) {
      setCompletion({ quest, failed: true });
      return false;
    }
    setCompletion({
      quest,
      award: {
        skill: skill.name,
        before: skillProgress(skill.xp),
        after: skillProgress(skill.xp + quest.xp),
      },
    });
    return true;
  }
  const today = layout === 'today';
  const empty =
    today && state.quests.length ? (
      <EmptyState>No quests of this size.</EmptyState>
    ) : today ? (
      <div className={styles.todayEmpty}>
        <p>No quests yet.</p>
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
  const quests = today
    ? state.quests
        .filter(
          (quest) =>
            sizeFilter === 'all' ||
            (quest.size ?? questSizeFor(quest.xp)) === sizeFilter,
        )
        .sort((a, b) => a.deadline - b.deadline)
    : state.quests;
  const tomorrow = new Date(now);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const groups = today
    ? [
        {
          label: 'Today',
          quests: quests.filter(
            ({ deadline }) => deadline < tomorrow.getTime(),
          ),
        },
        {
          label: 'Upcoming',
          quests: quests.filter(
            ({ deadline }) => deadline >= tomorrow.getTime(),
          ),
        },
      ]
    : [];
  const renderQuest = (quest: Quest) => (
    <QuestItem
      key={quest.id}
      quest={quest}
      now={now}
      onSwipe={today ? () => complete(quest) : undefined}
      onComplete={() => setCompletion({ quest })}
    />
  );
  return (
    <>
      {today ? (
        <div key={sizeFilter} ref={ref} className={styles.today}>
          {groups.map((group) => (
            <section
              className={styles.dueGroup}
              key={group.label}
              aria-label={group.label}
            >
              <h2 className={styles.dueBar}>
                {group.label} · {group.quests.length}
              </h2>
              {group.quests.map(renderQuest)}
            </section>
          ))}
          {!quests.length && empty}
        </div>
      ) : quests.length ? (
        <div ref={ref}>{quests.map(renderQuest)}</div>
      ) : (
        empty
      )}
      {completion && (
        <QuestCompletion
          quest={completion.quest}
          award={completion.award}
          failed={completion.failed}
          onConfirm={() => complete(completion.quest)}
          onClose={(completed) => {
            focus.current = completed;
            setCompletion(null);
          }}
        />
      )}
    </>
  );
}
