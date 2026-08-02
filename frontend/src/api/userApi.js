import { http } from './client';
import { endpoints } from './endpoints';

/**
 * Account administration.
 *
 * Deliberately not built on `createResourceApi`: the users endpoints do not
 * speak the same dialect as the catalogue ones — the list is paginated, edits
 * are PATCH rather than PUT, deletion is a soft deactivation, and there are two
 * side actions (approve, penalties) with no catalogue equivalent.
 */
export const userApi = {
  /**
   * -> `{ count, page, page_size, num_pages, results }`.
   * Filters: `q`, `role`, `is_active`, `page`, `page_size`. Librarians only.
   */
  list: (params, options) => http.get(endpoints.users.list, { ...options, params }),

  /** Admin-only. Reuses the register serializer; the account starts active. */
  create: (payload, options) => http.post(endpoints.users.list, payload, options),

  /** Self, or any account a librarian may see. */
  retrieve: (userId, options) => http.get(endpoints.users.detail(userId), options),

  /** Admin edits any field; a member may only PATCH their own profile. */
  update: (userId, payload, options) =>
    http.patch(endpoints.users.detail(userId), payload, options),

  /** Soft delete — the account is deactivated, never dropped. Admin only. */
  deactivate: (userId, options) => http.delete(endpoints.users.detail(userId), options),

  /** Flips a pending admin/staff sign-up to active. Admin only. */
  approve: (userId, options) => http.post(endpoints.users.approve(userId), undefined, options),

  /** The signed-in account, straight from the API rather than the token. */
  me: (options) => http.get(endpoints.users.me, options),

  updateMe: (payload, options) => http.patch(endpoints.users.me, payload, options),

  /** -> `{ id, username, penalty_points }`. Self, or anyone if a librarian. */
  penalties: (userId, options) => http.get(endpoints.users.penalties(userId), options),

  /**
   * Admin only. Send exactly one of `{ penalty_points }` (absolute) or
   * `{ delta }` (relative, clamped at zero) — the serializer rejects both.
   */
  adjustPenalties: (userId, payload, options) =>
    http.post(endpoints.users.penalties(userId), payload, options),
};
