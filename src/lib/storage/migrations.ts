/**
 * Local migration framework — registry מפורש של מיגרציות schema מקומיות.
 *
 * חוזה (ADR-0033):
 * 1. **snapshot לפני שינוי.** אם ה-snapshot לא נוצר או לא אומת — לא נוגעים בנתונים.
 * 2. **חישוב לפני כתיבה.** כל המיגרציות רצות בזיכרון; כתיבה מתחילה רק אם כולן הצליחו.
 * 3. **כשל אינו משאיר מצב ביניים.** כשל באמצע הכתיבה → rollback מה-snapshot.
 * 4. **metadata נכתב אחרון.** הוא ההצהרה שהנתונים תואמים לגרסה, ולא הבטחה מוקדמת.
 * 5. **אין מחיקת נתונים.** מיגרציה שמנסה לאפס מפתח קיים נחשבת כשל.
 * 6. **idempotent.** הרצה חוזרת על מכשיר מעודכן היא no-op מלא (ללא snapshot וללא כתיבה).
 */
import {
  safeRemoveStorage,
  safeWriteRawStorage,
  type StorageWriteResult,
} from "./safeStorage";
import {
  LEGACY_VERSION,
  LOCAL_SCHEMA_VERSION,
  STORAGE_KEY_BY_MODULE,
  STORAGE_MODULES,
  readLocalSchemaStatus,
  writeStorageMeta,
  type StorageModule,
} from "./schema";
import {
  createMigrationSnapshot,
  readRawStorageKeys,
  rollbackFromSnapshot,
  type MigrationSnapshot,
  type RawStorageKeys,
} from "./snapshot";

export interface LocalMigration {
  id: string;
  /** הגרסה שממנה המיגרציה יוצאת (`legacy` = מכשיר ללא metadata). */
  from: string;
  /** הגרסה שאליה היא מגיעה. */
  to: string;
  description: string;
  /**
   * מקבל את כל ה-payloads הגולמיים ומחזיר את החדשים.
   * חייבת להיות **טהורה, idempotent ולא הרסנית**. זריקת שגיאה = המיגרציה נכשלה.
   */
  run: (input: RawStorageKeys) => RawStorageKeys;
}

/**
 * legacy → 1.0.0.
 *
 * נורמליזציה בלבד: כל payload נקרא, **מאומת שהוא JSON תקין**, ונכתב מחדש
 * בסריאליזציה קנונית. שדות לא מוכרים נשמרים במלואם (אין coercion לטיפוסי המודול),
 * מפתח חסר נשאר חסר, ושום רשומה אינה נמחקת.
 *
 * המטרה אינה לשנות נתונים אלא **להצהיר עליהם**: מהרגע הזה למכשיר יש גרסת schema.
 */
const legacyToV1: LocalMigration = {
  id: "legacy->1.0.0",
  from: LEGACY_VERSION,
  to: "1.0.0",
  description: "אימות ונורמליזציה של תשעת מפתחות האחסון, ללא שינוי תוכן.",
  run: (input) => {
    const out = {} as RawStorageKeys;
    for (const mod of STORAGE_MODULES) {
      const raw = input[mod];
      if (raw === null) {
        out[mod] = null;
        continue;
      }
      // parse נכשל → throw → הרצה מסומנת migration_failed, ללא נגיעה במקור.
      const parsed: unknown = JSON.parse(raw);
      out[mod] = JSON.stringify(parsed);
    }
    return out;
  },
};

/** ה-registry. הסדר קובע את שרשרת המעבר בין גרסאות. */
export const LOCAL_MIGRATIONS: readonly LocalMigration[] = [legacyToV1];

export type MigrationStatus =
  /** המכשיר כבר בגרסה הנוכחית — no-op. */
  | "up_to_date"
  | "migrated"
  /** נתוני המכשיר חדשים מהאפליקציה — לא בוצע שינוי. */
  | "future_version_blocked"
  | "migration_failed"
  | "storage_unavailable";

export interface MigrationResult {
  status: MigrationStatus;
  from_version: string;
  target_version: string;
  /** מזהי המיגרציות שהוחלו בפועל. */
  applied: string[];
  snapshot_id: string | null;
  /** האם בוצע rollback מוצלח לאחר כשל. null כשלא נדרש rollback. */
  rolled_back: boolean | null;
  /** הודעה עובדתית להצגה למשתמש. null כשאין מה לדווח. */
  message: string | null;
}

const UNAVAILABLE_MESSAGE =
  "האחסון המקומי אינו זמין בדפדפן הזה. שינויים לא יישמרו לאחר רענון.";

function futureMessage(deviceVersion: string): string {
  return `הנתונים במכשיר נשמרו בגרסת schema ${deviceVersion}, חדשה יותר מזו שהאפליקציה תומכת בה (${LOCAL_SCHEMA_VERSION}). לא בוצע שינוי בנתונים.`;
}

function failureMessage(detail: string, rolledBack: boolean | null): string {
  const tail =
    rolledBack === false
      ? " חלק מהמפתחות לא הוחזרו למצבם הקודם — אל תרענן לפני הורדת גיבוי."
      : " הנתונים הוחזרו למצבם הקודם.";
  return `עדכון מבנה הנתונים המקומי נכשל: ${detail}.${rolledBack === null ? " לא בוצע שינוי בנתונים." : tail}`;
}

