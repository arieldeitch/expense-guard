/**
 * safeStorage — ה-primitive המשותף לכל כתיבה מקומית.
 *
 * כל `writeXState` **חייב** לעבור דרך כאן. אין `catch {}` שקט: כל כתיבה מחזירה
 * תוצאה typed, וה-UI אינו רשאי להציג "נשמר" לפני `saved`.
 *
 * ראה ADR-0032.
 */

export type StorageFailureReason =
  | "quota_exceeded"
  | "serialization_failed"
  | "storage_unavailable"
  | "unknown";

export type StorageWriteStatus = "saved" | "memory_only" | "failed";

export interface StorageWriteResult {
  status: StorageWriteStatus;
  reason: StorageFailureReason | null;
  /** הודעה עובדתית להצגה למשתמש. null כאשר נשמר. */
  message: string | null;
}

const SAVED: StorageWriteResult = { status: "saved", reason: null, message: null };

const MEMORY_MESSAGE = "לא נשמר בדפדפן. הנתון עלול להיעלם לאחר רענון.";
const FAILED_MESSAGE = "השמירה נכשלה. נסה לייצא גיבוי לפני רענון.";

function memoryOnly(reason: StorageFailureReason): StorageWriteResult {
  return { status: "memory_only", reason, message: MEMORY_MESSAGE };
}

function failed(reason: StorageFailureReason): StorageWriteResult {
  return { status: "failed", reason, message: FAILED_MESSAGE };
}

function isQuotaError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  // DOMException code 22 / 1014 (Firefox), או שם מפורש.
  const name = e.name;
  const code = (e as unknown as { code?: number }).code;
  return (
    name === "QuotaExceededError" ||
    name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    code === 22 ||
    code === 1014
  );
}

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function safeReadStorage(key: string): string | null {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * כותב ערך מסודרל ל-localStorage ומחזיר תוצאה typed.
 *
 * - `saved` — נכתב בהצלחה, שורד refresh.
 * - `memory_only` — אין localStorage זמין, או שהמכסה מלאה. הקורא אחראי לשמור
 *   fallback בזיכרון; הנתון **לא** ישרוד refresh.
 * - `failed` — הערך אינו ניתן לסריאליזציה. אין מה לשמור, גם לא בזיכרון.
 */
export function safeWriteStorage(key: string, value: unknown): StorageWriteResult {
  let payload: string;
  try {
    payload = JSON.stringify(value);
  } catch {
    return failed("serialization_failed");
  }
  if (payload === undefined) return failed("serialization_failed");

  const storage = safeStorage();
  if (!storage) return memoryOnly("storage_unavailable");

  try {
    storage.setItem(key, payload);
    return SAVED;
  } catch (e) {
    return memoryOnly(isQuotaError(e) ? "quota_exceeded" : "unknown");
  }
}

// ---------- registry של מצב ההתמדה לכל המודולים ----------

const statuses = new Map<string, StorageWriteResult>();
const listeners = new Set<() => void>();
let cachedSnapshot: Readonly<Record<string, StorageWriteResult>> = Object.freeze({});

function rebuildSnapshot() {
  cachedSnapshot = Object.freeze(Object.fromEntries(statuses));
}

/** מדווח את תוצאת הכתיבה של מודול. נקרא ע"י כל `writeXState`. */
export function reportWrite(module: string, result: StorageWriteResult): StorageWriteResult {
  const prev = statuses.get(module);
  if (prev?.status !== result.status || prev?.reason !== result.reason) {
    statuses.set(module, result);
    rebuildSnapshot();
    listeners.forEach((l) => l());
  }
  return result;
}

export function subscribeStorageStatus(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** snapshot יציב (אותה הפניה בין קריאות) — בטוח ל-useSyncExternalStore. */
export function getStorageStatuses(): Readonly<Record<string, StorageWriteResult>> {
  return cachedSnapshot;
}

/** המצב הגרוע ביותר מבין כל המודולים — מה שה-UI צריך להציג. */
export function getWorstStorageStatus(): StorageWriteResult {
  let worst: StorageWriteResult = SAVED;
  let seenAny = false;
  for (const result of statuses.values()) {
    seenAny = true;
    if (result.status === "failed") return result;
    if (result.status === "memory_only") worst = result;
  }
  return seenAny ? worst : SAVED;
}

export function _resetStorageStatusesForTests(): void {
  statuses.clear();
  rebuildSnapshot();
}
