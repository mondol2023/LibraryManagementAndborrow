import { http } from './client';
import { endpoints } from './endpoints';

/**
 * Borrow does not follow the CRUD dialect — the list comes back wrapped and
 * the state changes are two bespoke endpoints — so it gets a hand-written
 * module instead of being forced through `createResourceApi`.
 */
export const borrowApi = {
  /**
   * `BorrowBookAPIView.get` answers `{ status, data: [...] }`; unwrap it here
   * so every caller receives a plain array.
   * Supported filters: user, status, from_date, to_date, book.
   * Non-admins are scoped to their own rows server-side regardless.
   */
  list: (filters, options) =>
    http
      .get(endpoints.borrow.list, { ...options, params: filters })
      .then((payload) => payload?.data ?? []),

  /** `user_id` is admin-only: it borrows on someone else's behalf. */
  create: ({ bookId, userId }, options) =>
    http.post(
      endpoints.borrow.create,
      { book_id: bookId, ...(userId ? { user_id: userId } : {}) },
      options,
    ),

  /** decision: 'accepted' | 'rejected' | 'cancelled'. Admin only. */
  verify: (id, decision, options) =>
    http.put(endpoints.borrow.verify(id), { status: decision }, options),

  returnBook: (borrowId, options) =>
    http.post(endpoints.borrow.return, { borrow_id: borrowId }, options),
};
