/**
 * The only module that knows *where* tokens live.
 *
 * `createTokenStorage` takes the backing store as a parameter, so the HTTP
 * client depends on the small read/write contract rather than on
 * `window.localStorage` (swap in sessionStorage or an in-memory store for
 * tests without touching a single caller).
 */
const ACCESS_KEY = 'library.access';
const REFRESH_KEY = 'library.refresh';

const memoryBackend = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
};

const safeLocalStorage = () => {
  try {
    const probe = '__library_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    // Private-mode / disabled storage: degrade to a session-lived store.
    return memoryBackend();
  }
};

export function createTokenStorage(backend = safeLocalStorage()) {
  return {
    getAccess: () => backend.getItem(ACCESS_KEY),
    getRefresh: () => backend.getItem(REFRESH_KEY),

    set({ access, refresh }) {
      if (access) backend.setItem(ACCESS_KEY, access);
      if (refresh) backend.setItem(REFRESH_KEY, refresh);
    },

    clear() {
      backend.removeItem(ACCESS_KEY);
      backend.removeItem(REFRESH_KEY);
    },
  };
}

export const tokenStorage = createTokenStorage();
