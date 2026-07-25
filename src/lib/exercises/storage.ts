/**
 * Storage layer — persistent במידה וקיים localStorage; אחרת in-memory.
 * מבנה: מפתח יחיד `fitlog:exercises:v1` המכיל state שלם.
 * שינוי schema עתידי יידרוש bump לגרסה + מיגרציה.
 *
 * זהו יישום mock; כשיחובר Supabase, ה־repo יוחלף בקריאות ל־server functions.
 */
import type { Exercise, ExerciseMedia, MuscleGroup } from "./types";
import { seedMuscleGroups, seedExercises } from "./seed";
import { reportWrite, safeWriteStorage } from "@/lib/storage/safeStorage";

const STORAGE_KEY = "fitlog:exercises:v1";
export const CURRENT_OWNER_ID = "single-user";

export interface ExercisesState {
  muscle_groups: MuscleGroup[];
  exercises: Exercise[];
  media: ExerciseMedia[];
  /** תזוזה עתידית בין גרסאות schema. */
  version: 1;
  /** האם seed הותקן — כדי לא לרוץ פעם נוספת. */
  seeded: boolean;
}

const EMPTY_STATE: ExercisesState = {
  muscle_groups: [],
  exercises: [],
  media: [],
  version: 1,
  seeded: false,
};

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

let cache: ExercisesState | null = null;
let inMemoryFallback: ExercisesState | null = null;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function coerce(raw: unknown): ExercisesState {
  if (!isRecord(raw)) return { ...EMPTY_STATE };
  return {
    muscle_groups: Array.isArray(raw.muscle_groups) ? (raw.muscle_groups as MuscleGroup[]) : [],
    exercises: Array.isArray(raw.exercises) ? (raw.exercises as Exercise[]) : [],
    media: Array.isArray(raw.media) ? (raw.media as ExerciseMedia[]) : [],
    version: 1,
    seeded: Boolean(raw.seeded),
  };
}

/** קריאה שוטפת — טוענת מ־storage בפעם הראשונה, ואז cache in-memory. */
export function readExercisesState(): ExercisesState {
  if (cache) return cache;
  const storage = safeStorage();
  if (!storage) {
    cache = inMemoryFallback ?? { ...EMPTY_STATE };
    if (!cache.seeded) cache = applySeed(cache);
    return cache;
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = applySeed({ ...EMPTY_STATE });
      persist(cache);
      return cache;
    }
    const parsed = coerce(JSON.parse(raw));
    if (!parsed.seeded) {
      cache = applySeed(parsed);
      persist(cache);
    } else {
      cache = parsed;
    }
    return cache;
  } catch {
    cache = applySeed({ ...EMPTY_STATE });
    return cache;
  }
}

/** SSR snapshot — קבוע. */
export function readExercisesServerSnapshot(): ExercisesState {
  return EMPTY_STATE;
}

const listeners = new Set<() => void>();

export function subscribeExercises(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function persist(state: ExercisesState): void {
  const result = reportWrite("exercises", safeWriteStorage(STORAGE_KEY, state));
  if (result.status !== "saved") inMemoryFallback = state;
}

export function writeExercisesState(next: ExercisesState): void {
  cache = next;
  persist(next);
  listeners.forEach((l) => l());
}

/** התקנת seed ראשונית — מוסיפה קבוצות שריר ותרגילים מערכת. אין overwrite של קיימים. */
function applySeed(state: ExercisesState): ExercisesState {
  const mgSeeded = seedMuscleGroups(CURRENT_OWNER_ID);
  const existingMgCodes = new Set(state.muscle_groups.map((m) => m.code));
  const mergedMgs = [
    ...state.muscle_groups,
    ...mgSeeded.filter((m) => !existingMgCodes.has(m.code)),
  ];

  const exSeeded = seedExercises(CURRENT_OWNER_ID, mergedMgs);
  const existingSlugs = new Set(state.exercises.map((e) => e.slug));
  const mergedEx = [...state.exercises, ...exSeeded.filter((e) => !existingSlugs.has(e.slug))];

  return {
    ...state,
    muscle_groups: mergedMgs,
    exercises: mergedEx,
    seeded: true,
  };
}

/** Testing helper. */
export function _resetExercisesStateForTests(state?: ExercisesState): void {
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
