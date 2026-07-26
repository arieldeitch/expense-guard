/**
 * Migration snapshot — עותק גולמי והפיך של כל מפתחות האחסון, **לפני** מיגרציה.
 *
 * זה אינו ה-snapshot של Restore (`fitlog:backup-snapshot:*`, ADR-0031) ואינו דורס
 * אותו: מפתח נפרד, מטרה נפרדת. ה-snapshot כאן שומר **מחרוזות גולמיות** ולא state
 * מפוענח, כדי שהשחזור יחזיר בדיוק את מה שהיה — כולל שדות שהאפליקציה אינה מכירה.
 *
 * ראה ADR-0033.
 */
import { checksumOf } from "./checksum";
import {
  safeReadStorage,
  safeRemoveStorage,
  safeWriteRawStorage,
  type StorageWriteResult,
} from "./safeStorage";
import { STORAGE_KEY_BY_MODULE, STORAGE_MODULES, type StorageModule } from "./schema";

/** ה-snapshot של המיגרציה האחרונה. נשמר עד למיגרציה הבאה. */
export const MIGRATION_SNAPSHOT_KEY = "fitlog:migration-snapshot";

/** מודול → payload גולמי. `null` = המפתח לא היה קיים במכשיר. */
export type RawStorageKeys = Record<StorageModule, string | null>;

export interface MigrationSnapshot {
  snapshot_id: string;
  /** ISO-8601 UTC. */
  created_at: string;
  from_version: string;
  target_version: string;
  /** ממופתח בשם המודול (כמו `storage_keys` ב-metadata), לא במפתח localStorage. */
  keys: RawStorageKeys;
  /** checksum של `keys` בלבד — מזהה snapshot פגום או שנחתך. */
  checksum: string;
}

/** קורא את כל תשעת המפתחות כמחרוזות גולמיות, ללא parse וללא coercion. */
export function readRawStorageKeys(): RawStorageKeys {
  const out = {} as RawStorageKeys;
  for (const mod of STORAGE_MODULES) {
    out[mod] = safeReadStorage(STORAGE_KEY_BY_MODULE[mod]);
  }
  return out;
}

/** האם ה-checksum של ה-snapshot תואם לתוכן שלו. */
export function verifyMigrationSnapshot(snapshot: MigrationSnapshot): boolean {
  return checksumOf(snapshot.keys) === snapshot.checksum;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** קורא את snapshot המיגרציה האחרון. null אם אינו קיים או אינו תקין מבנית. */
export function readMigrationSnapshot(): MigrationSnapshot | null {
  const raw = safeReadStorage(MIGRATION_SNAPSHOT_KEY);
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || !isRecord(parsed.keys)) return null;
  if (typeof parsed.snapshot_id !== "string" || typeof parsed.checksum !== "string") return null;

  const keys = {} as RawStorageKeys;
  for (const mod of STORAGE_MODULES) {
    const value = (parsed.keys as Record<string, unknown>)[mod];
    keys[mod] = typeof value === "string" ? value : null;
  }

  return {
    snapshot_id: parsed.snapshot_id,
    created_at: typeof parsed.created_at === "string" ? parsed.created_at : "",
    from_version: typeof parsed.from_version === "string" ? parsed.from_version : "",
    target_version: typeof parsed.target_version === "string" ? parsed.target_version : "",
    keys,
    checksum: parsed.checksum,
  };
}

/**
 * יוצר snapshot, כותב אותו, **וקורא אותו בחזרה כדי לאמת**.
 *
 * snapshot שלא ניתן לקרוא או שה-checksum שלו אינו תואם אינו גיבוי — במקרה כזה
 * מוחזר null, והקורא חייב להימנע מכל שינוי בנתוני המקור.
 */
export function createMigrationSnapshot(
  fromVersion: string,
  targetVersion: string,
  now: Date,
): MigrationSnapshot | null {
  const keys = readRawStorageKeys();
  const checksum = checksumOf(keys);
  const created_at = now.toISOString();
  const snapshot: MigrationSnapshot = {
    snapshot_id: `mig-${created_at}-${checksum}`,
    created_at,
    from_version: fromVersion,
    target_version: targetVersion,
    keys,
    checksum,
  };

  let payload: string;
  try {
    payload = JSON.stringify(snapshot);
  } catch {
    return null;
  }

  if (safeWriteRawStorage(MIGRATION_SNAPSHOT_KEY, payload).status !== "saved") return null;

  const back = readMigrationSnapshot();
  if (!back || back.snapshot_id !== snapshot.snapshot_id || !verifyMigrationSnapshot(back)) {
    return null;
  }
  return back;
}

export interface RollbackResult {
  ok: boolean;
  /** מודולים שלא הצליחו לחזור למצבם הקודם. */
  failed: StorageModule[];
}

/**
 * מחזיר את כל המפתחות למצבם ב-snapshot. מפתח שלא היה קיים — נמחק.
 * ה-snapshot **אינו נמחק** אחרי rollback: הוא הראיה למה שקרה.
 */
export function rollbackFromSnapshot(snapshot: MigrationSnapshot): RollbackResult {
  const failed: StorageModule[] = [];
  for (const mod of STORAGE_MODULES) {
    const key = STORAGE_KEY_BY_MODULE[mod];
    const value = snapshot.keys[mod];
    const result: StorageWriteResult =
      value === null ? safeRemoveStorage(key) : safeWriteRawStorage(key, value);
    if (result.status !== "saved") failed.push(mod);
  }
  return { ok: failed.length === 0, failed };
}
