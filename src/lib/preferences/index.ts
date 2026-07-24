/**
 * Preferences repository — abstraction ל־user preferences.
 * כרגע מגובה localStorage. יוחלף ב־Supabase profile row בעתיד בלי לגעת ב־UI.
 *
 * מוצע: כל preference הוא string simple, עם schema ברור.
 */

export type LandingModule = "home" | "running" | "gym" | "home-workout";

export type Preferences = {
  /** לאיזה מסך לפתוח לאחר login/refresh. "home" = launchpad. */
  landingModule: LandingModule;
};

const STORAGE_KEY = "fitlog:preferences:v1";

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

export function readPreferences(): Preferences {
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

const listeners = new Set<() => void>();

export function writePreferences(next: Partial<Preferences>): Preferences {
  const current = readPreferences();
  const merged: Preferences = { ...current, ...next };
  const storage = safeGetStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
  return merged;
}

export function subscribePreferences(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
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
