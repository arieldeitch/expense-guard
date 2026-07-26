/**
 * Local schema metadata — הגרסה של פורמט האחסון המקומי **במכשיר הזה**.
 *
 * זהו החוזה שמאפשר לשנות מבנה נתונים מקומי בלי לאבד נתונים: לפני שהאפליקציה
 * נוגעת בנתונים היא יודעת באיזו גרסה הם נשמרו, ומה מותר לעשות איתם.
 *
 * כללים (ADR-0033):
 * - `fitlog:storage-meta` הוא **metadata בלבד**. הוא אינו מחזיק נתוני משתמש.
 * - metadata חסר או פגום = `legacy` (המכשיר קדם ל-framework).
 * - `schema_version` גבוה מזה שהאפליקציה מכירה = **חסום**, לא "מנסים בכל זאת".
 * - המפתחות עצמם (`fitlog:<module>:v<n>`) **אינם משתנים** ואינם ממוזגים.
 */
import { isStorageAvailable, safeReadStorage, safeWriteRawStorage } from "./safeStorage";
import type { StorageWriteResult } from "./safeStorage";

import { STORAGE_KEY as CATALOG_KEY } from "@/lib/catalog/storage";
import { STORAGE_KEY as EXERCISES_KEY } from "@/lib/exercises/storage";
import { STORAGE_KEY as GOALS_KEY } from "@/lib/goals/storage";
import { STORAGE_KEY as HOME_KEY } from "@/lib/home/storage";
import { STORAGE_KEY as RUNS_KEY } from "@/lib/runs/storage";
import { STORAGE_KEY as SESSIONS_KEY } from "@/lib/sessions/storage";
import { STORAGE_KEY as SUUNTO_KEY } from "@/lib/suunto/storage";
import { STORAGE_KEY as TEMPLATES_KEY } from "@/lib/templates/storage";
import { PREFERENCES_STORAGE_KEY } from "@/lib/preferences";

/** מזהה הפורמט המקומי. שונה במכוון מ-`BACKUP_FORMAT` — זה אחסון, לא קובץ נייד. */
export const LOCAL_STORAGE_FORMAT = "workout-data-system-local";

/** גרסת ה-schema המקומי שהאפליקציה הזו יודעת לקרוא ולכתוב. */
export const LOCAL_SCHEMA_VERSION = "1.0.0";

export const STORAGE_META_KEY = "fitlog:storage-meta";

/** גרסה וירטואלית למכשיר שאין בו metadata כלל. */
export const LEGACY_VERSION = "legacy";

/**
 * תשעת מודולי האחסון. **הרשימה קפואה** — מפתח חדש דורש מיגרציה מפורשת
 * והעלאת `LOCAL_SCHEMA_VERSION`.
 */
export const STORAGE_MODULES = [
  "catalog",
  "exercises",
  "goals",
  "home",
  "preferences",
  "runs",
  "sessions",
  "suunto",
  "templates",
] as const;

export type StorageModule = (typeof STORAGE_MODULES)[number];

/**
 * מיפוי מודול → מפתח localStorage בפועל.
 * הערכים מיובאים מהמודולים עצמם ולא משוכפלים כאן, כדי שלא ייווצר drift.
 */
export const STORAGE_KEY_BY_MODULE: Record<StorageModule, string> = {
  catalog: CATALOG_KEY,
  exercises: EXERCISES_KEY,
  goals: GOALS_KEY,
  home: HOME_KEY,
  preferences: PREFERENCES_STORAGE_KEY,
  runs: RUNS_KEY,
  sessions: SESSIONS_KEY,
  suunto: SUUNTO_KEY,
  templates: TEMPLATES_KEY,
};

export interface StorageMeta {
  format: typeof LOCAL_STORAGE_FORMAT;
  schema_version: string;
  /** ISO-8601 UTC. */
  updated_at: string;
  storage_keys: string[];
}

