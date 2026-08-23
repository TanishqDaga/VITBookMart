import { post } from "./axios";
import type { AdminAuthResponse, AdminLoginRequest } from "@/types";

export const adminAuthApi = {
  /**
   * POST /api/admin/auth/login — public (permitAll in SecurityConfig).
   * Body { username, password } -> { accessToken, refreshToken }.
   * No admin object comes back; identity is read from the token claims.
   */
  login(request: AdminLoginRequest) {
    return post<AdminAuthResponse>("/api/admin/auth/login", request);
  },

  /** POST /api/admin/auth/refresh — public. Body { refreshToken }. */
  refresh(refreshToken: string) {
    return post<AdminAuthResponse>("/api/admin/auth/refresh", { refreshToken });
  },
};
