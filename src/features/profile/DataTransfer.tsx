import { useState } from 'react';
import { useApp } from '../../state/AppProvider';
import { decodeState } from '../../persistence/schema';
import { Modal } from '../../components/ui/Modal';
function download(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function DataTransfer() {
  const { state, importData, exportOriginal, notify, demo } = useApp();
  const [pending, setPending] = useState('');
  return (
    <section className="surface transfer-panel">
      <h2>Transfer your data</h2>
      <p className="quest-intro">
        Export a backup or import progress from another browser or address.
      </p>
      <button
        type="button"
        className="small-button"
        onClick={() =>
          download(JSON.stringify(state, null, 2), 'quest-backup.json')
        }
      >
        Export backup
      </button>
      {!demo && (
        <button
          type="button"
          className="small-button"
          onClick={() => {
            try {
              const raw = exportOriginal();
              if (raw) download(raw, 'quest-original-save.json');
              else notify('No original save found.');
            } catch {
              notify('Original browser storage is unavailable.');
            }
          }}
        >
          Export original save
        </button>
      )}
      <label className="import-label">
        Import backup
        <input
          type="file"
          accept="application/json,.json"
          disabled={demo}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              if (file.size > 5_000_000) throw Error('Backup is too large.');
              const text = await file.text();
              decodeState(JSON.parse(text));
              setPending(text);
            } catch (error) {
              notify(
                error instanceof Error ? error.message : 'Invalid backup.',
              );
            }
          }}
        />
      </label>
      {pending && (
        <Modal title="Replace current progress?" onClose={() => setPending('')}>
          <p>
            Export your current progress first if you want a separate copy. The
            original stored save will also be backed up before replacement.
          </p>
          <div className="actions">
            <button onClick={() => setPending('')}>Cancel</button>
            <button
              className="primary"
              onClick={() => {
                importData(pending);
                setPending('');
              }}
            >
              Import backup
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
