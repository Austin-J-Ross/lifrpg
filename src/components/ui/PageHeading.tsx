import type { ReactNode } from 'react';
import { AboutMenu } from './AboutMenu';
import { QuestBadge } from '../../features/quests/QuestBadge';
export function PageHeading({
  title,
  description,
  showQuestBadge = true,
  children,
}: {
  title: string;
  description?: string;
  showQuestBadge?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1 tabIndex={-1}>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <AboutMenu />
      {(showQuestBadge || children) && (
        <div className="page-heading-actions">
          {showQuestBadge && <QuestBadge />}
          {children}
        </div>
      )}
    </header>
  );
}
