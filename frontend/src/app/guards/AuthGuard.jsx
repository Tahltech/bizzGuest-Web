import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/** Blocks the route tree until a session is confirmed — server-verified via /auth/me on refresh, not just local state. */
export function AuthGuard() {
  const { user, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <div className="flex min-h-screen items-center justify-center text-ink-soft">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

/**
 * Gates a route tree behind a permission slug. This is a UX courtesy only —
 * every underlying API call is independently authorized by the backend's
 * requirePermission middleware, per architecture §3/§15.
 */
export function PermissionGuard({ permission, children }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
