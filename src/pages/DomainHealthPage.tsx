import { useState, type FormEvent } from 'react';
import { Modal } from '../components/ui/Modal';
import { PageHeading } from '../components/ui/PageHeading';
import {
  defaultDomainHealth,
  maxDomainHp,
  type DomainHealth,
} from '../domain/domainHealth';
import { domainNames, type Domain } from '../domain/models';
import { useApp } from '../state/AppProvider';
import styles from './DomainHealthPage.module.css';

function HealingForm({
  health,
  onClose,
}: {
  health?: DomainHealth;
  onClose: () => void;
}) {
  const { send } = useApp();
  const [draft, setDraft] = useState(
    () =>
      Object.fromEntries(
        domainNames.map((domain) => [
          domain,
          String(
            health?.domains[domain].healing ?? defaultDomainHealth.healing,
          ),
        ]),
      ) as Record<Domain, string>,
  );

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const healing = Object.fromEntries(
      domainNames.map((domain) => [domain, Number(draft[domain])]),
    ) as Record<Domain, number>;
    if (send({ type: 'domain-health/healing-save', healing, at: Date.now() }))
      onClose();
  }

  return (
    <Modal title="Edit daily healing" onClose={onClose}>
      <form onSubmit={save}>
        {domainNames.map((domain) => (
          <label key={domain}>
            {domain} healing (HP)
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={maxDomainHp}
              step={1}
              required
              value={draft[domain]}
              onChange={(event) =>
                setDraft({ ...draft, [domain]: event.target.value })
              }
            />
          </label>
        ))}
        <div className="actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            Save healing
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DomainHealthPage() {
  const {
    state: { domainHealth },
  } = useApp();
  const [editing, setEditing] = useState(false);

  return (
    <section className="page">
      <PageHeading title="Domain Health" showQuestBadge={false} />
      <section className={'surface ' + styles.panel} aria-label="Domain HP">
        <div className={styles.title}>
          <p>Quest damage at midnight. Healing at 7 a.m. local time.</p>
          <button
            className="small-button"
            type="button"
            onClick={() => setEditing(true)}
          >
            Edit healing
          </button>
        </div>
        <ul className={styles.readings}>
          {domainNames.map((domain) => {
            const { hp, healing } =
              domainHealth?.domains[domain] ?? defaultDomainHealth;
            return (
              <li key={domain}>
                <div className={styles.row}>
                  <h2>{domain}</h2>
                  <span>
                    {hp} / {maxDomainHp} HP
                  </span>
                </div>
                <meter
                  min={0}
                  max={maxDomainHp}
                  value={hp}
                  aria-label={domain + ' health'}
                />
                <p>+{healing} HP daily</p>
              </li>
            );
          })}
        </ul>
      </section>
      {editing && (
        <HealingForm health={domainHealth} onClose={() => setEditing(false)} />
      )}
    </section>
  );
}
