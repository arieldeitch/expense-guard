/**
 * Goals persistence — localStorage + subscribers.
 * autosave: כל mutation דרך commit() → localStorage מיד.
 */
import type { Goal, GoalSnapshot, GoalVersion } from "./types";
import { reportWrite, safeWriteStorage } from "@/lib/storage/safeStorage";

/** מפתח ה-localStorage של המודול. נחשף עבור schema/snapshot מקומיים (ADR-0033) — אין לשנות. */
export const STORAGE_KEY = "fitlog:goals:v1";

export interface GoalsState {
  goals: Goal[];
  snapshots: GoalSnapshot[];
  versions: GoalVersion[];
  activityLinks: GoalActivityLink[];
}

/** קישור פעילות ליעד — audit של אילו activities השפיעו על snapshot. */
export interface GoalActivityLink {
  id: string;
  goal_id: string;
  activity_kind: "run" | "gym_session" | "home_session";
  activity_id: string;
  linked_at: string;
  linked_by: "system" | "user";
  deleted_at: string | null;
}

const EMPTY: GoalsState = {
  goals: [],
  snapshots: [],
  versions: [],
  activityLinks: [],
};

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

let cache: GoalsState | null = null;
let inMemoryFallback: GoalsState | null = null;
const listeners = new Set<() => void>();

function hydrate(raw: unknown): GoalsState {
  const s = raw as Partial<GoalsState> | null;
  return {
    goals: s?.goals ?? [],
    snapshots: s?.snapshots ?? [],
    versions: s?.versions ?? [],
    activityLinks: s?.activityLinks ?? [],
  };
}

export function readGoalsState(): GoalsState {
  if (cache) return cache;
  const storage = safeStorage();
  if (!storage) {
    cache = inMemoryFallback ?? { ...EMPTY };
    return cache;
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    cache = raw ? hydrate(JSON.parse(raw)) : { ...EMPTY };
    return cache;
  } catch {
    cache = { ...EMPTY };
    return cache;
  }
}

export function readGoalsServerSnapshot(): GoalsState {
  return EMPTY;
}

export function subscribeGoals(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function writeGoalsState(next: GoalsState): void {
  cache = next;
  const result = reportWrite("goals", safeWriteStorage(STORAGE_KEY, next));
  if (result.status !== "saved") inMemoryFallback = next;
  listeners.forEach((l) => l());
}

export function commit(fn: (s: GoalsState) => GoalsState): void {
  writeGoalsState(fn(readGoalsState()));
}

export function _resetGoalsStateForTests(state?: GoalsState): void {
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

export const GOALS_OWNER_ID = "single-user";
