import styles from './ClassTags.module.css';
import type { CSSProperties } from 'react';
import { useApp } from '../../state/AppProvider';
import { DetailPopover } from '../../components/ui/DetailPopover';
import { ProgressBar } from '../../components/ui/ProgressBar';
export function ClassTags() {
  const { state } = useApp();
  return (
    <div
      className={styles['class-tags']}
      role="group"
      aria-label="Your classes"
    >
      {state.classes.map((c) => (
        <DetailPopover
          key={c.id}
          label={c.name + ', level ' + c.level}
          className={styles['class-tag']}
          style={
            {
              '--color': c.color,
              '--tint': c.tint,
              '--tag-border': c.color + '40',
            } as CSSProperties
          }
          details={
            <div style={{ '--color': c.color } as CSSProperties}>
              <div className="detail-heading">
                {c.name}
                <span>Level {c.level}</span>
              </div>
              <p className="detail-domain">{c.domain} domain</p>
              <div className="xp-label">
                <b>
                  {c.xp} / {c.max} XP
                </b>
                <span>{c.max - c.xp} to next level</span>
              </div>
              <ProgressBar
                value={c.xp}
                max={c.max}
                label={c.name + ' experience'}
              />
            </div>
          }
        >
          <span>{c.name}</span>
          <b>{c.level}</b>
        </DetailPopover>
      ))}
    </div>
  );
}
