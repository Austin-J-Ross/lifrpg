import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Modal } from '../components/ui/Modal';
import { PageHeading } from '../components/ui/PageHeading';
import { createId } from '../domain/identity';
import {
  bodySections,
  displayPhysicalStat,
  physicalStatGroups,
  withStatUnits,
  type BodySection,
  type PhysicalStats,
  type UnitSystem,
} from '../domain/physical';
import { useApp } from '../state/AppProvider';
import styles from './PhysicalStatsPage.module.css';

const statGroups = Object.entries(physicalStatGroups).map(
  ([title, fields]) => ({
    title,
    fields: Object.entries(fields) as [keyof PhysicalStats, string][],
  }),
);

function StatsEditor({
  group,
  stats,
  units,
  onClose,
}: {
  group: (typeof statGroups)[number];
  stats: PhysicalStats;
  units: UnitSystem;
  onClose: () => void;
}) {
  const { send, notify } = useApp();
  const [draft, setDraft] = useState(() => withStatUnits(stats, 'metric'));

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const updates = Object.fromEntries(
      group.fields.map(([key]) => [key, draft[key] ?? '']),
    );
    if (
      send({
        type: 'physical/stats-save',
        stats: withStatUnits(updates, units),
      })
    ) {
      notify(group.title + ' saved.');
      onClose();
    }
  }

  return (
    <Modal title={'Edit ' + group.title} onClose={onClose}>
      <form onSubmit={save}>
        <div className={styles.editorFields}>
          {group.fields.map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                value={draft[key] ?? ''}
                maxLength={key === 'height' || key === 'weight' ? 76 : 80}
                onChange={(event) =>
                  setDraft({ ...draft, [key]: event.target.value })
                }
                placeholder={
                  key === 'height'
                    ? units === 'metric'
                      ? 'e.g. 175 cm'
                      : 'e.g. 5 ft 9 in'
                    : key === 'weight'
                      ? units === 'metric'
                        ? 'e.g. 72 kg'
                        : 'e.g. 160 lb'
                      : undefined
                }
              />
            </label>
          ))}
        </div>
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

function StatusEditor({
  section,
  onClose,
}: {
  section: BodySection;
  onClose: () => void;
}) {
  const { send, notify } = useApp();
  const [message, setMessage] = useState('');

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      send({
        type: 'physical/status-log',
        status: {
          id: createId(),
          section,
          at: Date.now(),
          message: message.trim(),
        },
      })
    ) {
      notify('Status logged.');
      onClose();
    }
  }

  return (
    <Modal title={section + ' status'} onClose={onClose}>
      <form onSubmit={save}>
        <label>
          Status message
          <textarea
            autoFocus
            required
            maxLength={500}
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <div className="actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={!message.trim()}>
            Log status
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function PhysicalStatsPage() {
  const {
    state: { physical, profile },
    send,
  } = useApp();
  const [section, setSection] = useState<BodySection | null>(null);
  const [editing, setEditing] = useState<(typeof statGroups)[number] | null>(
    null,
  );
  const stats = physical?.stats ?? {};
  const units = physical?.units ?? 'imperial';
  const statuses = [...(physical?.statuses ?? [])].sort((a, b) => b.at - a.at);

  return (
    <section className="page">
      <PageHeading title="Phys. Stats" />
      <div className={styles.layout}>
        <section
          className={styles.portraitSection}
          aria-label="Body status portrait"
        >
          <p>Tap a body part to log a status.</p>
          <div className={styles.portrait}>
            {profile.portrait ? (
              <img src={profile.portrait} alt="Full-body character portrait" />
            ) : (
              <div className={styles.emptyPortrait} aria-hidden="true" />
            )}
            {bodySections.map((part) => (
              <button
                className={styles.hotspot}
                data-part={part}
                type="button"
                key={part}
                aria-haspopup="dialog"
                onClick={() => setSection(part)}
              >
                <span>{part}</span>
              </button>
            ))}
          </div>
          {!profile.portrait && (
            <Link to="/about" className={styles.photoLink}>
              Add a full-body photo
            </Link>
          )}
        </section>

        <section className="surface" aria-labelledby="physical-stat-heading">
          <div className={styles.sectionHeading}>
            <h2 id="physical-stat-heading">Stats</h2>
            <button
              className={styles.unitSwitch}
              type="button"
              role="switch"
              aria-label="Metric units"
              aria-checked={units === 'metric'}
              onClick={() =>
                send({
                  type: 'physical/set-units',
                  units: units === 'imperial' ? 'metric' : 'imperial',
                })
              }
            >
              {units === 'imperial' ? 'Imperial' : 'Metric'}
              <span aria-hidden="true" />
            </button>
          </div>
          <div className={styles.statGroups}>
            {statGroups.map((group) => (
              <div key={group.title}>
                <div className={styles.statsTitle}>
                  <h3>{group.title}</h3>
                  <button
                    className={styles.editStats}
                    type="button"
                    aria-label={'Edit ' + group.title}
                    onClick={() => setEditing(group)}
                  >
                    (edit)
                  </button>
                </div>
                <dl className={styles.statFields + ' ' + styles.readings}>
                  {group.fields.map(([key, label]) => (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd>
                        {displayPhysicalStat(key, stats[key] ?? '', units) ||
                          '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        <section className="surface" aria-labelledby="body-status-heading">
          <h2 id="body-status-heading">Status log</h2>
          {statuses.length ? (
            <ul className={styles.statuses}>
              {statuses.map((status) => {
                const date = new Date(status.at);
                return (
                  <li key={status.id}>
                    <div className={styles.statusHeading}>
                      <strong>{status.section}</strong>
                      <time dateTime={date.toISOString()}>
                        {date.toLocaleDateString(undefined, {
                          dateStyle: 'medium',
                        })}
                      </time>
                    </div>
                    <p>{status.message}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.emptyLog}>No statuses logged yet.</p>
          )}
        </section>
      </div>
      {editing && (
        <StatsEditor
          group={editing}
          stats={stats}
          units={units}
          onClose={() => setEditing(null)}
        />
      )}
      {section && (
        <StatusEditor section={section} onClose={() => setSection(null)} />
      )}
    </section>
  );
}
