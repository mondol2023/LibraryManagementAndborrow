import { useEffect, useState } from 'react';
import { useQuery } from './useQuery';

/** Shared so an empty page keeps a stable identity across renders. */
const EMPTY = Object.freeze([]);

/** Matches `core.pagination.DEFAULT_PAGE_SIZE`. */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * A page of a `core.pagination.paginate()` envelope:
 * `{ count, page, page_size, num_pages, results }`.
 *
 * Owns the page number so no list screen repeats "reset to page one whenever a
 * filter changes", and returns the flat shape `<Pagination>` already consumes.
 * `fetchPage` receives `{ page, page_size }` and is free to merge its own
 * filters in — this hook never knows what is being listed.
 */
export function usePaginatedList(fetchPage, deps = [], { pageSize = DEFAULT_PAGE_SIZE, enabled = true } = {}) {
  const [page, setPage] = useState(1);

  // Page 7 of the previous result set means nothing against new filters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), deps);

  const query = useQuery(
    () => fetchPage({ page, page_size: pageSize }),
    [...deps, page, pageSize],
    { enabled },
  );

  const envelope = query.data;

  return {
    rows: envelope?.results ?? EMPTY,
    total: envelope?.count ?? 0,
    numPages: envelope?.num_pages ?? 0,
    // Trust the server's echo of the page it actually served.
    page: envelope?.page ?? page,
    pageSize: envelope?.page_size ?? pageSize,
    setPage,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
