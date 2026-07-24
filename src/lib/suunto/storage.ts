/**
 * Suunto storage — persistent state ב-localStorage תחת `fitlog:suunto:v1`.
 * חוזה זהה למה שיהיה ב-Supabase (rows + calibrations + exclusions).
 */
import type {
  RunDeviceReading,
  TreadmillCalibrationProfile,
  CalibrationExclusion,
} from "./types";

const STORAGE_KEY = "fitlog:suunto:v1";
export const CURRENT_OWNER_ID = "single-user";

export interface SuuntoState {
  readings: RunDeviceReading[];
  calibrations: TreadmillCalibrationProfile[];
  exclusions: CalibrationExclusion[];
}

const EMPTY: SuuntoState = { readings: [], calibrations: [], exclusions: [] };

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

let cache: SuuntoState | null = null;
let mem: SuuntoState | null = null;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function coerce(raw: unknown): SuuntoState {
  if (!isRecord(raw)) return { ...EMPTY };
  return {
    readings: Array.isArray(raw.readings) ? (raw.readings as RunDeviceReading[]) : [],
    calibrations: Array.isArray(raw.calibrations)
      ? (raw.calibrations as TreadmillCalibrationProfile[])
      : [],
    exclusions: Array.isArray(raw.exclusions) ? (raw.exclusions as CalibrationExclusion[]) : [],
  };
}

export function readSuuntoState(): SuuntoState {
  if (cache) return cache;
  const s = safeStorage();
  if (!s) {
    cache = mem ?? { ...EMPTY };
    return cache;
  }
  try {
    const raw = s.getItem(STORAGE_KEY);
    cache = raw ? coerce(JSON.parse(raw)) : { ...EMPTY };
    return cache;
  } catch {
    cache = { ...EMPTY };
    return cache;
  }
}

export function readSuuntoServerSnapshot(): SuuntoState {
  return EMPTY;
}

const listeners = new Set<() => void>();
export function subscribeSuunto(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function writeSuuntoState(next: SuuntoState): void {
  cache = next;
  mem = next;
  const s = safeStorage();
  if (s) {
    try {
      s.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
  for (const fn of listeners) fn();
}

export function __resetSuuntoStateForTests() {
  cache = null;
  mem = null;
  const s = safeStorage();
  if (s) {
    try {
      s.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
