import { createId } from '../../domain/identity';
import { useState, type CSSProperties, type FormEvent } from 'react';
import type { CharacterClass } from '../../domain/models';
import { useApp } from '../../state/AppProvider';
import { isActiveQuest } from '../../state/reducer';
import { skillProgress } from '../../domain/progression';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ClassForm } from './ClassForm';
import { SkillEditForm } from './SkillEditForm';
import styles from './ClassCard.module.css';
export function ClassCard({ entry }: { entry: CharacterClass }) {
  const { state, send, notify } = useApp();
  const [name, setName] = useState('');
  const [editingClass, setEditingClass] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const editingSkill = entry.skills.find(
    (skill) => skill.id === editingSkillId,
  );
  const active = state.quests.filter(
    (q) => q.classId === entry.id && isActiveQuest(q),
  ).length;
  function submit(e: FormEvent) {
    e.preventDefault();
    if (
      send({
        type: 'skill/create',
        classId: entry.id,
        id: createId(),
        name,
      })
    ) {
      notify(name.trim() + ' added to ' + entry.name + '.');
      setName('');
    }
  }
  return (
    <article
      className={styles.card}
      style={{ '--color': entry.color, '--tint': entry.tint } as CSSProperties}
    >
      <header className={styles['card-heading']}>
        <h2>{entry.name}</h2>
        <div className={styles['edit-actions']}>
          <span className={styles['level-badge']}>Level {entry.level}</span>
          <button
            type="button"
            className="small-button"
            aria-label={'Edit class ' + entry.name}
            onClick={() => setEditingClass(true)}
          >
            Edit
          </button>
        </div>
      </header>
      <p className={styles['class-domain']}>{entry.domain} domain</p>
      <p className={styles['class-summary']}>
        {entry.summary ||
          'Grow through the skills you practice and the quests you complete.'}
      </p>
      <p className={styles['class-stats']}>
        {entry.skills.reduce((sum, s) => sum + s.xp, 0).toLocaleString()} total
        XP · {active} active {active === 1 ? 'quest' : 'quests'} ·{' '}
        {entry.skills.length} skills
      </p>
      <div className="xp-label">
        <b>
          {entry.xp} / {entry.max} class XP
        </b>
        <span>{entry.max - entry.xp} to next level</span>
      </div>
      <ProgressBar
        value={entry.xp}
        max={entry.max}
        label={entry.name + ' class experience'}
      />
      <h3 className={styles['skills-heading']} id={'skills-' + entry.id}>
        Skills
      </h3>
      <ul
        className={styles['skill-list']}
        tabIndex={0}
        aria-labelledby={'skills-' + entry.id}
      >
        {entry.skills.map((s) => {
          const p = skillProgress(s.xp);
          return (
            <li className={styles['skill-row']} key={s.id}>
              <div className={styles['skill-name']}>
                <strong>{s.name}</strong>
                <div className={styles['edit-actions']}>
                  <span className={styles['level-badge']}>Level {p.level}</span>
                  <button
                    type="button"
                    className="small-button"
                    aria-label={'Edit skill ' + s.name}
                    onClick={() => setEditingSkillId(s.id)}
                  >
                    Edit
                  </button>
                </div>
              </div>
              <div className="xp-label">
                <span>
                  {p.xp} / {p.next} XP
                </span>
                <span>{p.next - p.xp} to next level</span>
              </div>
              <ProgressBar
                value={p.xp}
                max={p.next}
                label={s.name + ' experience'}
              />
            </li>
          );
        })}
      </ul>
      <form className={styles['new-skill-form']} onSubmit={submit}>
        <label className="sr-only" htmlFor={'new-skill-' + entry.id}>
          New skill for {entry.name}
        </label>
        <input
          id={'new-skill-' + entry.id}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New skill name"
          maxLength={50}
          required
        />
        <button className="small-button">+ Add skill</button>
      </form>
      {editingClass && (
        <ClassForm entry={entry} onClose={() => setEditingClass(false)} />
      )}
      {editingSkill && (
        <SkillEditForm
          classId={entry.id}
          skill={editingSkill}
          onClose={() => setEditingSkillId(null)}
        />
      )}
    </article>
  );
}
