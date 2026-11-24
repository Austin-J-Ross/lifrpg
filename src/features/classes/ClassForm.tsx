import { createId } from '../../domain/identity';
import { useState, type FormEvent } from 'react';
import { useApp } from '../../state/AppProvider';
import {
  categories,
  domainNames,
  type Category,
  type Domain,
} from '../../domain/models';
import { classDomain } from '../../domain/definitions';
import { Modal } from '../../components/ui/Modal';
export function ClassForm({ onClose }: { onClose: () => void }) {
  const { send, notify } = useApp();
  const [name, setName] = useState(''),
    [category, setCategory] = useState<Category>('personal'),
    [domain, setDomain] = useState<Domain>('Physical'),
    [summary, setSummary] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    if (
      send({
        type: 'class/create',
        id: createId(),
        skillId: createId(),
        name,
        category,
        domain,
        summary,
      })
    ) {
      notify(name.trim() + ' created with the General skill.');
      onClose();
    }
  }
  return (
    <Modal title="A new class" onClose={onClose}>
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
          Linked domain <strong>{classDomain(category, domain)}</strong>
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
        <p className="form-note">Starts at level 1 with a General skill.</p>
        <div className="actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary">Create Class</button>
        </div>
      </form>
    </Modal>
  );
}
