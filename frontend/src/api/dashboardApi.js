import { http } from './client';
import { endpoints } from './endpoints';

/**
 * The reporting endpoints.
 *
 * The backend already filters panels by role and silently drops any the caller
 * may not see, so the client can ask for one layout and let the server decide
 * what comes back. Nothing here needs to know which role gets which panel.
 */
export const dashboardApi = {
  /**
   * -> `{ role, panels: { <name>: { name, title, description, data } } }`.
   * `panels` is a list of names (joined for the API), `limit` caps row counts
   * inside each panel (1–50).
   */
  summary: ({ panels, limit } = {}, options) =>
    http.get(endpoints.dashboard.all, {
      ...options,
      params: {
        panels: Array.isArray(panels) ? panels.join(',') : panels,
        limit,
      },
    }),

  /** -> `{ panels: [{ name, title, description }] }` — what this role may see. */
  index: (options) => http.get(endpoints.dashboard.panels, options),

  /** -> a single `{ name, title, description, data }`. 403 if off-limits. */
  panel: (name, { limit } = {}, options) =>
    http.get(endpoints.dashboard.panel(name), { ...options, params: { limit } }),
};
