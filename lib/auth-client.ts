import { useSyncExternalStore } from "react";

const AUTH_EVENT = "agroshield-auth-changed";

export const AUTH_TOKEN_KEY = "agroshield_token";

export type JwtPayload = {
  userId?: string;
  role?: string;
  exp?: number;
  [key: string]: unknown;
};

function getAuthSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY));
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_EVENT, callback);
  };
}

export function useAuthStatus() {
  return useSyncExternalStore(subscribe, getAuthSnapshot, () => false);
}

export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function notifyAuthChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getStoredAuthPayload() {
  const token = getStoredAuthToken();
  if (!token) return null;
  return decodeJwtPayload(token);
}

export function getAuthHeaders(token?: string | null) {
  const authToken = token ?? getStoredAuthToken();
  if (!authToken) return {};

  return { Authorization: `Bearer ${authToken}` };
}
