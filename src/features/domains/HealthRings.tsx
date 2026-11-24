import styles from './HealthRings.module.css';
import { useState, type CSSProperties } from 'react';
import { domains } from '../../domain/definitions';
import type { Domain } from '../../domain/models';
import { Modal } from '../../components/ui/Modal';
import { DomainMeasurements } from './DomainMeasurements';
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
  const [selected, setSelected] = useState<Domain | null>(null);
  return (
    <div
      className={styles['health-grid']}
      role="group"
      aria-label="Domain health"
    >
      {domains.map((domain) => (
        <button
          key={domain.name}
          type="button"
          aria-label={domain.name + ' health'}
          aria-haspopup="dialog"
          className={styles['health-domain']}
          style={{ '--domain-color': domain.color } as CSSProperties}
          onClick={() => setSelected(domain.name)}
        >
          <span className={styles['health-ring']}>
            <span className={styles['health-domain-icon']}>
              <Icon name={domain.name} />
            </span>
          </span>
        </button>
      ))}
      {selected && (
        <Modal title={selected + ' health'} onClose={() => setSelected(null)}>
          <DomainMeasurements domain={selected} />
          <div className="actions">
            <button type="button" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
