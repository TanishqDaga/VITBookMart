import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageSpinner } from "@/components/common/PageSpinner";

/**
 * Gate for routes that need a session.
 *
 * This is UX, not security — the backend authorises every request itself. The
 * intended path is preserved in location.state so the user lands back where they
 * were trying to go after signing in.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isInitialising } = useAuth();
  const location = useLocation();

  // Don't bounce someone to /login while we're still validating a stored session.
  if (isInitialising) return <PageSpinner label="Checking your session" />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
