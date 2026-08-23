import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { PageSpinner } from "@/components/common/PageSpinner";

// Home is the common entry point, so it ships in the main bundle.
import HomePage from "@/pages/HomePage";

// Everything else is split at the route level.
const BrowsePage = lazy(() => import("@/pages/BrowsePage"));
const ListingDetailsPage = lazy(() => import("@/pages/ListingDetailsPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallbackPage"));
const SellPage = lazy(() => import("@/pages/SellPage"));
const EditListingPage = lazy(() => import("@/pages/EditListingPage"));
const WishlistPage = lazy(() => import("@/pages/WishlistPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const MyListingsPage = lazy(() => import("@/pages/MyListingsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/listing/:listingId" element={<ListingDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Requires a session */}
          <Route element={<ProtectedRoute />}>
            <Route path="/sell" element={<SellPage />} />
            <Route path="/edit-listing/:listingId" element={<EditListingPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-listings" element={<MyListingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
