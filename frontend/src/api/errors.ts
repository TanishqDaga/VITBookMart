import axios from "axios";
import type { ErrorResponse } from "@/types";

export type ApiErrorKind =
  | "network"
  | "unauthorized"
  | "forbidden"
  | "terminated"
  | "notFound"
  | "profileIncomplete"
  | "notOwner"
  | "validation"
  | "server"
  | "unknown";

export interface ApiError {
  kind: ApiErrorKind;
  /** Safe to show in a toast or inline. Never a raw stack trace. */
  message: string;
  status?: number;
  /** The backend's own message, when it sent one. */
  backendMessage?: string;
}

/**
 * Exact strings thrown by the backend that we need to recognise.
 * ProfileIncompleteException and BadRequestException both map to HTTP 400,
 * so the message is the only way to tell them apart.
 */
const PROFILE_INCOMPLETE_MESSAGE = "Complete your profile before creating a listing";
const NOT_OWNER_MESSAGE = "You are not the owner of this listing";

function readBackendMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const message = (data as Partial<ErrorResponse>).message;
  return typeof message === "string" && message.trim() !== "" ? message.trim() : undefined;
}

/**
 * Turns anything thrown by axios into a predictable shape.
 * Keeps the backend's message when it is useful, replaces it when it is not.
 */
export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { kind: "unknown", message: "Something went wrong. Please try again." };
  }

  // No response at all: server down, DNS failure, blocked by CORS, or offline.
  if (!error.response) {
    if (error.code === "ERR_CANCELED") {
      return { kind: "unknown", message: "Request cancelled." };
    }
    return {
      kind: "network",
      message: navigator.onLine
        ? "We couldn't reach VITBookMart. Check your connection and try again."
        : "You're offline. Reconnect and try again.",
    };
  }

  const status = error.response.status;
  const backendMessage = readBackendMessage(error.response.data);

  if (status === 401) {
    return {
      kind: "unauthorized",
      status,
      backendMessage,
      message: "Your session has expired. Sign in again to continue.",
    };
  }

  if (status === 403) {
    // TerminatedUserException is the only 403 the backend raises by name.
    const terminated = backendMessage?.toLowerCase().includes("terminated");
    return {
      kind: terminated ? "terminated" : "forbidden",
      status,
      backendMessage,
      message: terminated
        ? "This account has been suspended. Contact the VITBookMart team for help."
        : "You don't have access to that.",
    };
  }

  if (status === 404) {
    return {
      kind: "notFound",
      status,
      backendMessage,
      message: backendMessage === "Listing not found"
        ? "This listing is no longer available."
        : backendMessage ?? "We couldn't find what you were looking for.",
    };
  }

  if (status === 400) {
    if (backendMessage === PROFILE_INCOMPLETE_MESSAGE) {
      return {
        kind: "profileIncomplete",
        status,
        backendMessage,
        message: "Complete your profile before selling.",
      };
    }
    if (backendMessage === NOT_OWNER_MESSAGE) {
      return {
        kind: "notOwner",
        status,
        backendMessage,
        message: "You can only edit listings you posted.",
      };
    }
    // Bean-validation and IllegalArgumentException messages are written for
    // humans ("Only JPG, PNG and WEBP images are allowed") — show them as-is.
    return {
      kind: "validation",
      status,
      backendMessage,
      message: backendMessage ?? "Please check the form and try again.",
    };
  }

  if (status === 413) {
    return {
      kind: "validation",
      status,
      backendMessage,
      message: "That image is too large. Pick one under 5 MB.",
    };
  }

  if (status >= 500) {
    return {
      kind: "server",
      status,
      backendMessage,
      message: "VITBookMart is having trouble right now. Try again in a moment.",
    };
  }

  return {
    kind: "unknown",
    status,
    backendMessage,
    message: backendMessage ?? "Something went wrong. Please try again.",
  };
}

/** Shorthand for toasts. */
export function errorMessage(error: unknown): string {
  return toApiError(error).message;
}

export function isProfileIncomplete(error: unknown): boolean {
  return toApiError(error).kind === "profileIncomplete";
}

export function isNotFound(error: unknown): boolean {
  return toApiError(error).kind === "notFound";
}
