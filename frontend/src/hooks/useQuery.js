import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reads data for a component: runs `fetcher`, tracks loading/error/data, and
 * refetches when `deps` change.
 *
 * Written once so that no page repeats the same three `useState` calls, the
 * same try/catch, and the same "ignore the response if the component
 * unmounted" guard.
 */
export function useQuery(fetcher, deps = [], { enabled = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(enabled);

  // Only the newest run may write to state — protects against out-of-order
  // responses when deps change quickly (e.g. typing in a filter).
  const runIdRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const runId = ++runIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      if (runId === runIdRef.current) setData(result);
    } catch (caught) {
      if (caught?.name === 'AbortError') return;
      if (runId === runIdRef.current) setError(caught);
    } finally {
      if (runId === runIdRef.current) setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
    return () => {
      // Invalidate any in-flight run belonging to this effect.
      runIdRef.current += 1;
    };
  }, [run]);

  return { data, error, isLoading, refetch: run, setData };
}
