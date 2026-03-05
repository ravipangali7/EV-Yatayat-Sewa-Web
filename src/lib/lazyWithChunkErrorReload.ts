import { lazy, LazyExoticComponent, ComponentType } from "react";

/**
 * Returns true if the error is a failed dynamic import (chunk no longer exists after deploy).
 */
function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error);
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Loading chunk") ||
    message.includes("Loading CSS chunk") ||
    message.includes("Importing a module script failed")
  );
}

/**
 * Wraps React.lazy() so that when a dynamic import fails (e.g. old chunk 404 after deploy),
 * the page is reloaded once to pick up the new deployment. Fixes "Failed to fetch dynamically
 * imported module" for routes like Users, ContactMessages, etc.
 */
export function lazyWithChunkErrorReload<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  reloadAttempts = 1
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= reloadAttempts; attempt++) {
      try {
        return await factory();
      } catch (error) {
        lastError = error;
        if (isChunkLoadError(error) && attempt < reloadAttempts) {
          window.location.reload();
          return new Promise(() => {}); // never resolve; page is reloading
        }
      }
    }
    throw lastError;
  });
}
