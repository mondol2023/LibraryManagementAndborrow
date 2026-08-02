/**
 * Tiny pub/sub. Lets the HTTP client announce "this session is dead" without
 * importing React state — the auth provider subscribes instead. Keeps the
 * dependency pointing at an abstraction rather than at the UI layer.
 */
export function createEmitter() {
  const listeners = new Set();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(payload) {
      listeners.forEach((listener) => listener(payload));
    },
  };
}
