import { useClock } from '../../components/ui/useClock';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../../state/AppProvider';
import { DAY } from '../../domain/deadlines';
import { createId } from '../../domain/identity';
import { skillProgress } from '../../domain/progression';
import type { Quest, QuestKind } from '../../domain/models';
import { EmptyState } from '../../components/ui/EmptyState';
import styles from './QuestList.module.css';
import { QuestCompletion, type QuestAward } from './QuestCompletion';
import { QuestSwipeRow } from './QuestSwipeRow';
import { isActiveQuest } from '../../state/reducer';
function QuestItem({
  quest,
  onComplete,
  now,
  onSwipe,
  onEdit,
}: {
  quest: Quest;
  onComplete: () => void;
  now: number;
  onSwipe?: (at: number, playSound?: () => void) => boolean;
  onEdit?: () => void;
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
        damage={quest.damageDealt ?? 0}
        onSwipe={onSwipe}
        onConfirm={onComplete}
        onEdit={onEdit}
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
      <div className={styles.rowActions}>
        <span className={styles.reward}>+{quest.xp} XP</span>
        {onEdit && (
          <button
            type="button"
            className="small-button"
            aria-label={'Edit ' + quest.title}
            onClick={onEdit}
          >
            Edit
          </button>
        )}
      </div>
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
            : '−' + quest.rate + '/day'}
        </span>
      </div>
    </article>
  );
}
export function QuestList({
  layout,
  emptyAction,
  kindFilter = 'all',
  onEdit,
}: {
  layout?: 'today';
  emptyAction?: '/classes' | '/quests';
  kindFilter?: QuestKind | 'all';
  onEdit?: (quest: Quest) => void;
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
  function complete(quest: Quest, at: number, playSound?: () => void) {
    const skill = state.classes
      .find(({ id }) => id === quest.classId)
      ?.skills.find(({ id }) => id === quest.skillId);
    if (
      !skill ||
      !state.quests.some(
        (entry) => entry.id === quest.id && isActiveQuest(entry),
      )
    )
      return false;
    if (
      !send({
        type: 'quest/complete',
        id: quest.id,
        at,
        nextHabitId: quest.kind === 'habit' ? createId() : undefined,
      })
    ) {
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
    playSound?.();
    return true;
  }
  const today = layout === 'today';
  const active = state.quests.filter(isActiveQuest);
  const empty =
    today && active.length ? (
      <EmptyState>
        {kindFilter === 'habit' ? 'No habits to show.' : 'No quests to show.'}
      </EmptyState>
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
    ? active
        .filter(
          (quest) =>
            kindFilter === 'all' || (quest.kind ?? 'quest') === kindFilter,
        )
        .sort((a, b) => a.deadline - b.deadline)
    : active;
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
      onSwipe={
        today ? (at, playSound) => complete(quest, at, playSound) : undefined
      }
      onComplete={() => setCompletion({ quest })}
      onEdit={onEdit ? () => onEdit(quest) : undefined}
    />
  );
  return (
    <>
      {today ? (
        <div key={kindFilter} ref={ref} className={styles.today}>
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
          onConfirm={(at, playSound) =>
            complete(completion.quest, at, playSound)
          }
          onClose={(completed) => {
            focus.current = completed;
            setCompletion(null);
          }}
        />
      )}
    </>
  );
}
