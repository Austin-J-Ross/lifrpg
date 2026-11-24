import type { ReactNode } from 'react';
import { AboutMenu } from './AboutMenu';
import { QuestBadge } from '../../features/quests/QuestBadge';
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1 tabIndex={-1}>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <AboutMenu />
      <div className="page-heading-actions">
        <QuestBadge />
        {children}
      </div>
    </header>
  );
}
