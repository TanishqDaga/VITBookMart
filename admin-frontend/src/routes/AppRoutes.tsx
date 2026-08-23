import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { PageSpinner } from "@/components/ui/States";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const ListingsPage = lazy(() => import("@/pages/ListingsPage"));
const AdminsPage = lazy(() => import("@/pages/AdminsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Login sits outside the shell — it has its own full-page treatment. */}
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/admins" element={<AdminsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
