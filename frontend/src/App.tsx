import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/context/AuthContext";
import { AppRoutes } from "@/routes/AppRoutes";
import { ScrollToTop } from "@/routes/ScrollToTop";
import { AppErrorBoundary } from "@/components/common/AppErrorBoundary";

export default function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {/* AuthProvider sits inside the router so it can react to navigation. */}
          <AuthProvider>
            <ScrollToTop />
            <AppRoutes />
            <Toaster
              position="top-center"
              richColors
              closeButton
              // Collapses duplicate toasts instead of stacking them.
              visibleToasts={3}
              toastOptions={{ duration: 3500 }}
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
