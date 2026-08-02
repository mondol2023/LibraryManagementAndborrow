import { useCallback, useState } from 'react';
import { useQuery } from './useQuery';
import { borrowApi } from '../api/borrowApi';
import { EMPTY_BORROW_FILTERS, toBorrowQuery } from '../components/borrow/BorrowFilters';

/** Shared so an empty result keeps a stable identity across renders. */
const EMPTY = Object.freeze([]);

/**
 * A filtered borrow list plus its filter state.
 *
 * "My borrows" and the admin queue are the same query with different starting
 * filters and different columns, so only the columns live in the pages.
 */
export function useBorrowList(initialFilters = EMPTY_BORROW_FILTERS) {
  const [filters, setFilters] = useState(initialFilters);

  const query = useQuery(() => borrowApi.list(toBorrowQuery(filters)), [filters]);

  const reset = useCallback(() => setFilters(initialFilters), [initialFilters]);

  return {
    filters,
    setFilters,
    reset,
    rows: query.data ?? EMPTY,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
