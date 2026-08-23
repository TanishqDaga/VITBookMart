import axios from "axios";
import type { ErrorResponse } from "@/types";

export type ApiErrorKind =
  | "network"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "invalidCredentials"
  | "inactiveAccount"
  | "validation"
  | "server"
  | "unknown";

export interface ApiError {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  backendMessage?: string;
}

/**
 * AdminService throws IllegalArgumentException for almost everything, and
 * GlobalExceptionHandler maps that to HTTP 400. So "Admin not found",
 * "User not found", "Listing not found", "Admin already exists" and
 * "Invalid username or password" all arrive as 400s and can only be told apart by
 * their message text.
 */
const MESSAGES = {
  invalidCredentials: "Invalid username or password",
  inactive: "Admin account is inactive",
  adminExists: "Admin already exists",
  usernameTaken: "Username already belongs to another admin",
} as const;

const NOT_FOUND = ["Admin not found", "User not found", "Listing not found"];

function backendMessageOf(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const message = (data as Partial<ErrorResponse>).message;
  return typeof message === "string" && message.trim() ? message.trim() : undefined;
}

export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { kind: "unknown", message: "Something went wrong. Try again." };
  }

  if (!error.response) {
    if (error.code === "ERR_CANCELED") return { kind: "unknown", message: "Request cancelled." };
    return {
      kind: "network",
      message: navigator.onLine
        ? "Can't reach the VITBookMart API. Check the backend is running."
        : "You're offline. Reconnect and try again.",
    };
  }

  const status = error.response.status;
  const backendMessage = backendMessageOf(error.response.data);

  if (status === 401) {
    return {
      kind: "unauthorized",
      status,
      backendMessage,
      message: "Your admin session has expired. Sign in again.",
    };
  }

  if (status === 403) {
    return {
      kind: "forbidden",
      status,
      backendMessage,
      // A user token on an admin endpoint lands here.
      message: "This account doesn't have admin access.",
    };
  }

  if (status === 400) {
    if (backendMessage === MESSAGES.invalidCredentials) {
      return { kind: "invalidCredentials", status, backendMessage, message: backendMessage };
    }
    if (backendMessage === MESSAGES.inactive) {
      return {
        kind: "inactiveAccount",
        status,
        backendMessage,
        message: "This admin account is inactive. Ask another admin to reactivate it.",
      };
    }
    if (backendMessage === MESSAGES.adminExists || backendMessage === MESSAGES.usernameTaken) {
      return { kind: "conflict", status, backendMessage, message: backendMessage };
    }
    if (backendMessage && NOT_FOUND.includes(backendMessage)) {
      // Semantically a 404 even though the backend sends 400.
      return { kind: "notFound", status, backendMessage, message: `${backendMessage}.` };
    }
    return {
      kind: "validation",
      status,
      backendMessage,
      message: backendMessage ?? "That request was rejected. Check the values and try again.",
    };
  }

  if (status === 404) {
    return {
      kind: "notFound",
      status,
      backendMessage,
      message: backendMessage ?? "Not found.",
    };
  }

  if (status >= 500) {
    return {
      kind: "server",
      status,
      backendMessage,
      message: "The API returned a server error. Check the backend logs.",
    };
  }

  return { kind: "unknown", status, backendMessage, message: backendMessage ?? "Request failed." };
}

export const errorMessage = (error: unknown) => toApiError(error).message;
