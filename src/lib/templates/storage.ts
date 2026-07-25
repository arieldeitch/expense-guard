/**
 * Storage — persistence layer עבור workout templates.
 * מבנה זהה ל־catalog/exercises: state יחיד תחת מפתח localStorage אחד, subscribe pattern.
 */
import type {
  WorkoutTemplate,
  WorkoutTemplateBlock,
  WorkoutTemplateExercise,
  WorkoutTemplateVersion,
} from "./types";
import { reportWrite, safeWriteStorage } from "@/lib/storage/safeStorage";

const STORAGE_KEY = "fitlog:templates:v1";
export const CURRENT_OWNER_ID = "single-user";

export interface TemplatesState {
  templates: WorkoutTemplate[];
  blocks: WorkoutTemplateBlock[];
  exercises: WorkoutTemplateExercise[];
  versions: WorkoutTemplateVersion[];
}

const EMPTY_STATE: TemplatesState = {
  templates: [],
  blocks: [],
  exercises: [],
  versions: [],
};

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

let cache: TemplatesState | null = null;
let inMemoryFallback: TemplatesState | null = null;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function coerce(raw: unknown): TemplatesState {
  if (!isRecord(raw)) return { ...EMPTY_STATE };
  return {
    templates: Array.isArray(raw.templates) ? (raw.templates as WorkoutTemplate[]) : [],
    blocks: Array.isArray(raw.blocks) ? (raw.blocks as WorkoutTemplateBlock[]) : [],
    exercises: Array.isArray(raw.exercises) ? (raw.exercises as WorkoutTemplateExercise[]) : [],
    versions: Array.isArray(raw.versions) ? (raw.versions as WorkoutTemplateVersion[]) : [],
  };
}

export function readTemplatesState(): TemplatesState {
  if (cache) return cache;
  const storage = safeStorage();
  if (!storage) {
    cache = inMemoryFallback ?? { ...EMPTY_STATE };
    return cache;
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    cache = raw ? coerce(JSON.parse(raw)) : { ...EMPTY_STATE };
    return cache;
  } catch {
    cache = { ...EMPTY_STATE };
    return cache;
  }
}

/** SSR snapshot — קבוע. */
export function readTemplatesServerSnapshot(): TemplatesState {
  return EMPTY_STATE;
}

const listeners = new Set<() => void>();

export function subscribeTemplates(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function writeTemplatesState(next: TemplatesState): void {
  cache = next;
  const result = reportWrite("templates", safeWriteStorage(STORAGE_KEY, next));
  if (result.status !== "saved") inMemoryFallback = next;
  listeners.forEach((l) => l());
}

/** Testing helper. */
export function _resetTemplatesStateForTests(state?: TemplatesState): void {
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
