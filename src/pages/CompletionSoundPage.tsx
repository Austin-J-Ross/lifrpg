import { useState } from 'react';
import { PageHeading } from '../components/ui/PageHeading';
import {
  prepareCompletionSound,
  readCompletionSound,
  removeCompletionSound,
  saveCompletionSound,
} from '../features/quests/completionSound';

export function CompletionSoundPage() {
  const [clip, setClip] = useState(readCompletionSound);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <section className="page">
      <PageHeading title="Completion sound" showQuestBadge={false} />
      <div className="surface form-panel">
        <label htmlFor="completion-clip">Voice recording</label>
        <input
          id="completion-clip"
          type="file"
          accept=".m4a,.mp3,.wav,audio/mp4,audio/mpeg,audio/wav"
          disabled={busy}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            setError('');
            setBusy(true);
            try {
              setClip(await saveCompletionSound(file));
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
          M4A, MP3, or WAV up to 512 KB. Saved only in this browser.
        </p>
        <p role="status" className="form-note">
          {clip ? 'Using your recording.' : 'Using the default chime.'}
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="actions">
          {clip && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                try {
                  removeCompletionSound();
                  setClip(null);
                  setError('');
                } catch {
                  setError('Could not remove the recording.');
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
