import { useSyncExternalStore } from "react";

const AUTH_EVENT = "agroshield-auth-changed";

function getAuthSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.localStorage.getItem("agroshield_token"));
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
