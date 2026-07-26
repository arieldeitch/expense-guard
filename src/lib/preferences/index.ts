/**
 * Preferences repository — abstraction ל־user preferences.
 * כרגע מגובה localStorage. יוחלף ב־Supabase profile row בעתיד בלי לגעת ב־UI.
 */
import { reportWrite, safeWriteStorage } from "@/lib/storage/safeStorage";

export type LandingModule = "home" | "running" | "gym" | "home-workout";

export type Preferences = {
  /** לאיזה מסך לפתוח לאחר login/refresh. "home" = launchpad. */
  landingModule: LandingModule;
};

/** מפתח ה-localStorage של ההעדפות. נחשף עבור schema/snapshot מקומיים (ADR-0033) — אין לשנות. */
export const PREFERENCES_STORAGE_KEY = "fitlog:preferences:v1";
const STORAGE_KEY = PREFERENCES_STORAGE_KEY;

const DEFAULTS: Preferences = {
  landingModule: "home",
};

const LANDING_MODULES: LandingModule[] = ["home", "running", "gym", "home-workout"];

function isLandingModule(v: unknown): v is LandingModule {
  return typeof v === "string" && (LANDING_MODULES as string[]).includes(v);
}

function safeGetStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

let cachedSnapshot: Preferences | null = null;

function loadFromStorage(): Preferences {
  const storage = safeGetStorage();
  if (!storage) return { ...DEFAULTS };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULTS };
    const obj = parsed as Record<string, unknown>;
    return {
      landingModule: isLandingModule(obj.landingModule)
        ? obj.landingModule
        : DEFAULTS.landingModule,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

/** Snapshot יציב — חובה עבור useSyncExternalStore (ללא זה = infinite re-render). */
export function readPreferences(): Preferences {
  if (cachedSnapshot === null) cachedSnapshot = loadFromStorage();
  return cachedSnapshot;
}

/** Server snapshot — קבוע ל־SSR (חייב להיות אותו reference בין קריאות). */
export function readPreferencesServerSnapshot(): Preferences {
  return DEFAULTS;
}

const listeners = new Set<() => void>();

export function writePreferences(next: Partial<Preferences>): Preferences {
  const current = readPreferences();
  const merged: Preferences = { ...current, ...next };
  cachedSnapshot = merged;
  reportWrite("preferences", safeWriteStorage(STORAGE_KEY, merged));
  listeners.forEach((l) => l());
  return merged;
}

export function subscribePreferences(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Testing helper — reset snapshot cache. לא לשימוש ב־UI. */
export function _resetPreferencesCache(): void {
  cachedSnapshot = null;
}

/** ל־session-scoped flag: "כבר בוצע redirect לפי landing preference בסשן הזה?" */
const SESSION_LANDED_KEY = "fitlog:session:landed";

export function hasLandedThisSession(): boolean {
  try {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(SESSION_LANDED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLandedThisSession(): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(SESSION_LANDED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export const LANDING_MODULE_ROUTES: Record<LandingModule, string> = {
  home: "/",
  running: "/running",
  gym: "/gym",
  "home-workout": "/home",
};

export const LANDING_MODULE_LABELS: Record<LandingModule, string> = {
  home: "המסך הראשי",
  running: "ריצה",
  gym: "חדר כושר",
  "home-workout": "בית",
};
