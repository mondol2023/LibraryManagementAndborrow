import { useQuery } from './useQuery';
import { dashboardApi } from '../api/dashboardApi';

const EMPTY_PANELS = Object.freeze({});

/**
 * The whole dashboard in one request.
 *
 * `DashboardService.resolve` drops any panel the signed-in role may not see, so
 * the page can ask for the full layout and simply render what comes back. That
 * keeps the role rules on the server and out of the component tree.
 */
export function useDashboard({ panels, limit } = {}) {
  const key = Array.isArray(panels) ? panels.join(',') : (panels ?? '');

  const query = useQuery(() => dashboardApi.summary({ panels, limit }), [key, limit]);

  const byName = query.data?.panels ?? EMPTY_PANELS;

  return {
    role: query.data?.role ?? null,
    panels: byName,
    /** The panels the server actually returned, in the order it listed them. */
    names: Object.keys(byName),
    panel: (name) => byName[name] ?? null,
    data: (name) => byName[name]?.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
