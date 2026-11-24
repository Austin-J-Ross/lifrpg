import { describe, it, expect } from 'vitest';
import legacy from '../../tests/fixtures/legacy-v1.json';
import { decodeState, validateState } from './schema';
import {
  loadState,
  saveState,
  importState,
  STORAGE_KEY,
  LEGACY_KEY,
  LEGACY_BACKUP_KEY,
  type StorageAdapter,
} from './storage';
class MemoryStorage implements StorageAdapter {
  values = new Map<string, string>();
  getItem(k: string) {
    return this.values.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.values.set(k, v);
  }
}
describe('saved data', () => {
  it('converts numeric indexes and named skills to stable IDs preserving XP', () => {
    const state = decodeState(legacy);
    expect(state.classes[0].skills[0].xp).toBe(640);
    expect(state.quests[0].classId).toBe(state.classes[0].id);
    expect(state.quests[0].skillId).toBe(state.classes[0].skills[0].id);
    expect(decodeState(state)).toEqual(state);
  });
  it('backs up the exact legacy payload before writing v2', () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify(legacy);
    storage.setItem(LEGACY_KEY, raw);
    const result = loadState(storage);
    expect(result.blocked).toBe(false);
    expect(storage.getItem(LEGACY_KEY)).toBe(raw);
    expect(storage.getItem(LEGACY_BACKUP_KEY)).toBe(raw);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!)).toEqual(result.state);
  });
  it.each(['{bad', '{"version":99}'])(
    'retains malformed or unsupported current saves: %s',
    (raw) => {
      const storage = new MemoryStorage();
      storage.setItem(STORAGE_KEY, raw);
      const result = loadState(storage);
      expect(result.blocked).toBe(true);
      expect(storage.getItem(STORAGE_KEY)).toBe(raw);
    },
  );
  it('preserves migrated state in memory when migration backup cannot be written', () => {
    const raw = JSON.stringify(legacy);
    const storage = {
      getItem: (k: string) => (k === LEGACY_KEY ? raw : null),
      setItem: () => {
        throw Error('quota');
      },
    };
    const result = loadState(storage);
    expect(result.blocked).toBe(true);
    expect(result.state.classes).toHaveLength(7);
  });
  it('handles denied storage access', () => {
    expect(
      loadState({
        getItem: () => {
          throw Error('denied');
        },
        setItem() {},
      }).blocked,
    ).toBe(true);
  });
  it('does not write invalid relationships or duplicate IDs', () => {
    const state = decodeState(legacy);
    state.quests[0].skillId = 'missing';
    const storage = new MemoryStorage();
    expect(() => saveState(storage, state)).toThrow();
    expect(storage.values.size).toBe(0);
    state.quests = [];
    state.classes[1].id = state.classes[0].id;
    expect(() => validateState(state)).toThrow();
  });
  it('backs up even malformed prior data when explicitly importing recovery data', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, 'original malformed value');
    const state = importState(storage, JSON.stringify(legacy), 123);
    expect(storage.getItem(STORAGE_KEY + '-before-import-123')).toBe(
      'original malformed value',
    );
    expect(loadState(storage).state).toEqual(state);
  });
  it('leaves old data unchanged if import backup fails', () => {
    const original = JSON.stringify(decodeState(legacy));
    const storage = {
      getItem: () => original,
      setItem: () => {
        throw Error('quota');
      },
    };
    expect(() => importState(storage, JSON.stringify(legacy), 123)).toThrow();
    expect(storage.getItem()).toBe(original);
  });
});

it('fills missing optional legacy profile fields without discarding the name', () => {
  const state = decodeState({ ...legacy, profile: { firstName: 'Archived' } });
  expect(state.profile).toEqual({
    firstName: 'Archived',
    lastName: '',
    pronouns: '',
    location: '',
    bio: '',
  });
});
