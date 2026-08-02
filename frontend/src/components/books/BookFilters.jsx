import { Input, Select } from '../ui';
import { toOptions } from '../../lib/options';

/**
 * A controlled filter bar. It owns no state — the page holds the filter object
 * and this only renders it, which keeps the filtering logic testable on its own.
 */
export function BookFilters({ filters, onChange, authors, categories }) {
  const update = (key) => (event) => onChange({ ...filters, [key]: event.target.value });

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Input
        type="search"
        value={filters.q}
        onChange={update('q')}
        placeholder="Search title or description…"
        aria-label="Search books"
        className="sm:col-span-2"
      />

      <Select
        value={filters.author}
        onChange={update('author')}
        placeholder="All authors"
        options={toOptions(authors, 'name')}
        aria-label="Filter by author"
      />

      <Select
        value={filters.category}
        onChange={update('category')}
        placeholder="All categories"
        options={toOptions(categories, 'name')}
        aria-label="Filter by category"
      />
    </div>
  );
}

export const EMPTY_BOOK_FILTERS = Object.freeze({ q: '', author: '', category: '' });

/**
 * The backend list endpoint returns everything, so narrowing happens here.
 * Written once and reused by the catalog page and the borrow dialog.
 */
export function filterBooks(books, filters) {
  const term = filters.q.trim().toLowerCase();

  return (books ?? []).filter((book) => {
    if (filters.author && String(book.author) !== String(filters.author)) return false;
    if (filters.category && String(book.category) !== String(filters.category)) return false;
    if (!term) return true;
    return [book.title, book.description, book.author_name, book.category_name]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(term));
  });
}
