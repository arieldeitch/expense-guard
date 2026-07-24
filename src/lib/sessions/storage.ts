import type { StrengthSession } from "./types";

const STORAGE_KEY = "fitlog:sessions:v1";

interface SessionsState {
  sessions: StrengthSession[];
}

const EMPTY: SessionsState = { sessions: [] };

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

let cache: SessionsState | null = null;
let inMemoryFallback: SessionsState | null = null;
const listeners = new Set<() => void>();

export function readSessionsState(): SessionsState {
  if (cache) return cache;
  const storage = safeStorage();
  if (!storage) {
    cache = inMemoryFallback ?? { ...EMPTY };
    return cache;
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as SessionsState) : { ...EMPTY };
    return cache;
  } catch {
    cache = { ...EMPTY };
    return cache;
  }
}

export function readSessionsServerSnapshot(): SessionsState {
  return EMPTY;
}

export function subscribeSessions(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function writeSessionsState(next: SessionsState): void {
  cache = next;
  const storage = safeStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      inMemoryFallback = next;
    }
  } else {
    inMemoryFallback = next;
  }
  listeners.forEach((l) => l());
}

export function _resetSessionsStateForTests(state?: SessionsState): void {
  cache = null;
  inMemoryFallback = state ? { ...state } : null;
  const storage = safeStorage();
  if (storage) {
    try {
      if (state) storage.setItem(STORAGE_KEY, JSON.stringify(state));
      else storage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}
