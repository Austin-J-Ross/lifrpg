import { useEffect, useState, type FormEvent } from 'react';
import { useApp } from '../../state/AppProvider';
import type { Profile } from '../../domain/models';
import { maxPortraitUploadBytes, readPortraitUpload } from './portraitUpload';
export function ProfileForm() {
  const { state, send, notify } = useApp();
  const [profile, setProfile] = useState<Profile>(state.profile);
  const [photoError, setPhotoError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => setProfile(state.profile), [state.profile]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('portrait') as HTMLInputElement;
    const file = input.files?.[0];
    setPhotoError('');
    if (
      file &&
      (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > maxPortraitUploadBytes ||
        !file.size)
    ) {
      setPhotoError('Choose a JPEG, PNG, or WebP photo up to 5 MB.');
      return;
    }
    setSaving(true);
    try {
      const updated = { ...profile };
      if (file) updated.portrait = await readPortraitUpload(file);
      if (send({ type: 'profile/save', profile: updated })) {
        input.value = '';
        notify('Profile saved.');
      }
    } catch {
      setPhotoError('The photo could not be read. Choose it again and retry.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <form className="surface form-panel" onSubmit={submit}>
      <div className="form-grid">
        {(['firstName', 'lastName'] as const).map((key) => (
          <label key={key}>
            {key === 'firstName'
              ? 'First name (optional)'
              : 'Last name (optional)'}
            <input
              name={key}
              value={profile[key]}
              onChange={(e) =>
                setProfile({ ...profile, [key]: e.target.value })
              }
              maxLength={40}
              autoComplete={key === 'firstName' ? 'given-name' : 'family-name'}
            />
          </label>
        ))}
      </div>
      <label>
        Full-body photo (optional)
        <input
          id="profile-portrait"
          name="portrait"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby="profile-photo-formats"
          disabled={saving}
        />
      </label>
      <p id="profile-photo-formats" className="form-note">
        JPEG, PNG, or WebP up to 5 MB.
      </p>
      {profile.portrait && (
        <button
          className="small-button"
          type="button"
          disabled={saving}
          onClick={() => {
            const updated = { ...profile };
            delete updated.portrait;
            setProfile(updated);
          }}
        >
          Remove current photo
        </button>
      )}
      {photoError && (
        <p className="form-note" role="alert">
          {photoError}
        </p>
      )}
      <div className="actions">
        <button className="primary" disabled={saving}>
          Save profile
        </button>
      </div>
    </form>
  );
}
