import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import type { Quest } from '../../domain/models';
import { skillProgress } from '../../domain/progression';
import { useApp } from '../../state/AppProvider';

export function QuestCompletion({
  quest,
  onClose,
}: {
  quest: Quest;
  onClose: (completed: boolean) => void;
}) {
  const { state, send, notice } = useApp();
  const [showError, setShowError] = useState(false);
  const [award, setAward] = useState<{
    skill: string;
    before: ReturnType<typeof skillProgress>;
    after: ReturnType<typeof skillProgress>;
  } | null>(null);
  const skill = state.classes
    .find(({ id }) => id === quest.classId)
    ?.skills.find(({ id }) => id === quest.skillId);

  function confirm() {
    if (!skill || award || !state.quests.some(({ id }) => id === quest.id))
      return;
    if (send({ type: 'quest/complete', id: quest.id })) {
      setAward({
        skill: skill.name,
        before: skillProgress(skill.xp),
        after: skillProgress(skill.xp + quest.xp),
      });
    } else {
      setShowError(true);
    }
  }

  return (
    <Modal
      title={award ? 'Quest complete' : 'Complete quest?'}
      onClose={() => onClose(Boolean(award))}
    >
      <p>{quest.title}</p>
      {award ? (
        <>
          <div className="quest-xp-result" role="status">
            <h3>
              {award.skill} · +{quest.xp} XP
            </h3>
            <div className="xp-label">
              <span>
                {award.before.level === award.after.level
                  ? 'Level ' + award.after.level
                  : 'Level ' + award.before.level + ' → ' + award.after.level}
              </span>
              <span>
                {award.after.xp} / {award.after.next} XP
              </span>
            </div>
            <ProgressBar
              value={award.after.xp}
              max={award.after.next}
              label={award.skill + ' experience'}
              animation={{
                from: (award.before.xp / award.before.next) * 100,
                levelUp: award.before.level < award.after.level,
              }}
            />
          </div>
          <div className="actions">
            <button
              key="done"
              className="primary"
              type="button"
              autoFocus
              onClick={() => onClose(true)}
            >
              Done
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="form-note">
            Earn {quest.xp} XP for {skill?.name ?? 'the linked skill'}.
          </p>
          {showError && notice && <p role="alert">{notice}</p>}
          <div className="actions">
            <button type="button" autoFocus onClick={() => onClose(false)}>
              Cancel
            </button>
            <button className="primary" type="button" onClick={confirm}>
              Confirm completion
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
