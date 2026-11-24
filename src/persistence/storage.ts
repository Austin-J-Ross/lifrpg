import { decodeState, validateState } from './schema';
import { emptyState, type AppState } from '../domain/models';
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export const STORAGE_KEY = 'quest-character-v2',
  LEGACY_KEY = 'quest-character-v1',
  LEGACY_BACKUP_KEY = 'quest-character-v1-backup';
export interface LoadResult {
  state: AppState;
  error: string;
  blocked: boolean;
}
export function loadState(storage: StorageAdapter): LoadResult {
  let state = emptyState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw !== null)
      return {
        state: validateState(JSON.parse(raw)),
        error: '',
        blocked: false,
      };
    const legacy = storage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      state = decodeState(JSON.parse(legacy));
      if (storage.getItem(LEGACY_BACKUP_KEY) === null)
        storage.setItem(LEGACY_BACKUP_KEY, legacy);
      saveState(storage, state);
    }
    return { state, error: '', blocked: false };
  } catch (error) {
    return {
      state,
      error:
        (error instanceof Error ? error.message : 'Storage unavailable.') +
        ' Automatic saving is paused; export your progress or import a valid backup.',
      blocked: true,
    };
  }
}
export function saveState(storage: StorageAdapter, state: AppState) {
  storage.setItem(STORAGE_KEY, JSON.stringify(validateState(state)));
}
export function importState(
  storage: StorageAdapter,
  text: string,
  now: number,
): AppState {
  const state = decodeState(JSON.parse(text));
  const current = storage.getItem(STORAGE_KEY);
  if (current !== null)
    storage.setItem(STORAGE_KEY + '-before-import-' + now, current);
  saveState(storage, state);
  return state;
}
export function originalSave(storage: StorageAdapter): string {
  return storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_KEY) ?? '';
}
