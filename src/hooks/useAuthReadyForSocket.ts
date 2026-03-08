import { useEffect, useState } from "react";

const FLUTTER_AUTH_READY_EVENT = "flutterAuthReady";

function isWebView(): boolean {
  return typeof window !== "undefined" && !!window.FlutterBridge;
}

/**
 * Returns true when the app is ready to use the trip (or other) socket with auth.
 * - In browser: ready immediately so socket behavior is unchanged.
 * - In Flutter WebView: ready after Flutter injects token and dispatches 'flutterAuthReady',
 *   or as soon as we see a token in localStorage (e.g. event already fired or late listener).
 */
export function useAuthReadyForSocket(): boolean {
  const [authReady, setAuthReady] = useState(() => {
    if (typeof window === "undefined") return false;
    if (!isWebView()) return true;
    return !!(localStorage.getItem("auth_token") ?? "").trim();
  });

  useEffect(() => {
    if (!isWebView()) return;
    if ((localStorage.getItem("auth_token") ?? "").trim()) {
      setAuthReady(true);
      return;
    }

    const handleReady = () => setAuthReady(true);
    window.addEventListener(FLUTTER_AUTH_READY_EVENT, handleReady);
    return () => window.removeEventListener(FLUTTER_AUTH_READY_EVENT, handleReady);
  }, []);

  return authReady;
}
