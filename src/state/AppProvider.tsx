import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppState } from '../domain/models';
import {
  advanceDomainHealth,
  nextHealthBoundary,
} from '../domain/domainHealth';
import { reduceState, type Action } from './reducer';
import {
  loadState,
  saveState,
  importState,
  originalSave,
  type StorageAdapter,
} from '../persistence/storage';
const browserStorage: StorageAdapter = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};
interface ContextValue {
  state: AppState;
  send: (action: Action) => boolean;
  notify: (message: string) => void;
  notice: string;
  storageError: string;
  importData: (text: string) => void;
  exportOriginal: () => string;
  demo: boolean;
}
const AppContext = createContext<ContextValue | null>(null);
function sessionReducer(
  session: { data: AppState; error: string },
  update: { action?: Action; at: number },
) {
  try {
    const { action, at } = update;
    const data =
      action?.type === 'state/import'
        ? advanceDomainHealth(reduceState(session.data, action), at)
        : advanceDomainHealth(session.data, at);
    if (!action) return data === session.data ? session : { ...session, data };
    return {
      data: action.type === 'state/import' ? data : reduceState(data, action),
      error: '',
    };
  } catch (error) {
    return {
      ...session,
      error: error instanceof Error ? error.message : 'Could not apply change.',
    };
  }
}
export function AppProvider({
  children,
  storage = browserStorage,
  demoState,
}: {
  children: ReactNode;
  storage?: StorageAdapter;
  demoState?: AppState;
}) {
  const [initial] = useState(() =>
    demoState
      ? {
          state: demoState,
          error: 'Demo session: changes are not saved.',
          blocked: true,
        }
      : loadState(storage),
  );
  const [session, dispatch] = useReducer(sessionReducer, {
    data: initial.state,
    error: '',
  });
  const [storageError, setStorageError] = useState(initial.error);
  const [blocked, setBlocked] = useState(initial.blocked);
  const [notice, setNotice] = useState('');
  const saved = useRef(initial.state);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function refresh() {
      clearTimeout(timer);
      const at = Date.now();
      dispatch({ at });
      const next = Math.min(
        nextHealthBoundary(at, 0),
        nextHealthBoundary(at, 7),
      );
      timer = setTimeout(refresh, next - at);
    }
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  useEffect(() => {
    if (saved.current === session.data) return;
    saved.current = session.data;
    if (blocked) return;
    try {
      saveState(storage, session.data);
      setStorageError('');
    } catch {
      setStorageError(
        'Browser storage is unavailable. Changes remain in this session; export a backup to keep them.',
      );
    }
  }, [session.data, blocked, storage]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  function send(action: Action) {
    try {
      const at = Date.now();
      reduceState(advanceDomainHealth(session.data, at), action);
      dispatch({ action, at });
      return true;
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Could not apply change.',
      );
      return false;
    }
  }
  function importData(text: string) {
    try {
      if (demoState) throw Error('Leave the demo to import saved progress.');
      const at = Date.now();
      const state = importState(storage, text, at);
      saved.current = state;
      dispatch({ action: { type: 'state/import', state }, at });
      setBlocked(false);
      setStorageError('');
      setNotice('Backup imported.');
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Import failed; existing data was retained.',
      );
    }
  }
  return (
    <AppContext.Provider
      value={{
        state: session.data,
        send,
        notify: setNotice,
        notice: session.error || notice,
        storageError,
        importData,
        exportOriginal: () => originalSave(storage),
        demo: !!demoState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw Error('AppProvider is missing.');
  return context;
}
