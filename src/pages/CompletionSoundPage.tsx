import { useEffect, useState } from 'react';
import { PageHeading } from '../components/ui/PageHeading';
import {
  maxCompletionSoundMB,
  prepareCompletionSound,
  readCompletionSound,
  removeCompletionSound,
  saveCompletionSound,
} from '../features/quests/completionSound';

export function CompletionSoundPage() {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void readCompletionSound().then((clip) => {
      if (active)
        setActiveSound(clip ? clip.filename || 'Saved recording' : '');
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="page">
      <PageHeading title="Completion sound" showQuestBadge={false} />
      <div className="surface form-panel">
        <label htmlFor="completion-clip">Voice recording</label>
        <input
          id="completion-clip"
          type="file"
          accept=".m4a,.mp3,.wav,audio/mp4,audio/mpeg,audio/wav"
          disabled={busy || activeSound === null}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            setError('');
            setBusy(true);
            try {
              await saveCompletionSound(file);
              setActiveSound(file.name);
            } catch (reason) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : 'Could not save the recording.',
              );
            } finally {
              setBusy(false);
            }
          }}
        />
        <p className="form-note">
          M4A, MP3, or WAV up to {maxCompletionSoundMB} MB. Saved only in this
          browser.
        </p>
        <p
          role="status"
          className="form-note"
          style={{ overflowWrap: 'anywhere' }}
        >
          {activeSound === null ? (
            'Loading sound preference…'
          ) : activeSound ? (
            <>
              Using <strong>{activeSound}</strong>
            </>
          ) : (
            'Using the default chime.'
          )}
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="actions">
          {activeSound && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await removeCompletionSound();
                  setActiveSound('');
                  setError('');
                } catch {
                  setError('Could not remove the recording.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Restore default
            </button>
          )}
          <button
            type="button"
            className="primary"
            disabled={busy}
            onClick={() => prepareCompletionSound()?.()}
          >
            Preview sound
          </button>
        </div>
      </div>
    </section>
  );
}
