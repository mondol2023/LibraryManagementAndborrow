import { useAuth } from '../../hooks/useAuth';

/**
 * Inline counterpart to ProtectedRoute for a single button or column:
 * `<RoleGate permission={Permission.VERIFY_BORROWS}>…</RoleGate>`.
 */
export function RoleGate({ permission, fallback = null, children }) {
  const { can } = useAuth();
  if (permission && !can(permission)) return fallback;
  return children;
}
