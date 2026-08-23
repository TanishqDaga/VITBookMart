import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { AppRoutes } from "@/routes/AppRoutes";
import { AppErrorBoundary } from "@/components/ui/AppErrorBoundary";

export default function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminAuthProvider>
            <AppRoutes />
            <Toaster position="top-right" richColors closeButton visibleToasts={3}
              toastOptions={{ duration: 3500 }} />
          </AdminAuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
