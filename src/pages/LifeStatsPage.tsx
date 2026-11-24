import { useState, type FormEvent } from 'react';
import { Modal } from '../components/ui/Modal';
import { PageHeading } from '../components/ui/PageHeading';
import {
  homeHealth,
  maxCostCents,
  monthlyCosts,
  parseLifeStat,
  type LifeStatKey,
  type LifeStats,
} from '../domain/life';
import { useApp } from '../state/AppProvider';
import styles from './LifeStatsPage.module.css';

const groups = [
  { title: 'Monthly Cost Targets', fields: monthlyCosts, currency: true },
  { title: 'Home', fields: homeHealth, currency: false },
];
const dollars = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
});

function LifeStatsEditor({
  group,
  stats,
  onClose,
}: {
  group: (typeof groups)[number];
  stats: LifeStats;
  onClose: () => void;
}) {
  const { send } = useApp();
  const entries = Object.entries(group.fields) as [LifeStatKey, string][];
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(
      entries.map(([key]) => {
        const value = stats[key];
        return [
          key,
          value === undefined
            ? ''
            : group.currency
              ? (value / 100).toFixed(2)
              : String(value),
        ];
      }),
    ),
  );
  const [error, setError] = useState('');

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const updates: LifeStats = {};
    for (const [key, label] of entries) {
      try {
        updates[key] = parseLifeStat(key, draft[key]);
      } catch (reason) {
        setError(
          label +
            ': ' +
            (reason instanceof Error ? reason.message : 'Enter a valid value.'),
        );
        return;
      }
    }
    setError('');
    if (send({ type: 'life/stats-save', stats: updates })) onClose();
    else setError('Could not save these values.');
  }

  return (
    <Modal title={'Edit ' + group.title} onClose={onClose}>
      <form onSubmit={save}>
        {entries.map(([key, label]) => (
          <label key={key}>
            {label} ({group.currency ? '$' : 'total HP'})
            <input
              type="number"
              inputMode={group.currency ? 'decimal' : 'numeric'}
              min={0}
              max={
                group.currency ? maxCostCents / 100 : Number.MAX_SAFE_INTEGER
              }
              step={group.currency ? 0.01 : 1}
              value={draft[key]}
              onChange={(event) =>
                setDraft({ ...draft, [key]: event.target.value })
              }
            />
          </label>
        ))}
        <p className="form-note">
          {group.currency
            ? 'USD, up to two decimal places.'
            : 'Set the total HP using a whole number of 0 or more.'}
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            Save stats
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function LifeStatsPage() {
  const {
    state: { life },
  } = useApp();
  const [editing, setEditing] = useState<(typeof groups)[number] | null>(null);
  const stats = life ?? {};

  return (
    <section className="page">
      <PageHeading title="Life Stats" showQuestBadge={false} />
      <div className={styles.layout}>
        {groups.map((group) => {
          const heading = group.currency
            ? 'monthly-costs-heading'
            : 'home-health-heading';
          const entries = Object.entries(group.fields) as [
            LifeStatKey,
            string,
          ][];
          return (
            <section
              className="surface"
              key={heading}
              aria-labelledby={heading}
            >
              <div className={styles.heading}>
                <h2 id={heading}>{group.title}</h2>
                <button
                  type="button"
                  aria-label={'Edit ' + group.title}
                  className={styles.edit}
                  onClick={() => setEditing(group)}
                >
                  (edit)
                </button>
              </div>
              <dl className={styles.readings}>
                {entries.map(([key, label]) => {
                  const value = stats[key];
                  return (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd>
                        {value === undefined
                          ? '—'
                          : group.currency
                            ? dollars.format(value / 100)
                            : value.toLocaleString() + ' HP total'}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          );
        })}
      </div>
      {editing && (
        <LifeStatsEditor
          group={editing}
          stats={stats}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
