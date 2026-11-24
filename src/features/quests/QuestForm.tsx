import { createId } from '../../domain/identity';
import styles from './QuestForm.module.css';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useApp } from '../../state/AppProvider';
import { questSizes, type QuestSize } from '../../domain/definitions';
import type { QuestKind } from '../../domain/models';
import {
  dayDeadline,
  localDateValue,
  deadlineForDate,
} from '../../domain/deadlines';
import { Modal } from '../../components/ui/Modal';
export function QuestForm({
  onClose,
  initialSize = 'medium',
}: {
  onClose: () => void;
  initialSize?: QuestSize;
}) {
  const { state, send, notify } = useApp();
  const [title, setTitle] = useState(''),
    [classId, setClassId] = useState(state.classes[0]?.id || ''),
    [skillId, setSkillId] = useState(state.classes[0]?.skills[0]?.id || ''),
    [date, setDate] = useState(localDateValue(new Date(dayDeadline(1)))),
    [size, setSize] = useState<QuestSize>(initialSize),
    [kind, setKind] = useState<QuestKind>('quest'),
    [noDamage, setNoDamage] = useState(false);
  const entry = state.classes.find((c) => c.id === classId);
  function submit(e: FormEvent) {
    e.preventDefault();
    const deadline = deadlineForDate(date);
    if (!Number.isFinite(deadline)) {
      notify('Enter a valid deadline.');
      return;
    }
    if (
      send({
        type: 'quest/create',
        id: createId(),
        title,
        classId,
        skillId,
        deadline,
        size,
        kind,
        noDamage,
      })
    ) {
      notify(kind === 'habit' ? 'Habit added.' : 'Quest added.');
      onClose();
    }
  }
  if (!state.classes.length) {
    return (
      <Modal title="New quest" onClose={onClose}>
        <p>Quests need a class and skill. Create a class to get started.</p>
        <div className="actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <Link className="add-button" to="/classes">
            Go to Classes
          </Link>
        </div>
      </Modal>
    );
  }
  return (
    <Modal title="A new little adventure" onClose={onClose}>
      <form onSubmit={submit}>
        <label>
          Quest objective
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={90}
            autoFocus
          />
        </label>
        <label>
          Type
          <select
            value={kind}
            onChange={(event) =>
              setKind(event.target.value === 'habit' ? 'habit' : 'quest')
            }
          >
            <option value="quest">Quest</option>
            <option value="habit">Habit</option>
          </select>
        </label>
        <label>
          Class
          <select
            value={classId}
            onChange={(e) => {
              const c = state.classes.find((c) => c.id === e.target.value);
              setClassId(e.target.value);
              setSkillId(c?.skills.find((s) => s.name === 'General')?.id || '');
            }}
            required
          >
            {state.classes.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Skill
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            required
          >
            {entry?.skills.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Deadline
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min="1900-01-01"
            max="9999-12-31"
            required
            aria-describedby="deadline-help"
          />
        </label>
        <p id="deadline-help" className="form-note">
          Due at 11:59 PM local time.
        </p>
        <p className="domain-link">
          Linked domain <strong>{entry?.domain}</strong>
          <small>Set automatically by the class.</small>
        </p>
        <label className="damage-toggle">
          <span>
            No damage
            <small>Exclude this quest from planned overdue penalties.</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={noDamage}
            onChange={(e) => setNoDamage(e.target.checked)}
          />
        </label>
        <fieldset className={styles['quest-size']}>
          <legend>Quest size</legend>
          <div className={styles['size-options']}>
            {Object.entries(questSizes).map(([key, value]) => (
              <label key={key} className={styles['size-option']}>
                <input
                  type="radio"
                  name="size"
                  value={key}
                  checked={size === key}
                  onChange={() => setSize(key as QuestSize)}
                />
                <span className={styles['size-card']}>
                  <strong>{value.label}</strong>
                  <span>{value.xp} XP</span>
                  <small>
                    {noDamage ? 'No damage' : '−' + value.rate + '/day'}
                  </small>
                </span>
              </label>
            ))}
          </div>
          <p className={styles['size-help']}>
            XP on completion. Damage rates are planned; automatic damage is not
            implemented.
          </p>
        </fieldset>
        <div className="actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={!entry}>
            {kind === 'habit' ? 'Create Habit' : 'Create Quest'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
