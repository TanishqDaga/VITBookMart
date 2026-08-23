import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { PageSpinner } from "@/components/ui/States";

/**
 * UX gate only. Every /api/admin/** route is guarded server-side by
 * hasRole("ADMIN"), which is granted only for a type=ADMIN_ACCESS token.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isInitialising } = useAdminAuth();
  const location = useLocation();

  if (isInitialising) return <PageSpinner label="Checking your session" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <Outlet />;
}
