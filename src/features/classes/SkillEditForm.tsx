import { useState, type FormEvent } from 'react';
import { Modal } from '../../components/ui/Modal';
import type { Skill } from '../../domain/models';
import { MAX_SKILL_LEVEL, skillProgress } from '../../domain/progression';
import { useApp } from '../../state/AppProvider';

export function SkillEditForm({
  classId,
  skill,
  onClose,
}: {
  classId: string;
  skill: Skill;
  onClose: () => void;
}) {
  const { send, notify, notice } = useApp();
  const [showError, setShowError] = useState(false);
  const [name, setName] = useState(skill.name);
  const [level, setLevel] = useState(String(skillProgress(skill.xp).level));
  const general = skill.name === 'General';

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      send({
        type: 'skill/edit',
        classId,
        id: skill.id,
        name,
        level: Number(level),
      })
    ) {
      notify(name.trim() + ' updated.');
      onClose();
    } else {
      setShowError(true);
    }
  }

  return (
    <Modal title="Edit skill" onClose={onClose}>
      <form onSubmit={save}>
        <label>
          Skill name
          <input
            value={name}
            readOnly={general}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
          />
        </label>
        <label>
          Skill level
          <input
            type="number"
            min={1}
            max={MAX_SKILL_LEVEL}
            step={1}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            required
          />
        </label>
        {showError && notice && <p role="alert">{notice}</p>}
        <div className="actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary">Save skill</button>
        </div>
      </form>
    </Modal>
  );
}
