import { indexById } from '../lib/options';

/**
 * `BookSerializer` uses `fields = '__all__'`, so a book arrives with `author`
 * and `category` as raw ids. Every catalog view renders names, so the join
 * happens once here instead of inside each component.
 */
export function withCatalogNames(books, authors, categories) {
  const authorsById = indexById(authors);
  const categoriesById = indexById(categories);

  return (books ?? []).map((book) => ({
    ...book,
    author_name: book.author_name ?? authorsById.get(String(book.author))?.name ?? '',
    category_name: book.category_name ?? categoriesById.get(String(book.category))?.name ?? '',
  }));
}
