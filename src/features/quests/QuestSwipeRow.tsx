import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { CharacterClass, Quest } from '../../domain/models';
import styles from './QuestList.module.css';
import { TaskTypeIcon } from './TaskTypeIcon';

export function QuestSwipeRow({
  quest,
  entry,
  skillName,
  damage,
  onSwipe,
  onConfirm,
}: {
  quest: Quest;
  entry: CharacterClass;
  skillName: string;
  damage: number;
  onSwipe: (at: number) => boolean;
  onConfirm: () => void;
}) {
  const drag = useRef<{ id: number; start: number; width: number } | null>(
    null,
  );
  const animation = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(
    () => () => {
      if (animation.current !== null) clearTimeout(animation.current);
    },
    [],
  );

  function start(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || completing) return;
    drag.current = {
      id: event.pointerId,
      start: event.clientX,
      width: event.currentTarget.getBoundingClientRect().width,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    const distance = Math.min(
      gesture.width,
      Math.max(0, event.clientX - gesture.start),
    );
    setOffset(distance);
    setReady(distance >= gesture.width * 0.6);
  }

  function release(event: PointerEvent<HTMLButtonElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (
      event.type === 'pointerup' &&
      event.clientX - gesture.start >= gesture.width * 0.6
    ) {
      setReady(true);
      setCompleting(true);
      setOffset(gesture.width);
      const at = Date.now();
      const finish = () => {
        if (!onSwipe(at)) {
          setCompleting(false);
          setOffset(0);
          setReady(false);
        }
      };
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        finish();
      else animation.current = setTimeout(finish, 180);
    } else {
      setOffset(0);
      setReady(false);
    }
  }

  return (
    <article className={styles.swipeRow}>
      <div className={styles.swipeTrack} data-ready={ready} aria-hidden="true">
        <span>✓</span>
        {ready ? 'Complete' : 'Slide right'}
      </div>
      <button
        type="button"
        className={styles.swipeFace}
        data-dragging={dragging}
        data-complete={quest.id}
        aria-label={'Complete ' + quest.title}
        aria-describedby={'loadout-quest-' + quest.id}
        style={{
          transform: offset ? 'translateX(' + offset + 'px)' : undefined,
        }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onClick={(event) => {
          if (!completing && event.detail === 0) onConfirm();
        }}
      >
        <TaskTypeIcon kind={quest.kind ?? 'quest'} />
        <span className={styles.loadoutCopy} id={'loadout-quest-' + quest.id}>
          <span className={styles.loadoutTitle}>{quest.title}</span>
          <span className={styles.loadoutClass}>
            {entry.name} · {skillName}
          </span>
        </span>
        <span className={styles.loadoutStats}>
          <strong>+{quest.xp} XP</strong>
          <span data-negative={damage > 0}>
            Damage: {damage ? '−' + damage.toLocaleString() : '0'}{' '}
            {entry.domain}
          </span>
        </span>
      </button>
    </article>
  );
}
