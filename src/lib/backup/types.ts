/**
 * Backup — מעטפת נתונים קנונית, portable ו-versioned.
 *
 * הפורמט **אינו תלוי** ב-localStorage ולא ב-Supabase. הוא מקור ההעברה העתידי
 * לענן: מזהים נשמרים כמות שהם, קשרים נשמרים דרך IDs, וכל הזמנים ISO-8601 UTC.
 * ראה `docs/ai/LOCAL_TO_SUPABASE_MIGRATION_CONTRACT.md` ו-ADR-0031.
 *
 * JSON-serializable בלבד: אין Date/Map/Set/undefined/פונקציות/מעגליות.
 */

/** גרסת ה-schema של המעטפת. שינוי breaking → העלאת major. */
export const BACKUP_SCHEMA_VERSION = "1.0.0";
export const BACKUP_FORMAT = "workout-data-system";

/** מודולי האחסון הנכללים בגיבוי — חייב לכסות את כל מפתחות `fitlog:*` העסקיים. */
export const BACKUP_MODULES = [
  "catalog",
  "exercises",
  "goals",
  "home",
  "runs",
  "sessions",
  "suunto",
  "templates",
  "preferences",
] as const;

export type BackupModule = (typeof BACKUP_MODULES)[number];

export interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  schema_version: string;
  exported_at: string;
  app_version: string;
  /** state מלא לכל מודול, לפי מפתח המודול. */
  entities: Record<string, unknown>;
  metadata: {
    entity_counts: Record<string, number>;
    integrity: {
      total_records: number;
      /** checksum דטרמיניסטי (FNV-1a) — ללא dependency חדשה. */
      checksum: string;
    };
  };
}

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code:
    | "unsupported_format"
    | "unsupported_schema_version"
    | "duplicate_id"
    | "dangling_reference"
    | "missing_required_field"
    | "invalid_timestamp"
    | "non_serializable"
    | "orphaned_record"
    | "missing_module";
  message: string;
  /** ישות/מודול שבו נמצאה הבעיה. */
  scope: string;
  /** מזהים מעורבים, אם רלוונטי. */
  ids?: string[];
}

export interface ValidationReport {
  ok: boolean;
  schema_version: string;
  entity_counts: Record<string, number>;
  issues: ValidationIssue[];
  checksum: string;
}

/** תוצאת השוואה בין גיבוי לנתונים הקיימים, לפני כתיבה. */
export interface ImportPreview {
  report: ValidationReport;
  /** רשומות שקיימות בגיבוי ולא במכשיר. */
  added: Record<string, number>;
  /** אותו id + אותו תוכן → no-op. */
  unchanged: Record<string, number>;
  /** אותו id + תוכן שונה → קונפליקט, לא נדרס בשקט. */
  conflicts: Record<string, number>;
  conflictIds: Record<string, string[]>;
}

export type ImportMode =
  /** מוסיף חדשים בלבד; קונפליקטים נשארים כפי שהם במכשיר. */
  | "merge_keep_local"
  /** מוסיף חדשים ומעדכן קונפליקטים לגרסת הגיבוי. דורש בחירה מפורשת. */
  | "merge_prefer_backup"
  /** מחליף מודול שלם בתוכן הגיבוי. דורש בחירה מפורשת. */
  | "replace";

export interface ImportResult {
  ok: boolean;
  mode: ImportMode;
  /** snapshot שנשמר לפני הכתיבה — לשחזור אם משהו השתבש. */
  snapshotKey: string | null;
  applied: Record<string, number>;
  conflicts: Record<string, number>;
  error: string | null;
}
