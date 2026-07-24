/**
 * Home persistence — localStorage + subscribers.
 * autosave: כל mutation דרך commit() → localStorage מיד.
 * offline: localStorage הוא ה־store הראשי; אין תלות רשת.
 */
import type {
  HomeExerciseEntry,
  HomeExerciseSet,
  HomeSession,
  HomeTemplate,
  HomeTemplateEntry,
  HomeTemplateVersion,
} from "./types";

const STORAGE_KEY = "fitlog:home:v1";

export interface HomeState {
  sessions: HomeSession[];
  entries: HomeExerciseEntry[];
  sets: HomeExerciseSet[];
  templates: HomeTemplate[];
  templateEntries: HomeTemplateEntry[];
  templateVersions: HomeTemplateVersion[];
  prefs: {
    default_sets: number;
    default_reps: number;
    default_rest_seconds: number;
    default_hold_seconds: number;
    haptics: boolean;
  };
}

const EMPTY: HomeState = {
  sessions: [],
  entries: [],
  sets: [],
  templates: [],
  templateEntries: [],
  templateVersions: [],
  prefs: {
    default_sets: 3,
    default_reps: 12,
    default_rest_seconds: 60,
    default_hold_seconds: 30,
    haptics: true,
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

let cache: HomeState | null = null;
let inMemoryFallback: HomeState | null = null;
const listeners = new Set<() => void>();

function hydrate(raw: unknown): HomeState {
  const s = raw as Partial<HomeState> | null;
  return {
    sessions: s?.sessions ?? [],
    entries: s?.entries ?? [],
    sets: s?.sets ?? [],
    templates: s?.templates ?? [],
    templateEntries: s?.templateEntries ?? [],
    templateVersions: s?.templateVersions ?? [],
    prefs: { ...EMPTY.prefs, ...(s?.prefs ?? {}) },
  };
}

export function readHomeState(): HomeState {
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

export function readHomeServerSnapshot(): HomeState {
  return EMPTY;
}

export function subscribeHome(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let lastWriteAt: number | null = null;

export function writeHomeState(next: HomeState): void {
  cache = next;
  lastWriteAt = Date.now();
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

export function commit(fn: (s: HomeState) => HomeState): void {
  writeHomeState(fn(readHomeState()));
}

export function getHomeLastWriteAt(): number | null {
  return lastWriteAt;
}

export function _resetHomeStateForTests(state?: HomeState): void {
  cache = null;
  inMemoryFallback = state ? { ...state } : null;
  lastWriteAt = null;
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

export const HOME_OWNER_ID = "single-user";
