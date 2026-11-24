import { createId } from '../../domain/identity';
import { useState, type FormEvent } from 'react';
import { useApp } from '../../state/AppProvider';
import {
  categories,
  domainNames,
  type Category,
  type Domain,
  type CharacterClass,
} from '../../domain/models';
import { classDomain } from '../../domain/definitions';
import { Modal } from '../../components/ui/Modal';
import { MAX_CLASS_LEVEL } from '../../domain/progression';
export function ClassForm({
  onClose,
  entry,
}: {
  onClose: () => void;
  entry?: CharacterClass;
}) {
  const { send, notify, notice } = useApp();
  const [showError, setShowError] = useState(false);
  const [name, setName] = useState(entry?.name ?? ''),
    [category, setCategory] = useState<Category>(entry?.category ?? 'personal'),
    [domain, setDomain] = useState<Domain>(entry?.domain ?? 'Physical'),
    [summary, setSummary] = useState(entry?.summary ?? ''),
    [level, setLevel] = useState(String(entry?.level ?? 1));
  const linkedDomain =
    entry && category === entry.category && domain === entry.domain
      ? entry.domain
      : classDomain(category, domain);
  function submit(e: FormEvent) {
    e.preventDefault();
    const fields = { name, category, domain, summary };
    if (
      send(
        entry
          ? {
              type: 'class/edit',
              id: entry.id,
              level: Number(level),
              ...fields,
            }
          : {
              type: 'class/create',
              id: createId(),
              skillId: createId(),
              ...fields,
            },
      )
    ) {
      notify(
        entry
          ? name.trim() + ' updated.'
          : name.trim() + ' created with the General skill.',
      );
      onClose();
    } else {
      setShowError(true);
    }
  }
  return (
    <Modal title={entry ? 'Edit class' : 'A new class'} onClose={onClose}>
      <form onSubmit={submit}>
        <label>
          Class name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
            autoFocus
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </label>
        {category === 'general' && (
          <label>
            General class domain
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as Domain)}
            >
              {domainNames.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
        )}
        <p className="domain-link">
          Linked domain <strong>{linkedDomain}</strong>
        </p>
        <label>
          Summary
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={180}
            rows={3}
          />
        </label>
        {entry ? (
          <label>
            Class level
            <input
              type="number"
              min={1}
              max={Math.max(MAX_CLASS_LEVEL, entry.level)}
              step={1}
              required
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
          </label>
        ) : (
          <p className="form-note">Starts at level 1 with a General skill.</p>
        )}
        {showError && notice && <p role="alert">{notice}</p>}
        <div className="actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary">
            {entry ? 'Save class' : 'Create Class'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
