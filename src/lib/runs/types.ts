/**
 * Runs domain — types for running sessions, segments, and fixed routes.
 *
 * מודל היעד: משתמש יחיד, soft delete, raw ≠ derived, provenance לכל מדד.
 * שדות מספריים נשמרים ביחידות בסיס (מטרים, שניות, ק"מ/שעה, פעימות/דקה).
 * יחידות תצוגה נגזרות מהעדפות המשתמש בעתיד.
 *
 * ARCHITECTURE:
 * - RunSession = הרשומה העיקרית. כוללת גם raw וגם derived; שדה `provenance`
 *   מציין מקור לכל מדד ("manual" | "device" | "derived" | "suunto").
 * - SuuntoReading = תא raw נפרד (עתידי) — כרגע יש רק hook, אין אחסון.
 * - RunSegment = חלוקה אופציונלית של סשן. סכומים לא דורסים את הסיכום הכללי.
 * - RunningRoute = מסלול קבוע שניתן לשימוש חוזר.
 */

export type RunType = "treadmill" | "outdoor";
export type RunStatus = "draft" | "completed" | "archived";

/** מקור של ערך בודד. */
export type Source = "manual" | "device" | "derived" | "suunto" | "imported";

/** Provenance = מפה שדה→מקור. שדות שלא מופיעים = manual (ברירת מחדל). */
export type Provenance = Partial<Record<RunNumericField, Source>>;

export type RunNumericField =
  | "duration_seconds"
  | "distance_meters"
  | "average_speed_kmh"
  | "max_speed_kmh"
  | "average_pace_s_per_km"
  | "average_incline_pct"
  | "max_incline_pct"
  | "calories"
  | "average_heart_rate"
  | "max_heart_rate"
  | "average_cadence_spm"
  | "elevation_gain_m"
  | "elevation_loss_m";

export interface RunSegment {
  id: string;
  sequence: number;
  segment_type: "warmup" | "work" | "recovery" | "cooldown" | "custom";
  duration_seconds: number | null;
  distance_meters: number | null;
  average_speed_kmh: number | null;
  average_pace_s_per_km: number | null;
  incline_pct: number | null;
  notes: string | null;
}

export interface RunSession {
  id: string;
  owner_id: string;
  run_type: RunType;
  status: RunStatus;

  /** תאריך + שעה מקומית של תחילת הריצה, ISO. */
  started_at: string;
  /** null עד שהריצה מסתיימת/נשמרת עם משך. */
  ended_at: string | null;
  timezone: string;

  // Metrics — יחידות בסיס.
  duration_seconds: number | null;
  distance_meters: number | null;
  average_speed_kmh: number | null;
  max_speed_kmh: number | null;
  average_pace_s_per_km: number | null;
  average_incline_pct: number | null;
  max_incline_pct: number | null;
  calories: number | null;
  average_heart_rate: number | null;
  max_heart_rate: number | null;
  average_cadence_spm: number | null;
  elevation_gain_m: number | null;
  elevation_loss_m: number | null;

  // Location + equipment refs.
  location_id: string | null;
  treadmill_id: string | null;
  route_id: string | null;
  country_code: string | null;
  city_or_area: string | null;
  free_text_location: string | null;

  perceived_effort: number | null; // 1..10
  notes: string | null;

  segments: RunSegment[];

  /** מפה לכל שדה מספרי — מה המקור שלו. */
  provenance: Provenance;
  /** רשימת שדות שהמשתמש אישר במפורש למרות אזהרת חריגה. */
  outlier_overrides: RunNumericField[];
  /** 0..1, הערכה של כמות המידע שמולא. */
  data_completeness: number;
  /** מקור הריצה המרכזי (manual | suunto | imported). */
  primary_source: Source;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** קלט ליצירה/עדכון של סשן. ה-repo מוסיף id/timestamps. */
export type RunSessionInput = Omit<
  RunSession,
  "id" | "owner_id" | "created_at" | "updated_at" | "deleted_at"
>;

export interface RunningRoute {
  id: string;
  owner_id: string;
  name: string;
  route_type: "fixed" | "park" | "road" | "trail" | "city" | "loop" | "other";
  location_id: string | null;
  country_code: string | null;
  city_or_area: string | null;
  typical_distance_meters: number | null;
  description: string | null;
  notes: string | null;
  image_url: string | null;
  is_favorite: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type NewRunningRoute = Omit<
  RunningRoute,
  "id" | "owner_id" | "created_at" | "updated_at" | "deleted_at"
>;

/** Audit entry ל-run — פנימי, לתיעוד שינויים בעתיד. */
export interface RunAuditEntry {
  id: string;
  run_id: string;
  action: "create" | "update" | "delete" | "restore" | "override_outlier";
  changed_fields: string[];
  previous: Partial<RunSession> | null;
  occurred_at: string;
}
