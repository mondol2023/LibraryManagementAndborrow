import { useCallback, useMemo } from 'react';
import { useQuery } from './useQuery';
import { useLookups } from './useLookups';
import { bookApi } from '../api/catalogApi';
import { withCatalogNames } from '../domain/books';

/**
 * Books plus the two lookup tables they reference, already joined.
 *
 * Three pages need exactly this trio; owning the composition here means none of
 * them repeats the fetching, the joining or the combined loading flag.
 */
export function useCatalog() {
  const books = useQuery(() => bookApi.list(), []);
  const lookups = useLookups();

  const enrichedBooks = useMemo(
    () => withCatalogNames(books.data, lookups.authors, lookups.categories),
    [books.data, lookups.authors, lookups.categories],
  );

  const refetch = useCallback(() => {
    books.refetch();
    lookups.refetch();
  }, [books.refetch, lookups.refetch]);

  return {
    books: enrichedBooks,
    authors: lookups.authors,
    categories: lookups.categories,
    isLoading: books.isLoading || lookups.isLoading,
    error: books.error ?? lookups.error,
    refetch,
    refetchBooks: books.refetch,
  };
}
