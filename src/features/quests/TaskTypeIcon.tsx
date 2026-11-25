import type { QuestKind } from '../../domain/models';

export function TaskTypeIcon({
  kind,
  decorative = false,
}: {
  kind: QuestKind;
  decorative?: boolean;
}) {
  const label = kind === 'habit' ? 'Habit' : 'Quest';
  return (
    <svg
      className="task-type-icon"
      data-task-kind={kind}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    >
      {kind === 'habit' ? (
        <path d="M19 10a7 7 0 1 0-1 7m1-12v5h-5" />
      ) : (
        <path d="M12 4v10m0 5v.1" />
      )}
    </svg>
  );
}
