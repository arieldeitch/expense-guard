/**
 * Home domain — types for `HomeSession`, `HomeExerciseEntry`, `HomeExerciseSet`,
 * `HomeTemplate`. שכבה עצמאית מ־Strength Sessions כדי להתאים לדפוסי בית:
 * דיווח מהיר של תרגיל יחיד, סבבים, זמן, ימין/שמאל.
 *
 * הכל local-first (localStorage). אין דרישות snapshot מורכבות של תבניות
 * כמו ב־Gym — snapshot מינימלי נשמר בעת התחלת session מתבנית.
 *
 * מקורות אמת נלווים:
 *  - product-requirements.md §2 (תחומי אימון), §3 (UX), §4 (דאטה).
 *  - metrics-home.md — נוסחאות ומדדים.
 */
import type { TrackingType } from "@/lib/exercises";
import type { WeightUnit } from "@/lib/templates";
// אין תלות ישירה ב־Gym; מיוצר type עצמאי לצורך snapshot מתבנית.

/** סטטוסים ל־HomeSession — חופפים ל־PR "מודל אימון ביתי". */
export type HomeSessionStatus =
  | "draft" // טיוטה — טרם התחלה
  | "in_progress" // פעיל
  | "paused" // הושהה ידנית
  | "completed" // הושלם
  | "partial" // הופסק מוקדם עם דיווח חלקי
  | "abandoned" // ננטש
  | "archived" // בארכיון
  | "trashed"; // בסל מחזור

/** סוגי סט תואמים ל־Gym כדי לאפשר שיתוף נוסחאות איפה שהגיוני. */
export type HomeSetType = "regular" | "warmup" | "dropset" | "amrap" | "failure" | "test";

/** snapshot קפוא של תבנית בעת התחלת session. */
export interface HomeTemplateSnapshot {
  template_id: string;
  template_version: number;
  name: string;
  rounds: number; // 1 = flat, >1 = circuit
  planned_duration_seconds: number | null;
  entries: Array<{
    exercise_id: string;
    exercise_name: string;
    tracking_type: TrackingType;
    unilateral: boolean;
    default_sets: number;
    planned_reps: number | null;
    planned_reps_min: number | null;
    planned_reps_max: number | null;
    planned_duration_seconds: number | null;
    planned_added_weight: number | null;
    weight_unit: WeightUnit;
    rest_seconds: number | null;
    notes: string | null;
  }>;
}

export interface HomeExerciseSet {
  id: string;
  entry_id: string;
  set_number: number; // 1-based ברצף הסטים של אותו תרגיל
  tracking_type: TrackingType;

  reps: number | null;
  duration_seconds: number | null;

  side: "left" | "right" | null; // ל־left_right_reps
  added_weight: number | null; // ל־bodyweight_plus_weight
  weight_unit: WeightUnit;
  assistance_value: number | null; // ל־assisted_reps

  round_number: number | null; // רק ב־circuit; null אם flat
  rpe: number | null; // 1-10
  rir: number | null; // 0-5

  set_type: HomeSetType;
  notes: string | null;

