import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingBlock } from '../ui';
import { ForbiddenNotice } from './ForbiddenNotice';

/**
 * Route-level authorisation. Pages themselves contain no auth checks — they are
 * only ever mounted behind this, which keeps "who may see it" beside the route
 * table rather than scattered through the views.
 */
export function ProtectedRoute({ permission, children }) {
  const { isAuthenticated, isLoading, can } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingBlock label="Restoring your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (permission && !can(permission)) return <ForbiddenNotice />;

  return children ?? <Outlet />;
}

/** Keeps signed-in users away from the login/register screens. */
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingBlock label="Restoring your session…" />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return children ?? <Outlet />;
}
