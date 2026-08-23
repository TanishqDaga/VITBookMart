import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/api/authApi";
import { setSessionExpiredHandler } from "@/api/axios";
import { tokenStore } from "@/api/tokenStore";
import { userApi } from "@/api/userApi";
import { queryKeys } from "@/lib/queryKeys";
import type { UserResponse } from "@/types";

interface AuthContextValue {
  user: UserResponse | null;
  isAuthenticated: boolean;
  /** True until the stored session has been checked against the backend. */
  isInitialising: boolean;
  /** Exchange a Google authorization code for a session. */
  signInWithCode: (code: string) => Promise<UserResponse>;
  signOut: (options?: { silent?: boolean }) => void;
  /** Replace the cached user after a profile update. */
  setUser: (user: UserResponse) => void;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Mirrors UserService.isProfileComplete on the backend:
 * name, email, whatsappNumber and all three hostel fields must be non-blank.
 * Checking client-side lets us warn before the user fills in a whole listing form;
 * the backend still enforces it on create.
 */
export function isProfileComplete(user: UserResponse | null): boolean {
  if (!user) return false;
  const filled = (value: string | null | undefined) =>
    typeof value === "string" && value.trim() !== "";

  return (
    filled(user.name) &&
    filled(user.email) &&
    filled(user.whatsappNumber) &&
    user.hostel !== null &&
    filled(user.hostel.type) &&
    filled(user.hostel.block) &&
    filled(user.hostel.room)
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUserState] = useState<UserResponse | null>(() => tokenStore.getUser());
  const [isInitialising, setIsInitialising] = useState(() => tokenStore.isAuthenticated());
  const signingOut = useRef(false);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUserState(null);
    // Drop every cached query: authenticated data must never survive into the
    // next session, and public data will refetch cheaply.
    queryClient.clear();
  }, [queryClient]);

  const signOut = useCallback(
    (options?: { silent?: boolean }) => {
      if (signingOut.current) return;
      signingOut.current = true;
      clearSession();
      if (!options?.silent) toast.success("Logged out");
      window.setTimeout(() => {
        signingOut.current = false;
      }, 0);
    },
    [clearSession],
  );

  // The axios interceptor calls this when a refresh fails.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      if (!tokenStore.getUser() && !user) return;
      clearSession();
      toast.error("Your session expired. Sign in again to continue.");
    });
    return () => setSessionExpiredHandler(null);
  }, [clearSession, user]);

  // Another tab signing in or out should be reflected here.
  useEffect(() => {
    const sync = () => {
      const stored = tokenStore.getUser();
      setUserState(stored);
      if (!stored) queryClient.clear();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [queryClient]);

  /**
   * On boot, confirm the stored session is still good. GET /api/users/me will
   * transparently refresh a 15-minute access token via the interceptor; if the
   * 30-day refresh token is also dead, the interceptor clears the session.
   */
  useEffect(() => {
    let cancelled = false;

    if (!tokenStore.isAuthenticated()) {
      setIsInitialising(false);
      return;
    }

    userApi
      .getMe()
      .then((fresh) => {
        if (cancelled) return;
        tokenStore.setUser(fresh);
        setUserState(fresh);
        queryClient.setQueryData(queryKeys.me.profile, fresh);
      })
      .catch(() => {
        // The interceptor has already dealt with an unrecoverable 401. A network
        // blip should not sign the user out, so we keep whatever we had cached.
      })
      .finally(() => {
        if (!cancelled) setIsInitialising(false);
      });

    return () => {
      cancelled = true;
    };
    // Runs once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithCode = useCallback(
    async (code: string) => {
      const response = await authApi.loginWithGoogle(code);
      tokenStore.setSession(response.accessToken, response.refreshToken, response.user);
      setUserState(response.user);
      queryClient.setQueryData(queryKeys.me.profile, response.user);
      return response.user;
    },
    [queryClient],
  );

  const setUser = useCallback(
    (next: UserResponse) => {
      tokenStore.setUser(next);
      setUserState(next);
      queryClient.setQueryData(queryKeys.me.profile, next);
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitialising,
      signInWithCode,
      signOut,
      setUser,
      isProfileComplete: isProfileComplete(user),
    }),
    [user, isInitialising, signInWithCode, signOut, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