  completed: boolean;
  skipped: boolean;

  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** snapshot של פרטי התרגיל בעת יצירת entry. */
export interface HomeExerciseEntrySnapshot {
  exercise_id: string;
  exercise_name: string;
  tracking_type: TrackingType;
  unilateral: boolean;
  primary_muscle_group_id: string | null;
  planned_sets: number | null;
  planned_reps: number | null;
  planned_reps_min: number | null;
  planned_reps_max: number | null;
  planned_duration_seconds: number | null;
  planned_added_weight: number | null;
  weight_unit: WeightUnit;
  rest_seconds: number | null;
  notes: string | null;
}

export interface HomeExerciseEntry {
  id: string;
  home_session_id: string;
  exercise_id: string;
  sequence: number; // 0-based
  snapshot: HomeExerciseEntrySnapshot;
  notes: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface HomeSession {
  id: string;
  owner_id: string;

  template_id: string | null;
  template_version: number | null;
  template_snapshot: HomeTemplateSnapshot | null;

  /** דיווח מהיר של תרגיל יחיד מציין את התרגיל הראשי. */
  primary_exercise_id: string | null;
  /** true אם זה session מסוג "דיווח מהיר" (single-exercise). */
  is_quick_entry: boolean;

  name: string; // "שכיבות סמיכה", "אימון בית — full body" וכו'
  started_at: string;
  ended_at: string | null;
  timezone: string;
  duration_seconds: number | null;

  status: HomeSessionStatus;
  notes: string | null;

  perceived_effort: number | null; // 1-10
  self_reported_quality: number | null; // 1-5

  /** ציון איכות מחושב (0-100) — נקבע בסיום/סגירה. */
  quality_score: number | null;
  quality_score_details: string[] | null;
  data_completeness: number | null; // 0-100

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ---------- Templates ----------

export type HomeTemplateStatus = "active" | "archived" | "trashed";

export interface HomeTemplateEntry {
  id: string;
  template_id: string;
  exercise_id: string;
  sequence: number; // 0-based
  planned_sets: number; // ברירת מחדל 3
  planned_reps: number | null; // ברירת מחדל 12
  planned_reps_min: number | null;
  planned_reps_max: number | null;
  planned_duration_seconds: number | null; // לתרגילי time
  planned_added_weight: number | null;
  weight_unit: WeightUnit;
  rest_seconds: number | null; // ברירת מחדל 60
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface HomeTemplate {
  id: string;
  owner_id: string;
  parent_template_id: string | null; // לשכפול
  name: string;
  description: string | null;
  version: number; // עולה עם saveVersion
  rounds: number; // 1 = flat; >1 = circuit
  status: HomeTemplateStatus;
  is_favorite: boolean;
  notes: string | null;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface HomeTemplateVersion {
  id: string;
  template_id: string;
  version: number;
  snapshot: HomeTemplateSnapshot;
  created_at: string;
}

// ---------- Derived / view types ----------

export interface HomeSetSummary {
  totalSets: number;
  completedSets: number;
  skippedSets: number;
  totalReps: number;
  totalDurationSeconds: number;
  averageReps: number | null;
  medianReps: number | null;
  maxReps: number | null;
  minReps: number | null;
  firstSetReps: number | null;
  lastSetReps: number | null;
  /** ירידה: last/first. null אם חסר. */
  lastToFirstRatio: number | null;
  /** מדד יציבות (0-1) — 1 - CV, נחתך ל־[0,1]. null אם <2 סטים חוקיים. */
  stability: number | null;
  /** סטיית תקן על החזרות. */
  stdev: number | null;
  /** מקדם שונות (stdev/mean). null אם mean=0. */
  cv: number | null;
}

export interface HomePreviousPerformance {
  sessionId: string;
  sessionDate: string;
  totalReps: number | null;
  totalDurationSeconds: number | null;
  maxRepsInSet: number | null;
  longestHoldSeconds: number | null;
  sets: Array<
    Pick<
      HomeExerciseSet,
      | "set_number"
      | "reps"
      | "duration_seconds"
      | "added_weight"
      | "weight_unit"
      | "side"
      | "round_number"
    >
  >;
  note: string | null;
}

export interface HomeRecord {
  kind:
    | "top_reps_in_set" // חזרות רצופות בסט יחיד
    | "top_reps_in_session" // סך חזרות באימון
    | "top_avg_reps_per_set"
    | "top_hold_seconds"
    | "top_rounds"
    | "top_reps_per_minute"
    | "top_added_weight"
    | "same_load_lower_rpe"; // ביצוע זהה RPE נמוך יותר
  value: number;
  units: "reps" | "seconds" | "rounds" | "reps_per_minute" | "kg" | "rpe";
  exerciseId: string;
  sessionId: string;
  isBaseline: boolean;
  achievedAt: string;
}

export interface HomeExerciseHistorySummary {
  exerciseId: string;
  timesPerformed: number;
  lastSessionAt: string | null;
  daysSinceLast: number | null;
  topRepsInSet: number | null;
  topRepsInSession: number | null;
  topAvgRepsPerSet: number | null;
  topHoldSeconds: number | null;
  totalRepsAllTime: number;
  totalDurationAllTime: number;
  frequencyPerWeek: number | null; // ממוצע 4 שבועות אחרונים
  averageDaysBetween: number | null;
  medianRepsPerSet: number | null;
  trend: "up" | "down" | "flat" | "insufficient_data";
}

// ---------- Inputs ----------

export type NewHomeSessionInput = Partial<
  Pick<
    HomeSession,
    | "template_id"
    | "template_version"
    | "template_snapshot"
    | "primary_exercise_id"
    | "is_quick_entry"
    | "name"
    | "notes"
  >
>;

export interface QuickEntryInput {
  exercise_id: string;
  name?: string;
}