export type LocalSchemaState =
  /** אין localStorage בסביבה הזו (SSR, מצב פרטי חסום). */
  | "unavailable"
  /** אין metadata — מכשיר שקדם ל-framework. */
  | "legacy"
  /** metadata קיים ותואם בדיוק ל-`LOCAL_SCHEMA_VERSION`. */
  | "current"
  /** metadata קיים אך ישן — נדרשת מיגרציה. */
  | "outdated"
  /** metadata חדש מהאפליקציה — **חסום**. */
  | "future";

export interface LocalSchemaStatus {
  state: LocalSchemaState;
  /** הגרסה שנקראה מהמכשיר, או `legacy` כשאין metadata. */
  version: string;
  meta: StorageMeta | null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** `1.2.3` → `[1,2,3]`. מחזיר null אם אינו semver פשוט. */
function parseVersion(version: string): [number, number, number] | null {
  const parts = version.split(".");
  if (parts.length !== 3) return null;
  const nums = parts.map((p) => (/^\d+$/.test(p) ? Number(p) : Number.NaN));
  if (nums.some((n) => Number.isNaN(n))) return null;
  return [nums[0], nums[1], nums[2]];
}

/** <0 אם a קודם ל-b, 0 אם שווים, >0 אם a מאוחר יותר. null = לא ניתן להשוואה. */
export function compareSchemaVersions(a: string, b: string): number | null {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

/**
 * קורא את ה-metadata. מחזיר null כשהוא חסר, אינו JSON תקין, אינו אובייקט,
 * או שה-`format` אינו הפורמט המקומי — כל אלה נחשבים `legacy`.
 */
export function readStorageMeta(): StorageMeta | null {
  const raw = safeReadStorage(STORAGE_META_KEY);
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (parsed.format !== LOCAL_STORAGE_FORMAT) return null;
  if (typeof parsed.schema_version !== "string" || parsed.schema_version.length === 0) return null;
  return {
    format: LOCAL_STORAGE_FORMAT,
    schema_version: parsed.schema_version,
    updated_at: typeof parsed.updated_at === "string" ? parsed.updated_at : "",
    storage_keys: Array.isArray(parsed.storage_keys)
      ? parsed.storage_keys.filter((k): k is string => typeof k === "string")
      : [],
  };
}

/** מסווג את מצב ה-schema במכשיר. אינו כותב דבר. */
export function readLocalSchemaStatus(): LocalSchemaStatus {
  if (!isStorageAvailable()) {
    return { state: "unavailable", version: LEGACY_VERSION, meta: null };
  }
  const meta = readStorageMeta();
  if (!meta) return { state: "legacy", version: LEGACY_VERSION, meta: null };

  const cmp = compareSchemaVersions(meta.schema_version, LOCAL_SCHEMA_VERSION);
  // גרסה שאינה ניתנת לפענוח נחשבת עתידית — עדיף לחסום מאשר לנחש.
  if (cmp === null) return { state: "future", version: meta.schema_version, meta };
  if (cmp === 0) return { state: "current", version: meta.schema_version, meta };
  if (cmp > 0) return { state: "future", version: meta.schema_version, meta };
  return { state: "outdated", version: meta.schema_version, meta };
}

/** בונה את ה-metadata הנוכחי. `now` מוזרק כדי שהבדיקות יהיו דטרמיניסטיות. */
export function buildStorageMeta(now: Date): StorageMeta {
  return {
    format: LOCAL_STORAGE_FORMAT,
    schema_version: LOCAL_SCHEMA_VERSION,
    updated_at: now.toISOString(),
    storage_keys: [...STORAGE_MODULES],
  };
}

/**
 * כותב את ה-metadata. **נקרא רק אחרי מיגרציה שהושלמה בהצלחה** — metadata הוא
 * ההצהרה "הנתונים במכשיר תואמים לגרסה הזו", ואסור שיקדים את הנתונים עצמם.
 */
export function writeStorageMeta(now: Date): StorageWriteResult {
  return safeWriteRawStorage(STORAGE_META_KEY, JSON.stringify(buildStorageMeta(now)));
}
