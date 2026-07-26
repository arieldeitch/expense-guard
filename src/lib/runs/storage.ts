/**
 * Runs storage — persistent state ב-localStorage. תואם ל-SSR.
 * מפתח יחיד `fitlog:runs:v1`. בעתיד יוחלף ב-Supabase repo באותו contract.
 */
import type { RunSession, RunningRoute } from "./types";
import { reportWrite, safeWriteStorage } from "@/lib/storage/safeStorage";

/** מפתח ה-localStorage של המודול. נחשף עבור schema/snapshot מקומיים (ADR-0033) — אין לשנות. */
export const STORAGE_KEY = "fitlog:runs:v1";
export const CURRENT_OWNER_ID = "single-user";

export interface RunsState {
  runs: RunSession[];
  routes: RunningRoute[];
  /** last-used defaults למילוי מהיר של טופס חדש. */
  lastUsed: {
    run_type: "treadmill" | "outdoor" | null;
    location_id: string | null;
    treadmill_id: string | null;
    route_id: string | null;
    country_code: string | null;
    city_or_area: string | null;
  };
}

const EMPTY_STATE: RunsState = {
  runs: [],
  routes: [],
  lastUsed: {
    run_type: null,
    location_id: null,
    treadmill_id: null,
    route_id: null,
    country_code: null,
    city_or_area: null,
  },
};

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

let cache: RunsState | null = null;
let inMemoryFallback: RunsState | null = null;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function coerce(raw: unknown): RunsState {
  if (!isRecord(raw)) return { ...EMPTY_STATE, lastUsed: { ...EMPTY_STATE.lastUsed } };
  return {
    runs: Array.isArray(raw.runs) ? (raw.runs as RunSession[]) : [],
    routes: Array.isArray(raw.routes) ? (raw.routes as RunningRoute[]) : [],
    lastUsed: isRecord(raw.lastUsed)
      ? { ...EMPTY_STATE.lastUsed, ...(raw.lastUsed as Partial<RunsState["lastUsed"]>) }
      : { ...EMPTY_STATE.lastUsed },
  };
}

export function readRunsState(): RunsState {
  if (cache) return cache;
  const storage = safeStorage();
  if (!storage) {
    cache = inMemoryFallback ?? { ...EMPTY_STATE, lastUsed: { ...EMPTY_STATE.lastUsed } };
    return cache;
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = { ...EMPTY_STATE, lastUsed: { ...EMPTY_STATE.lastUsed } };
      return cache;
    }
    cache = coerce(JSON.parse(raw));
    return cache;
  } catch {
    cache = { ...EMPTY_STATE, lastUsed: { ...EMPTY_STATE.lastUsed } };
    return cache;
  }
}

export function readRunsServerSnapshot(): RunsState {
  return EMPTY_STATE;
}

const listeners = new Set<() => void>();

export function subscribeRuns(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function writeRunsState(next: RunsState): void {
  cache = next;
  const result = reportWrite("runs", safeWriteStorage(STORAGE_KEY, next));
  if (result.status !== "saved") inMemoryFallback = next;
  listeners.forEach((l) => l());
}

/** Testing helper — reset. */
export function __resetRunsStateForTests() {
  cache = null;
  inMemoryFallback = null;
  const s = safeStorage();
  if (s) {
    try {
      s.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
