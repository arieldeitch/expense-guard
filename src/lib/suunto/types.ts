/**
 * Suunto / device readings — types.
 *
 * ארכיטקטורה:
 * - `RunDeviceReading` — שורה אחת פר-metric פר-מקור, זהה למודל היעד ב-Supabase.
 *   שומרת גם raw_value וגם normalized_value כדי לא לאבד את המקור.
 * - `SuuntoRunSnapshot` — תצוגת עזר שנגזרת מסט rows של source_type='suunto'
 *   עבור אותה ריצה. משמשת ל-UI ולהשוואה.
 * - `TreadmillCalibrationProfile` — הצעה/אישור כיול פר-הליכון עם versioning.
 *   לעולם לא משנה נתוני מקור, ורק מוסיף שכבת תצוגה אופציונלית.
 */

export type DeviceSourceType =
  | "suunto"
  | "treadmill"
  | "manual"
  | "import"
  | "screenshot"
  | "other";

export type DeviceInputMethod =
  | "manual"
  | "file_import"
  | "ocr"
  | "integration"
  | "manual_after_import";

/**
 * מפתחות מדדים סטנדרטיים. המשתמש רשאי להוסיף `custom:<slug>`.
 * שדות ליבה (זמינים ברוב שעוני Suunto) + שדות מתקדמים.
 */
export type MetricKey =
  | "distance_meters"
  | "duration_seconds"
  | "average_pace_s_per_km"
  | "average_speed_kmh"
  | "max_speed_kmh"
  | "average_heart_rate"
  | "max_heart_rate"
  | "average_cadence_spm"
  | "calories"
  | "training_effect"
  | "peak_training_effect"
  | "epoc_ml_kg"
  | "recovery_time_hours"
  | "ascent_m"
  | "descent_m"
  | "notes"
  | (string & { readonly __custom?: unique symbol }); // allow "custom:<slug>"

/** יחידה מנורמלת פר-metric. */
export type Unit =
  | "m"
  | "s"
  | "kmh"
  | "s_per_km"
  | "bpm"
  | "spm"
  | "kcal"
  | "hours"
  | "index" // Training Effect (0..5)
  | "ml_kg"
  | "text"
  | "custom";

export interface RunDeviceReading {
  id: string;
  owner_id: string;
  run_session_id: string;

  source_type: DeviceSourceType;
  device_name: string | null; // "Suunto Race", "LifeFitness IC7"
  device_model: string | null;

  metric_key: MetricKey;
  /** ערך גולמי כפי שהמשתמש הזין / התקבל מהמקור. */
  raw_value: number | string | null;
  /** ערך מנורמל ליחידת בסיס לפי metric_key. null אם לא רלוונטי (למשל notes). */
  normalized_value: number | null;
  /** יחידת התצוגה שבה המקור מוצג. */
  raw_unit: string | null;
  /** יחידת הבסיס המנורמלת. */
  unit: Unit;

  /** מתי נמדד בפועל (אם ידוע). */
  captured_at: string | null;
  /** מתי הוזן במערכת. */
  entered_at: string;
  input_method: DeviceInputMethod;

  /** 0..1, ביטחון בקריאה (למשל 1.0 להזנה ידנית, 0.7 לצילום). */
  confidence: number;

  /** שדות חופשיים — למשל custom_label לשדה מותאם. */
  metadata: Record<string, unknown>;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** קלט חלקי — repo משלים id/owner/created/updated. */
export type NewRunDeviceReading = Omit<
  RunDeviceReading,
  "id" | "owner_id" | "created_at" | "updated_at" | "deleted_at"
>;

/** מדד מותאם אישית שהמשתמש הוסיף בטופס. נשמר כ-reading עם metric_key=`custom:<slug>`. */
export interface CustomMetricInput {
  label: string;
  value: number | string;
  unit: string | null;
}

/**
 * תצוגת snapshot של ריצה ממקור Suunto (או כל מקור אחר), שנבנית מ-rows.
 * שדות null = אין נתון. משמש ל-UI, השוואה וכיול.
 */
export interface DeviceRunSnapshot {
  source_type: DeviceSourceType;
  device_name: string | null;
  device_model: string | null;
  entered_at: string | null;

  distance_meters: number | null;
  duration_seconds: number | null;
  average_pace_s_per_km: number | null;
  average_speed_kmh: number | null;
  max_speed_kmh: number | null;

  average_heart_rate: number | null;
  max_heart_rate: number | null;
  average_cadence_spm: number | null;
  calories: number | null;

  training_effect: number | null;
  peak_training_effect: number | null;
  epoc_ml_kg: number | null;
  recovery_time_hours: number | null;

  ascent_m: number | null;
  descent_m: number | null;

  notes: string | null;

  custom: { key: string; label: string; value: number | string; unit: string | null }[];
}

// ---------- Calibration ----------

export type CalibrationStatus =
  | "draft"
  | "proposed"
  | "approved"
  | "revoked"
  | "superseded"
  | "archived";

export type CalibrationMethod =
  | "median_ratio_distance"
  | "mean_ratio_distance"
  | "manual";

export type ConfidenceLabel =
  | "insufficient" // <3 מדגמים
  | "low" // 3
  | "preliminary" // 4
  | "basic" // 5..9
  | "moderate" // 10..19
  | "relatively_high"; // 20+

export interface TreadmillCalibrationProfile {
  id: string;
  owner_id: string;
  treadmill_id: string;

  /** מקדם: real_distance ≈ treadmill_distance * factor. */
  factor: number;
  calculation_method: CalibrationMethod;
  sample_size: number;
  period_start: string | null;
  period_end: string | null;
  confidence_label: ConfidenceLabel;

  included_run_ids: string[];
  excluded_run_ids: string[];

  /** אבחונים משוכפלים לצורך תצוגה שקופה — נשמרים בזמן היצירה. */
  diagnostics: {
    mean_ratio: number;
    median_ratio: number;
    stddev_percent: number;
    min_ratio: number;
    max_ratio: number;
    median_distance_diff_percent: number;
  };

  status: CalibrationStatus;
  approved_at: string | null;
  revoked_at: string | null;

  notes: string | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * "החרגת ריצה" מחישוב הכיול — פר-הליכון. אינו מוחק את הריצה.
 */
export interface CalibrationExclusion {
  id: string;
  owner_id: string;
  treadmill_id: string;
  run_session_id: string;
  reason: string | null;
  created_at: string;
}
