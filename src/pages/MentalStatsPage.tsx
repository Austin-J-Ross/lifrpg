import { useState, type FormEvent } from 'react';
import { Modal } from '../components/ui/Modal';
import { PageHeading } from '../components/ui/PageHeading';
import { createId } from '../domain/identity';
import {
  mentalStatGroups,
  sentiments,
  type MentalStats,
  type Sentiment,
} from '../domain/mental';
import { useApp } from '../state/AppProvider';
import styles from './MentalStatsPage.module.css';

const groups = Object.entries(mentalStatGroups).map(([title, fields]) => ({
  title,
  fields: Object.entries(fields) as [keyof MentalStats, string][],
}));

function MentalLogForm({ onClose }: { onClose: () => void }) {
  const { send } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sentiment, setSentiment] = useState<Sentiment>('neutral');

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      send({
        type: 'mental/log',
        entry: {
          id: createId(),
          at: Date.now(),
          title: title.trim(),
          description: description.trim(),
          sentiment,
        },
      })
    )
      onClose();
  }

  return (
    <Modal title="Log a mental status" onClose={onClose}>
      <form onSubmit={save}>
        <label>
          Title
          <input
            autoFocus
            required
            maxLength={90}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            rows={4}
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <fieldset className={styles.fieldset}>
          <legend>Sentiment</legend>
          <div className={styles.sentiments}>
            {sentiments.map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="sentiment"
                  value={value}
                  checked={sentiment === value}
                  onChange={() => setSentiment(value)}
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={!title.trim()}>
            Save log
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MentalStatsEditor({
  stats,
  onClose,
}: {
  stats: MentalStats;
  onClose: () => void;
}) {
  const { send } = useApp();
  const [draft, setDraft] = useState(stats);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (send({ type: 'mental/stats-save', stats: draft })) onClose();
  }

  return (
    <Modal title="Edit mental stats" onClose={onClose}>
      <form className={styles.editor} onSubmit={save}>
        {groups.map(({ title, fields }) => (
          <fieldset className={styles.fieldset} key={title}>
            <legend>{title}</legend>
            <div className={styles.columns}>
              {fields.map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    value={draft[key] ?? ''}
                    maxLength={80}
                    onChange={(event) =>
                      setDraft({ ...draft, [key]: event.target.value })
                    }
                  />
                </label>
              ))}
            </div>
          </fieldset>
        ))}
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

export function MentalStatsPage() {
  const {
    state: { mental },
  } = useApp();
  const [logging, setLogging] = useState(false);
  const [editing, setEditing] = useState(false);
  const stats = mental?.stats ?? {};
  const logs = [...(mental?.logs ?? [])].sort((a, b) => b.at - a.at);

  return (
    <section className="page">
      <PageHeading title="Mental Stats" />
      <div className={styles.layout}>
        <div className={'surface ' + styles.brainBox}>
          <svg viewBox="0 0 64 64" width="76" height="76" aria-hidden="true">
            <path d="M32 14C28 5 17 8 16 16c-7-1-12 6-9 12-6 5-4 15 4 17 0 9 12 13 17 6 2-2 4-4 4-9V14Zm0 0c4-9 15-6 16 2 7-1 12 6 9 12 6 5 4 15-4 17 0 9-12 13-17 6-2-2-4-4-4-9" />
            <path d="M16 16c-1 5 2 8 6 9M7 28c4-1 7 1 9 4m-5 13c2-6 6-8 11-7m6 13c-2-5-7-7-11-5m31-30c1 5-2 8-6 9m15 3c-4-1-7 1-9 4m5 13c-2-6-6-8-11-7m-6 13c2-5 7-7 11-5" />
          </svg>
          <button
            type="button"
            className="add-button"
            onClick={() => setLogging(true)}
          >
            Log
          </button>
        </div>

        <section className="surface" aria-labelledby="mental-stats-heading">
          <div className={styles.statsTitle}>
            <h2 id="mental-stats-heading">Stats</h2>
            <button
              type="button"
              className={styles.edit}
              aria-label="Edit mental stats"
              onClick={() => setEditing(true)}
            >
              (edit)
            </button>
          </div>
          {groups.map(({ title, fields }) => (
            <div className={styles.statGroup} key={title}>
              <h3>{title}</h3>
              <dl className={styles.columns}>
                {fields.map(([key, label]) => (
                  <div key={key} className={styles.reading}>
                    <dt>{label}</dt>
                    <dd>{stats[key] || '—'}</dd>
                  </div>
                ))}
              </dl>
              {title === 'Mental Stats' && (
                <p className={styles.note}>* Affected by sleep and stress.</p>
              )}
              {title === 'Personality (Big Five)' && (
                <a
                  className={styles.testLink}
                  href="https://openpsychometrics.org/tests/IPIP-BFFM/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Big Five Personality Test
                </a>
              )}
            </div>
          ))}
        </section>

        <section className="surface" aria-labelledby="mental-log-heading">
          <h2 id="mental-log-heading">Log</h2>
          {logs.length ? (
            <ul className={styles.logs}>
              {logs.map((entry) => {
                const date = new Date(entry.at);
                return (
                  <li key={entry.id}>
                    <div className={styles.logHeading}>
                      <h3>{entry.title}</h3>
                      <span data-sentiment={entry.sentiment}>
                        {entry.sentiment}
                      </span>
                    </div>
                    <time dateTime={date.toISOString()}>
                      {date.toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                      })}
                    </time>
                    {entry.description && <p>{entry.description}</p>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.note}>No entries yet.</p>
          )}
        </section>
      </div>
      {logging && <MentalLogForm onClose={() => setLogging(false)} />}
      {editing && (
        <MentalStatsEditor stats={stats} onClose={() => setEditing(false)} />
      )}
    </section>
  );
}