/** בונה את שרשרת המיגרציות מגרסה נתונה ועד הגרסה הנוכחית. null = אין מסלול. */
function planChain(fromVersion: string): LocalMigration[] | null {
  const chain: LocalMigration[] = [];
  const seen = new Set<string>();
  let cursor = fromVersion;
  while (cursor !== LOCAL_SCHEMA_VERSION) {
    if (seen.has(cursor)) return null; // הגנה מפני מעגל ב-registry
    seen.add(cursor);
    const next = LOCAL_MIGRATIONS.find((m) => m.from === cursor);
    if (!next) return null;
    chain.push(next);
    cursor = next.to;
  }
  return chain;
}

/**
 * מריץ את המיגרציות המקומיות. בטוח לקריאה חוזרת.
 *
 * @param now מוזרק כדי שהבדיקות והחותמות יהיו דטרמיניסטיות.
 */
export function runLocalMigrations(now: Date = new Date()): MigrationResult {
  const schema = readLocalSchemaStatus();
  const base = {
    from_version: schema.version,
    target_version: LOCAL_SCHEMA_VERSION,
    applied: [] as string[],
    snapshot_id: null as string | null,
    rolled_back: null as boolean | null,
  };

  if (schema.state === "unavailable") {
    return { ...base, status: "storage_unavailable", message: UNAVAILABLE_MESSAGE };
  }
  if (schema.state === "future") {
    return {
      ...base,
      status: "future_version_blocked",
      message: futureMessage(schema.version),
    };
  }
  if (schema.state === "current") {
    // no-op מלא: אין snapshot, אין כתיבה, אין metadata חדש.
    return { ...base, status: "up_to_date", message: null };
  }

  const chain = planChain(schema.version);
  if (!chain) {
    return {
      ...base,
      status: "migration_failed",
      message: failureMessage(`אין מסלול מיגרציה מגרסה ${schema.version}`, null),
    };
  }

  const before = readRawStorageKeys();

  // (1) snapshot מאומת לפני כל שינוי.
  const snapshot = createMigrationSnapshot(schema.version, LOCAL_SCHEMA_VERSION, now);
  if (!snapshot) {
    return {
      ...base,
      status: "migration_failed",
      message: failureMessage("לא ניתן היה ליצור גיבוי מקומי לפני העדכון", null),
    };
  }
  base.snapshot_id = snapshot.snapshot_id;

  // (2) חישוב מלא בזיכרון. כשל כאן אינו נוגע במקור כלל.
  let next = before;
  for (const migration of chain) {
    try {
      next = migration.run(next);
    } catch (e) {
      return {
        ...base,
        status: "migration_failed",
        message: failureMessage(
          `${migration.id} — ${e instanceof Error ? e.message : "שגיאה לא ידועה"}`,
          null,
        ),
      };
    }
  }

  // (3) הגנת אי-מחיקה: מפתח שהיה קיים חייב להישאר קיים.
  for (const mod of STORAGE_MODULES) {
    if (before[mod] !== null && next[mod] === null) {
      return {
        ...base,
        status: "migration_failed",
        message: failureMessage(`המיגרציה ניסתה למחוק את הנתונים של ${mod}`, null),
      };
    }
  }

  // (4) כתיבה. כשל באמצע → rollback מלא מה-snapshot.
  const failAndRollback = (detail: string, snap: MigrationSnapshot): MigrationResult => {
    const rollback = rollbackFromSnapshot(snap);
    return {
      ...base,
      status: "migration_failed",
      rolled_back: rollback.ok,
      message: failureMessage(detail, rollback.ok),
    };
  };

  for (const mod of STORAGE_MODULES) {
    if (next[mod] === before[mod]) continue;
    const key = STORAGE_KEY_BY_MODULE[mod];
    const value = next[mod];
    const result: StorageWriteResult =
      value === null ? safeRemoveStorage(key) : safeWriteRawStorage(key, value);
    if (result.status !== "saved") {
      return failAndRollback(`הכתיבה של ${mod} נכשלה`, snapshot);
    }
  }

  // (5) metadata אחרון — רק אחרי שכל הנתונים נכתבו בהצלחה.
  const metaResult = writeStorageMeta(now);
  if (metaResult.status !== "saved") {
    return failAndRollback("לא ניתן היה לכתוב את גרסת ה-schema", snapshot);
  }

  return {
    ...base,
    status: "migrated",
    applied: chain.map((m) => m.id),
    message: null,
  };
}

// ---------- singleton להרצה אחת לכל טעינת עמוד ----------

let cachedRun: MigrationResult | null = null;

/**
 * מריץ את המיגרציות **פעם אחת** בכל טעינת עמוד ומחזיר את אותה תוצאה בהמשך.
 * נדרש כי הרכיב הגלובלי עלול להירנדר מספר פעמים (StrictMode, ניווטים).
 */
export function runLocalMigrationsOnce(): MigrationResult {
  if (cachedRun === null) cachedRun = runLocalMigrations();
  return cachedRun;
}

export function _resetMigrationRunCacheForTests(): void {
  cachedRun = null;
}
