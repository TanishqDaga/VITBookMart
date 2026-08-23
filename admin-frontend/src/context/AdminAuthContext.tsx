import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminAuthApi } from "@/api/adminAuthApi";
import { setSessionExpiredHandler } from "@/api/axios";
import { tokenStore } from "@/api/tokenStore";
import type { AdminIdentity, AdminLoginRequest } from "@/types";

interface AdminAuthContextValue {
  identity: AdminIdentity | null;
  isAuthenticated: boolean;
  isInitialising: boolean;
  signIn: (request: AdminLoginRequest) => Promise<void>;
  signOut: (options?: { silent?: boolean }) => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [identity, setIdentity] = useState<AdminIdentity | null>(() => tokenStore.getIdentity());
  const [isInitialising, setIsInitialising] = useState(() => tokenStore.isAuthenticated());

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setIdentity(null);
    // Admin data is sensitive; never let it survive into the next session.
    queryClient.clear();
  }, [queryClient]);

  const signOut = useCallback(
    (options?: { silent?: boolean }) => {
      clearSession();
      if (!options?.silent) toast.success("Signed out");
    },
    [clearSession],
  );

  useEffect(() => {
    setSessionExpiredHandler(() => {
      clearSession();
      toast.error("Your admin session expired. Sign in again.");
    });
    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  // Another tab signing out should sign this one out too.
  useEffect(() => {
    const sync = () => {
      const next = tokenStore.getIdentity();
      setIdentity(next);
      if (!next) queryClient.clear();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [queryClient]);

  /**
   * On boot, exchange the stored refresh token for a fresh access token. That
   * both validates the session and re-runs the backend's isActive() check, so a
   * deactivated admin can't keep using a cached token.
   */
  useEffect(() => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) {
      setIsInitialising(false);
      return;
    }

    let cancelled = false;

    adminAuthApi
      .refresh(refreshToken)
      .then((response) => {
        if (cancelled) return;
        tokenStore.setSession(response.accessToken, response.refreshToken);
        setIdentity(tokenStore.getIdentity());
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setIsInitialising(false);
      });

    return () => { cancelled = true; };
    // Runs once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(async (request: AdminLoginRequest) => {
    const response = await adminAuthApi.login(request);
    tokenStore.setSession(response.accessToken, response.refreshToken);

    const next = tokenStore.getIdentity();
    // A token that doesn't decode as ADMIN_ACCESS is not a usable admin session.
    if (!next) {
      tokenStore.clear();
      throw new Error("The API returned a token this portal can't read.");
    }
    setIdentity(next);
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      identity,
      isAuthenticated: identity !== null,
      isInitialising,
      signIn,
      signOut,
    }),
    [identity, isInitialising, signIn, signOut],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  return context;
}
