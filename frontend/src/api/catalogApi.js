import { createResourceApi } from './createResourceApi';
import { endpoints } from './endpoints';

/**
 * Books, authors and categories are the same resource shape as far as the
 * transport is concerned, so they are declarations rather than code. All three
 * now expose the full surface — the backend grew detail routes for authors and
 * categories, so nothing here needs to trim `operations` any more.
 */
export const bookApi = createResourceApi({
  listPath: endpoints.books.list,
  detailPath: endpoints.books.detail,
});

export const authorApi = createResourceApi({
  listPath: endpoints.authors.list,
  detailPath: endpoints.authors.detail,
});

export const categoryApi = createResourceApi({
  listPath: endpoints.categories.list,
  detailPath: endpoints.categories.detail,
});
