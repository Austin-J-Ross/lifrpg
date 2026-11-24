import type { CSSProperties } from 'react';

export function ProgressBar({
  value,
  max,
  label,
  animation,
}: {
  value: number;
  max: number;
  label: string;
  animation?: { from: number; levelUp: boolean };
}) {
  return (
    <div
      className={animation ? 'bar xp-gain-bar' : 'bar'}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <span
        className={
          animation
            ? animation.levelUp
              ? 'xp-gain-level'
              : 'xp-gain-fill'
            : undefined
        }
        style={
          {
            width: Math.min(100, (value / max) * 100) + '%',
            ...(animation && { '--xp-from': animation.from + '%' }),
          } as CSSProperties
        }
      />
    </div>
  );
}
