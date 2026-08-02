import { http } from './client';
import { endpoints } from './endpoints';

/** Resource names registered in the backend's `search.resources`. */
export const SearchResource = Object.freeze({
  BOOKS: 'books',
  USERS: 'users',
});

export const searchApi = {
  /** Resources this caller is allowed to search, per `SearchAccessPolicy`. */
  index: (options) =>
    http.get(endpoints.search.index, options).then((payload) => payload?.resources ?? []),

  /** -> `{ resource, query, page, page_size, total, results }`. */
  query: (resource, { q, page = 1, pageSize = 20 } = {}, options) =>
    http.get(endpoints.search.resource(resource), {
      ...options,
      params: { q, page, page_size: pageSize },
    }),
};
