// localStorage-backed cart, exposed as an external store so React can read it
// through useSyncExternalStore. That avoids hydrating from an effect (which
// causes cascading renders) and gives cross-tab sync for free.
//
// Snapshots are the raw JSON string, not the parsed object: React compares with
// Object.is, and strings compare by value, so no caching layer is needed.

const KEY = "ks-cart-v1";
const EMPTY = "{}";

export type Qtys = Record<number, number>;

const listeners = new Set<() => void>();

export function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Fires for other tabs; same-tab writes notify through `listeners`.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getSnapshot(): string {
  try {
    return localStorage.getItem(KEY) ?? EMPTY;
  } catch {
    // Private mode or blocked storage - an empty cart is a fine fallback.
    return EMPTY;
  }
}

export function getServerSnapshot(): string {
  return EMPTY;
}

export function parse(snapshot: string): Qtys {
  try {
    const value = JSON.parse(snapshot);
    return value && typeof value === "object" ? (value as Qtys) : {};
  } catch {
    return {};
  }
}

export function write(qtys: Qtys): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(qtys));
  } catch {
    // Losing persistence must never break the page - still notify so the UI moves.
  }
  listeners.forEach((l) => l());
}
