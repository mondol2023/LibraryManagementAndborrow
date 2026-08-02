import { useCallback, useRef, useState } from 'react';

/**
 * Writes data on demand: the counterpart to `useQuery`. Owns the pending flag
 * and the error, and never throws at the call site unless you ask it to —
 * `mutate` resolves to `{ ok, data, error }`.
 */
export function useMutation(mutationFn, { onSuccess, onError } = {}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const callbacksRef = useRef({ mutationFn, onSuccess, onError });
  callbacksRef.current = { mutationFn, onSuccess, onError };

  const mutate = useCallback(async (...args) => {
    setIsPending(true);
    setError(null);

    try {
      const data = await callbacksRef.current.mutationFn(...args);
      callbacksRef.current.onSuccess?.(data, ...args);
      return { ok: true, data, error: null };
    } catch (caught) {
      if (mountedRef.current) setError(caught);
      callbacksRef.current.onError?.(caught, ...args);
      return { ok: false, data: null, error: caught };
    } finally {
      if (mountedRef.current) setIsPending(false);
    }
  }, []);

  const reset = useCallback(() => setError(null), []);

  return { mutate, isPending, error, reset };
}
