import { useCallback } from 'react';
import { useQuery } from './useQuery';
import { authorApi, categoryApi } from '../api/catalogApi';

/** Shared so an empty result keeps a stable identity across renders. */
const EMPTY = Object.freeze([]);

/**
 * The two reference tables a book points at. Kept apart from the books query so
 * the detail page and the catalog admin page can pull just the lookups.
 */
export function useLookups() {
  const authors = useQuery(() => authorApi.list(), []);
  const categories = useQuery(() => categoryApi.list(), []);

  const refetch = useCallback(() => {
    authors.refetch();
    categories.refetch();
  }, [authors.refetch, categories.refetch]);

  return {
    authors: authors.data ?? EMPTY,
    categories: categories.data ?? EMPTY,
    isLoading: authors.isLoading || categories.isLoading,
    error: authors.error ?? categories.error,
    refetch,
    refetchAuthors: authors.refetch,
    refetchCategories: categories.refetch,
  };
}
