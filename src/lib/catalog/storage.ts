/**
 * Storage layer — persistent במידה וקיים localStorage; אחרת in-memory.
 * מותאם ל־SSR: safe access, deterministic snapshot.
 *
 * מבנה: מפתח יחיד `fitlog:catalog:v1` המכיל state שלם.
 * שינוי schema עתידי יידרוש bump לגרסה (v2) + מיגרציה בפועל.
 *
 * זהו יישום mock; כשיחובר Supabase, יוחלף ב־repository שקורא ל־server functions.
 */
import type { EquipmentItem, TrainingLocation, TreadmillProfile } from "./types";
import { reportWrite, safeWriteStorage } from "@/lib/storage/safeStorage";

/** מפתח ה-localStorage של המודול. נחשף עבור schema/snapshot מקומיים (ADR-0033) — אין לשנות. */
export const STORAGE_KEY = "fitlog:catalog:v1";
export const CURRENT_OWNER_ID = "single-user";

export interface CatalogState {
  locations: TrainingLocation[];
  treadmills: TreadmillProfile[];
  equipment: EquipmentItem[];
}

const EMPTY_STATE: CatalogState = { locations: [], treadmills: [], equipment: [] };

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

let cache: CatalogState | null = null;
let inMemoryFallback: CatalogState | null = null;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function coerceCatalogState(raw: unknown): CatalogState {
  if (!isRecord(raw)) return { ...EMPTY_STATE };
  const state: CatalogState = {
    locations: Array.isArray(raw.locations) ? (raw.locations as TrainingLocation[]) : [],
    treadmills: Array.isArray(raw.treadmills) ? (raw.treadmills as TreadmillProfile[]) : [],
    equipment: Array.isArray(raw.equipment) ? (raw.equipment as EquipmentItem[]) : [],
  };
  return state;
}

export function readCatalogState(): CatalogState {
  if (cache) return cache;
  const storage = safeStorage();
  if (!storage) {
    cache = inMemoryFallback ?? { ...EMPTY_STATE };
    return cache;
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = { ...EMPTY_STATE };
      return cache;
    }
    cache = coerceCatalogState(JSON.parse(raw));
    return cache;
  } catch {
    cache = { ...EMPTY_STATE };
    return cache;
  }
}

/** SSR snapshot — קבוע. */
export function readCatalogServerSnapshot(): CatalogState {
  return EMPTY_STATE;
}

const listeners = new Set<() => void>();

export function subscribeCatalog(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function writeCatalogState(next: CatalogState): void {
  cache = next;
  const result = reportWrite("catalog", safeWriteStorage(STORAGE_KEY, next));
  if (result.status !== "saved") inMemoryFallback = next;
  listeners.forEach((l) => l());
}

/** Testing helper — קרוא בלבד מבדיקות. */
export function _resetCatalogStateForTests(state?: CatalogState): void {
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
