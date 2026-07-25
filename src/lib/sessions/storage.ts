/**
 * Sessions persistence — localStorage, cache + subscribers.
 * שומר sessions, exercises, sets, blocks, timers כמצב אחד.
 * autosave: כל mutation דרך writeSessionsState → localStorage מיד.
 */
import type {
  SessionTimerRecord,
  StrengthSession,
  StrengthSessionBlock,
  StrengthSessionExercise,
  StrengthSet,
} from "./types";
import { reportWrite, safeWriteStorage } from "@/lib/storage/safeStorage";

const STORAGE_KEY = "fitlog:sessions:v2";

export interface SessionsState {
  sessions: StrengthSession[];
  blocks: StrengthSessionBlock[];
  exercises: StrengthSessionExercise[];
  sets: StrengthSet[];
  timers: SessionTimerRecord[];
  /** העדפות משתמש עבור טיימר / הזנה. */
  prefs: {
    auto_start_rest: boolean;
    default_rest_seconds: number;
    haptics: boolean;
  };
}

const EMPTY: SessionsState = {
  sessions: [],
  blocks: [],
  exercises: [],
  sets: [],
  timers: [],
  prefs: {
    auto_start_rest: true,
    default_rest_seconds: 90,
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

let cache: SessionsState | null = null;
let inMemoryFallback: SessionsState | null = null;
const listeners = new Set<() => void>();

function hydrate(raw: unknown): SessionsState {
  const state = raw as Partial<SessionsState> | null;
  return {
    sessions: state?.sessions ?? [],
    blocks: state?.blocks ?? [],
    exercises: state?.exercises ?? [],
    sets: state?.sets ?? [],
    timers: state?.timers ?? [],
    prefs: { ...EMPTY.prefs, ...(state?.prefs ?? {}) },
  };
}

export function readSessionsState(): SessionsState {
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

export function readSessionsServerSnapshot(): SessionsState {
  return EMPTY;
}

export function subscribeSessions(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * תוצאת השמירה האחרונה.
 * - `idle`     — עוד לא נכתב דבר ב-session הנוכחי.
 * - `saved`    — נכתב ל-localStorage בהצלחה. **שורד refresh.**
 * - `memory`   — הכתיבה ל-localStorage נכשלה (מכסה מלאה / מצב פרטי) או שאין
 *                localStorage כלל. הנתונים קיימים בזיכרון בלבד ו**לא ישרדו refresh**.
 *
 * קיים כדי שה-UI לא יציג "נשמר" כשבפועל השמירה נכשלה. ראה ADR-0028.
 */
export type PersistenceStatus = "idle" | "saved" | "memory";

let persistenceStatus: PersistenceStatus = "idle";
let lastWriteAt: number | null = null;
const statusListeners = new Set<() => void>();

export function getPersistenceStatus(): PersistenceStatus {
  return persistenceStatus;
}
export function getLastWriteAt(): number | null {
  return lastWriteAt;
}
export function subscribePersistence(fn: () => void): () => void {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}

export function writeSessionsState(next: SessionsState): void {
  cache = next;
  const result = reportWrite("sessions", safeWriteStorage(STORAGE_KEY, next));
  if (result.status !== "saved") inMemoryFallback = next;

  const nextStatus: PersistenceStatus = result.status === "saved" ? "saved" : "memory";
  const changed = nextStatus !== persistenceStatus;
  persistenceStatus = nextStatus;
  lastWriteAt = Date.now();
  listeners.forEach((l) => l());
  if (changed) statusListeners.forEach((l) => l());
}

/** helper — mutation מרוכזת. */
export function commit(fn: (s: SessionsState) => SessionsState): void {
  writeSessionsState(fn(readSessionsState()));
}

export function _resetSessionsStateForTests(state?: SessionsState): void {
  cache = null;
  inMemoryFallback = state ? { ...state } : null;
  lastWriteAt = null;
  persistenceStatus = "idle";
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

export const CURRENT_OWNER_ID = "single-user";
