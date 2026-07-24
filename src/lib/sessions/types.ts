/**
 * Strength Sessions — types.
 *
 * מודל שלוש־שכבתי:
 *   StrengthSession → StrengthSessionExercise → StrengthSet
 *
 * snapshot נשמר בעת ההתחלה מתבנית. עריכות לתבנית לאחר מכן לא משפיעות על session.
 * הכל local-first (localStorage). autosave מתרחש אוטומטית ברמת ה־store.
 *
 * שדות זמן נשמרים כ־ISO timestamps כדי לחשב משך על סמך זמן קיר, לא interval.
 */
import type { SetType, WeightUnit, WorkoutTemplateSnapshot } from "@/lib/templates";
import type { TrackingType } from "@/lib/exercises";

/** סטטוס אימון. חופף ל־PR §מודל session. */
export type SessionStatus =
  | "draft" // טיוטה — לא הופעל timer
  | "in_progress" // אימון פעיל
  | "paused" // הושהה ידנית
  | "completed" // הושלם
  | "abandoned" // ננטש (המשתמש בחר לצאת)
  | "archived" // בארכיון
  | "trashed"; // בסל מחזור

/** ערך "בפועל" של סט מאוחסן כ־numeric | null. null = לא הוזן. */
export interface StrengthSet {
  id: string;
  session_exercise_id: string;
  set_number: number; // 1-based
  set_type: SetType;

  planned_reps: number | null;
  actual_reps: number | null;
  planned_weight: number | null;
  actual_weight: number | null;
  weight_unit: WeightUnit;

  duration_seconds: number | null; // לתרגילי time / static_hold
  distance_meters: number | null;

  rpe: number | null; // 1-10
  rir: number | null; // 0-5

  rest_seconds: number | null; // מנוחה מתוכננת אחרי סט זה

  /** לתרגיל unilateral: 'left' | 'right' | null אם דו־צדדי / לא רלוונטי. */
  side: "left" | "right" | null;
  /** מסייעים (assisted_reps) — כמות סיוע. */
  assistance_value: number | null;

  completed: boolean;
  skipped: boolean;
  notes: string | null;

  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * תרגיל בתוך session. snapshot שומר על הפרטים כפי שהיו בעת התחלת האימון.
 * substituted_from_exercise_id נשמר אם המשתמש החליף — לא משנה תבנית.
 */
export interface StrengthSessionExerciseSnapshot {
  exercise_id: string;
  exercise_name: string;
  tracking_type: TrackingType | null;
  unilateral: boolean;
  primary_muscle_group_id: string | null;
  planned_sets: number;
  planned_reps: number | null;
  rep_range_min: number | null;
  rep_range_max: number | null;
  planned_weight: number | null;
  weight_unit: WeightUnit;
  rest_seconds: number | null;
  default_rpe: number | null;
  default_rir: number | null;
  set_type: SetType;
  tempo: string | null;
  notes: string | null;
  alternate_exercise_ids: string[];
}

export interface StrengthSessionExercise {
  id: string;
  session_id: string;
  block_id: string; // מזהה בלוק לוגי (יכול להיות מ־snapshot או שנוצר חדש mid-session)
  exercise_id: string; // התרגיל הנוכחי (יכול להיות שונה מ־snapshot אם הוחלף)
  sequence: number; // 0-based בתוך block

  snapshot: StrengthSessionExerciseSnapshot;

  substituted_from_exercise_id: string | null;
  substitution_reason: string | null;
  substituted_at: string | null;

  notes: string | null;
  completed: boolean; // כל הסטים completed או skipped

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** בלוק לוגי בזמן אימון (יכול לצמוח מ־snapshot או להיווצר חדש). */
export interface StrengthSessionBlock {
  id: string;
  session_id: string;
  sequence: number;
  block_type: "single" | "superset" | "circuit" | "custom";
  display_label: string | null;
  rounds: number;
  rest_between_exercises_seconds: number | null;
  rest_between_rounds_seconds: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** רשומת שדה timer — מבוסס timestamp כדי לחשב wall clock. */
export interface SessionTimerRecord {
  session_id: string;
  started_at: string;
  paused_at: string | null;
  /** מצטבר משניות שקוזזו בפאוזות (לא כולל הפאוזה הנוכחית אם קיימת). */
  paused_seconds: number;
}

export interface StrengthSession {
  id: string;
  owner_id: string;

  template_id: string | null;
  template_version: number | null;
  template_snapshot: WorkoutTemplateSnapshot | null;

  location_id: string | null;

  name: string; // מוצג בכותרת (יכול להיות שם התבנית או "אימון חופשי")

  started_at: string;
  ended_at: string | null;
  timezone: string;

  /** משך בפועל (מחושב מ־timer records בעת סיום). ב־live מציגים חישוב מ־timer. */
  duration_seconds: number | null;

  status: SessionStatus;

  /** דיווח עצמי בסיום (אופציונלי, אין להציג cheerleading). */
  perceived_quality: number | null; // 1-5
  perceived_effort: number | null; // 1-10 RPE כללי
  notes: string | null;

  /** ציון איכות נתונים — מחושב, לא שיפוט. */
  quality_score: number | null; // 0-100
  quality_score_details: string[] | null;

  data_completeness: number | null; // 0-100

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type NewSessionInput = Partial<
  Pick<
    StrengthSession,
    "template_id" | "template_version" | "template_snapshot" | "location_id" | "name" | "notes"
  >
>;

export interface SessionVolume {
  totalSets: number;
  completedSets: number;
  skippedSets: number;
  totalReps: number;
  totalVolumeKg: number; // sum(weight * reps) — kg נורמלי (lb→kg)
  totalDurationSeconds: number; // סטים מסוג time
  totalExercises: number;
  completedExercises: number;
  supersetsCount: number;
  completionRate: number; // 0..1
}

export interface PreviousExercisePerformance {
  sessionId: string;
  sessionDate: string;
  bestSet: {
    weight: number | null;
    reps: number | null;
    unit: WeightUnit;
  } | null;
  totalVolumeKg: number;
  sets: Array<Pick<StrengthSet, "set_number" | "actual_reps" | "actual_weight" | "weight_unit">>;
  note: string | null;
}

export interface PersonalRecordFlag {
  kind: "top_weight" | "top_reps" | "top_volume";
  value: number;
  label: string;
}
