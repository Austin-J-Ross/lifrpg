import { useEffect, useState, type FormEvent } from 'react';
import { useApp } from '../../state/AppProvider';
import type { Profile } from '../../domain/models';
export function ProfileForm() {
  const { state, send, notify, storageError } = useApp();
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
        file.size > 1048576 ||
        !file.size)
    ) {
      setPhotoError('Choose a JPEG, PNG, or WebP photo up to 1 MB.');
      return;
    }
    setSaving(true);
    try {
      const updated = { ...profile };
      if (file) {
        updated.portrait = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
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
        {(['firstName', 'lastName', 'pronouns', 'location'] as const).map(
          (key) => (
            <label key={key}>
              {
                {
                  firstName: 'First name',
                  lastName: 'Last name',
                  pronouns: 'Pronouns',
                  location: 'Location',
                }[key]
              }
              <input
                name={key}
                value={profile[key]}
                onChange={(e) =>
                  setProfile({ ...profile, [key]: e.target.value })
                }
                maxLength={key === 'location' ? 80 : 40}
                required={key === 'firstName'}
                autoComplete={
                  key === 'firstName'
                    ? 'given-name'
                    : key === 'lastName'
                      ? 'family-name'
                      : key === 'location'
                        ? 'address-level2'
                        : undefined
                }
              />
            </label>
          ),
        )}
      </div>
      <label>
        A little about you
        <textarea
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          rows={4}
          maxLength={300}
        />
      </label>
      <label>
        Full-body photo (optional)
        <input
          id="profile-portrait"
          name="portrait"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={saving}
        />
      </label>
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
      <p className="form-note">
        {storageError ||
          'Saved in this browser. Filled-in details appear on Home.'}
      </p>
      <div className="actions">
        <button className="primary" disabled={saving}>
          Save profile
        </button>
      </div>
    </form>
  );
}
