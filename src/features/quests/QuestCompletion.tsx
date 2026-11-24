import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import type { Quest } from '../../domain/models';
import type { skillProgress } from '../../domain/progression';
import { useApp } from '../../state/AppProvider';

export interface QuestAward {
  skill: string;
  before: ReturnType<typeof skillProgress>;
  after: ReturnType<typeof skillProgress>;
}

export function QuestCompletion({
  quest,
  award,
  onConfirm,
  failed,
  onClose,
}: {
  quest: Quest;
  award?: QuestAward;
  onConfirm: () => void;
  failed?: boolean;
  onClose: (completed: boolean) => void;
}) {
  const { state, notice } = useApp();
  const skill = state.classes
    .find(({ id }) => id === quest.classId)
    ?.skills.find(({ id }) => id === quest.skillId);

  const kind = quest.kind === 'habit' ? 'habit' : 'quest';

  return (
    <Modal
      title={
        award
          ? kind === 'habit'
            ? 'Habit complete'
            : 'Quest complete'
          : 'Complete ' + kind + '?'
      }
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
          {failed && notice && <p role="alert">{notice}</p>}
          <div className="actions">
            <button type="button" autoFocus onClick={() => onClose(false)}>
              Cancel
            </button>
            <button className="primary" type="button" onClick={onConfirm}>
              Confirm completion
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
