import { useState, type FormEvent } from 'react';
import { useClock } from '../../components/ui/useClock';
import {
  localDate,
  type Measurement,
  type MeasurementKind,
} from '../../domain/measurements';
import type { Domain } from '../../domain/models';
import { useApp } from '../../state/AppProvider';
import styles from './DomainMeasurements.module.css';

const metrics = {
  sleep: {
    label: 'Sleep',
    recency: 'Last night',
    field: 'Hours slept',
    unit: 'h',
  },
  weight: {
    label: 'Weight',
    recency: 'Latest reading',
    field: 'Weight',
    unit: 'lb',
  },
  calories: {
    label: 'Calories',
    recency: 'Today',
    field: 'Daily calories (kcal)',
    unit: 'kcal',
  },
} as const;

const domainMetrics: Record<Domain, MeasurementKind[]> = {
  Shelter: [],
  Monetary: [],
  Mental: ['sleep'],
  Physical: ['weight', 'calories'],
};

function ReadingDate({ date }: { date: string }) {
  return (
    <time dateTime={date}>
      {new Date(date + 'T00:00:00Z').toLocaleDateString(undefined, {
        dateStyle: 'medium',
        timeZone: 'UTC',
      })}
    </time>
  );
}

function formatReading({ value, unit }: Measurement) {
  return (
    value.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' ' + unit
  );
}

function MeasurementForm({
  kind,
  entries,
  today,
  onClose,
}: {
  kind: MeasurementKind;
  entries: Measurement[];
  today: string;
  onClose: () => void;
}) {
  const { send, notify } = useApp();
  const metric = metrics[kind];
  const initialEntry = entries.find((entry) => entry.date === today);
  const defaultUnit = entries[0]?.unit ?? metric.unit;
  const [date, setDate] = useState(today);
  const [value, setValue] = useState(initialEntry?.value.toString() ?? '');
  const [unit, setUnit] = useState(initialEntry?.unit ?? defaultUnit);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      send({
        type: 'measurement/save',
        entry: { kind, date, unit, value: Number(value) },
      })
    ) {
      notify(metric.label + ' saved.');
      onClose();
    }
  }

  return (
    <form onSubmit={save}>
      <label>
        {kind === 'sleep' ? 'Wake-up date' : 'Date'}
        <input
          type="date"
          required
          value={date}
          max={today}
          onChange={(event) => {
            const nextDate = event.target.value;
            const entry = entries.find((reading) => reading.date === nextDate);
            setDate(nextDate);
            setValue(entry?.value.toString() ?? '');
            setUnit(entry?.unit ?? defaultUnit);
          }}
        />
      </label>
      <label>
        {metric.field}
        <input
          type="number"
          inputMode={kind === 'calories' ? 'numeric' : 'decimal'}
          required
          min={kind === 'weight' ? 0.01 : 0}
          max={kind === 'sleep' ? 24 : undefined}
          step={kind === 'calories' ? 1 : 0.01}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      {kind === 'weight' && (
        <label>
          Unit
          <select
            value={unit}
            onChange={(event) =>
              setUnit(event.target.value === 'kg' ? 'kg' : 'lb')
            }
          >
            <option value="lb">Pounds (lb)</option>
            <option value="kg">Kilograms (kg)</option>
          </select>
        </label>
      )}
      <div className="actions">
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button className="primary" type="submit">
          Save {kind}
        </button>
      </div>
    </form>
  );
}

export function DomainMeasurements({ domain }: { domain: Domain }) {
  const { state } = useApp();
  const today = localDate(useClock());
  const [logging, setLogging] = useState<MeasurementKind | null>(null);

  if (!domainMetrics[domain].length)
    return <p>No measurements for this domain.</p>;

  return (
    <div className={styles.measurements}>
      {domainMetrics[domain].map((kind) => {
        const metric = metrics[kind];
        const entries = (state.measurements ?? [])
          .filter((entry) => entry.kind === kind)
          .sort((a, b) => b.date.localeCompare(a.date));
        const reading =
          kind === 'weight'
            ? entries.find(({ date }) => date <= today)
            : entries.find(({ date }) => date === today);

        return (
          <section
            className={styles.metric}
            key={kind}
            aria-label={metric.label}
          >
            <div className={styles.summary}>
              <div>
                <h3>{metric.label}</h3>
                <p className={styles.recency}>
                  {metric.recency}
                  {reading && (
                    <>
                      {' '}
                      · <ReadingDate date={reading.date} />
                    </>
                  )}
                </p>
                <p className={styles.value}>
                  {reading ? formatReading(reading) : 'No entry'}
                </p>
              </div>
              <button
                className="add-button"
                type="button"
                aria-expanded={logging === kind}
                onClick={() => setLogging(logging === kind ? null : kind)}
              >
                Log {kind}
              </button>
            </div>
            {logging === kind && (
              <MeasurementForm
                kind={kind}
                entries={entries}
                today={today}
                onClose={() => setLogging(null)}
              />
            )}
            <details className={styles.history}>
              <summary>{metric.label} history</summary>
              {entries.length ? (
                <ul>
                  {entries.map((entry) => (
                    <li key={entry.date}>
                      <ReadingDate date={entry.date} />
                      <span>{formatReading(entry)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No entry</p>
              )}
            </details>
          </section>
        );
      })}
    </div>
  );
}
