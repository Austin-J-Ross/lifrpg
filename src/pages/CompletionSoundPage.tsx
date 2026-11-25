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
  const [hasClip, setHasClip] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void readCompletionSound().then((clip) => {
      if (active) setHasClip(Boolean(clip));
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
          disabled={busy || hasClip === null}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            setError('');
            setBusy(true);
            try {
              await saveCompletionSound(file);
              setHasClip(true);
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
        <p role="status" className="form-note">
          {hasClip === null
            ? 'Loading sound preference…'
            : hasClip
              ? 'Using your recording.'
              : 'Using the default chime.'}
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="actions">
          {hasClip && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await removeCompletionSound();
                  setHasClip(false);
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
