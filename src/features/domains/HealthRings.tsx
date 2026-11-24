import styles from './HealthRings.module.css';
import { useId, useState, type CSSProperties } from 'react';
import { domains } from '../../domain/definitions';
import type { Domain } from '../../domain/models';
import { maxDomainHp } from '../../domain/domainHealth';
import { useApp } from '../../state/AppProvider';
function Icon({ name }: { name: Domain }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'Shelter' ? (
        <path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" />
      ) : name === 'Monetary' ? (
        <>
          <rect x="3" y="5" width="18" height="15" rx="3" />
          <path d="M3 9h18M16 13h5v4h-5a2 2 0 0 1 0-4Z" />
        </>
      ) : name === 'Mental' ? (
        <>
          <path d="M9 18v3h8v-5a7 7 0 1 0-12-5l-2 4h4v3h2Z" />
          <path d="m10 10 2 2 4-4" />
        </>
      ) : (
        <>
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
          <path d="M3 12h5l2-4 3 8 2-4h6" />
        </>
      )}
    </svg>
  );
}

export function HealthRings() {
  const {
    state: { domainHealth },
  } = useApp();
  const [selected, setSelected] = useState<Domain | null>(null);
  const trayId = useId();
  const readings = domains.map((domain) => ({
    ...domain,
    value: domainHealth?.domains[domain.name].hp ?? maxDomainHp,
  }));
  const active = readings.find(({ name }) => name === selected);

  return (
    <div className={styles.health}>
      <div
        className={styles['health-grid']}
        role="group"
        aria-label="Domain health"
      >
        {readings.map((domain) => (
          <button
            key={domain.name}
            type="button"
            aria-label={domain.name + ' health'}
            aria-expanded={selected === domain.name}
            aria-controls={trayId}
            className={styles['health-domain']}
            style={{ '--health': domain.value } as CSSProperties}
            onClick={() =>
              setSelected(selected === domain.name ? null : domain.name)
            }
            onKeyDown={(event) => {
              if (event.key === 'Escape' && selected) setSelected(null);
            }}
          >
            <span className={styles['health-ring']}>
              <span className={styles['health-domain-icon']}>
                <Icon name={domain.name} />
              </span>
            </span>
          </button>
        ))}
      </div>
      <div id={trayId} hidden={!active} className={styles.tray}>
        {active && (
          <section
            aria-label={active.name + ' health'}
            style={{ '--health': active.value } as CSSProperties}
          >
            <div className={styles.heading}>
              <h3>{active.name} health</h3>
              <span>
                {active.value} / {maxDomainHp} HP
              </span>
            </div>
            <div
              className={styles.meter}
              role="meter"
              aria-label={active.name + ' health'}
              aria-valuemin={0}
              aria-valuemax={maxDomainHp}
              aria-valuenow={active.value}
            >
              <span />
            </div>
            {active.metrics.length > 0 && (
              <ul className={styles.metrics}>
                {active.metrics.map((metric) => (
                  <li key={metric}>{metric}</li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
