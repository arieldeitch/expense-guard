/**
 * Analytics — types.
 * שכבת חישוב היסטוריה, שיאים, מגמות ואיכות אימון עבור אימוני כוח.
 * כל חישוב עובד על raw data מ־sessions/exercises ואינו משנה נתוני מקור.
 */
import type { WeightUnit } from "@/lib/templates";
import type { TrackingType } from "@/lib/exercises";
import type { StrengthSession, StrengthSet } from "@/lib/sessions";

/** נוסחת הערכת 1RM (versioned). */
export type OneRmFormulaId = "epley-v1" | "brzycki-v1";

/** הערכת 1RM עם שקיפות מלאה. */
export interface Estimated1RM {
  value: number; // ב־kg
  unit: "kg";
  formula: OneRmFormulaId;
  formulaLabel: string;
  sourceSetId: string;
  sourceWeightKg: number;
  sourceReps: number;
  calculatedAt: string; // ISO
  /** מגבלות: מחוץ לטווח חזרות/סוג סט/tracking. אם קיים — הערך null. */
  reason?: string | null;
}

/** מדוע שני סטים אינם ברי־השוואה. */
export type IncomparableReason =
  | "different_exercise"
  | "different_variation"
  | "different_equipment"
  | "different_tracking_type"
  | "different_unit"
  | "different_side"
  | "warmup_vs_working"
  | "drop_or_special_set"
  | "reps_gap_too_large"
  | "missing_values";

export interface ComparabilityResult {
  comparable: boolean;
  reasons: IncomparableReason[];
}

/** סוגי שיא — ראה docs/ai/metrics-strength.md. */
export type PersonalRecordKind =
  | "top_weight" // משקל גבוה ביותר
  | "top_reps" // חזרות רבות ביותר (ללא תלות במשקל)
  | "top_reps_at_weight" // חזרות רבות ביותר במשקל נתון
  | "top_set_volume" // נפח סט גבוה ביותר
  | "top_session_volume" // נפח אימון גבוה ביותר לתרגיל
  | "top_estimated_1rm" // הערכת 1RM גבוהה ביותר
  | "all_sets_in_target_range" // כל הסטים הושלמו בטווח היעד
  | "lower_rpe_same_load" // RPE נמוך יותר בביצוע דומה
  | "more_reps_same_weight"
  | "more_weight_same_reps";

export interface PersonalRecord {
  kind: PersonalRecordKind;
  exerciseId: string;
  sessionId: string;
  setId: string | null;
  date: string; // ISO של האימון
  value: number;
  unit: "kg" | "reps" | "volume_kg" | "percent" | "rpe" | "1rm_kg";
  previousValue: number | null;
  comparisonNote: string; // הסבר קצר איך חושב
  formula?: OneRmFormulaId | null;
  isBaseline: boolean; // true אם זהו הביצוע הראשון (לא "שיא חדש")
}

/** מבנה נתונים לגרף — מותאם למובייל, ללא סקאלה מטעה. */
export interface ChartSeriesPoint {
  x: string; // ISO date
  y: number;
  label?: string;
}
export interface ChartSeries {
  metricId: string;
  metricLabel: string;
  unit: string;
  points: ChartSeriesPoint[];
  /** hint למינימום/מקסימום ציר y (לא כופה — חלופה מספרית תמיד קיימת). */
  yMin?: number;
  yMax?: number;
}

/** תווית מגמה תיאורית — לא רפואית. */
export type ProgressLabel =
  | "insufficient_data"
  | "stable"
  | "mild_improvement"
  | "clear_improvement"
  | "temporary_dip"
  | "mixed";

export interface ProgressAnalysis {
  exerciseId: string;
  label: ProgressLabel;
  labelHe: string;
  explanation: string;
  components: ProgressComponent[];
  windowDays: number;
  sampleSize: number; // כמה אימונים במדגם
  confidence: "low" | "medium" | "high";
  missingData: string[];
}

export interface ProgressComponent {
  id:
    | "estimated_1rm"
    | "weight_at_reps"
    | "reps_at_weight"
    | "volume"
    | "rpe"
    | "completion_rate"
    | "set_consistency"
    | "frequency";
  label: string;
  changePercent: number | null; // null = אין נתונים
  direction: "up" | "down" | "flat" | "unknown";
  note?: string;
}

/** רכיבי מדד איכות. */
export interface QualityComponent {
  id:
    | "completion"
    | "rep_target"
    | "load_progression"
    | "set_consistency"
    | "rpe_alignment"
    | "rest_adherence"
    | "data_completeness"
    | "similar_session"
    | "self_reported";
  label: string;
  score: number; // 0..100
  weight: number; // 0..1 (משקל בפועל אחרי נרמול)
  defaultWeight: number; // 0..1 (משקל מקורי לפני נרמול)
  included: boolean;
  reason?: string;
}

export interface WorkoutQuality {
  sessionId: string;
  totalScore: number | null; // 0..100 — null אם אין מספיק רכיבים
  label: string; // תיאורי בעברית, ניטרלי
  components: QualityComponent[];
  excludedComponents: string[];
  narrative: string[]; // ניסוחים עובדתיים לתצוגה
}

/** רשומת היסטוריה של תרגיל בודד — צובר על פני sessions. */
export interface ExerciseHistoryRow {
  sessionId: string;
  date: string; // ISO
  templateId: string | null;
  locationId: string | null;
  sets: ExerciseHistorySet[];
  totalVolumeKg: number;
  bestWorkingSet: {
    setId: string;
    weightKg: number | null;
    reps: number | null;
    estimated1RM: number | null;
  } | null;
  note: string | null;
}

export interface ExerciseHistorySet {
  setId: string;
  setNumber: number;
  setType: StrengthSet["set_type"];
  weightKg: number | null;
  weightRaw: number | null;
  weightUnit: WeightUnit;
  reps: number | null;
  rpe: number | null;
  rir: number | null;
  durationSeconds: number | null;
  side: "left" | "right" | null;
  completed: boolean;
  skipped: boolean;
}

export interface ExerciseHistorySummary {
  exerciseId: string;
  timesPerformed: number;
  lastPerformedAt: string | null;
  lastWeightKg: number | null;
  lastReps: number | null;
  lastVolumeKg: number;
  topWeightKg: number | null;
  topReps: number | null;
  topSetVolumeKg: number | null;
  topSessionVolumeKg: number | null;
  topEstimated1RM: Estimated1RM | null;
  lastNote: string | null;
  lastLocationId: string | null;
  lastTemplateId: string | null;
  trackingType: TrackingType | null;
  daysSinceLast: number | null;
}

/** רשומת אריח בהיסטוריית אימונים. */
export interface SessionHistoryTile {
  session: StrengthSession;
  totalExercises: number;
  totalSets: number;
  completedSets: number;
  totalReps: number;
  totalVolumeKg: number;
  completionRate: number;
  primaryMuscleGroupIds: string[];
  supersetsCount: number;
  personalRecordsCount: number;
  qualityScore: number | null;
  status: StrengthSession["status"];
  vsPreviousSimilar: {
    sessionId: string;
    volumeDeltaKg: number;
    volumeDeltaPercent: number | null;
    completionDelta: number;
  } | null;
}

export interface SessionHistoryFilters {
  from?: string | null; // ISO
  to?: string | null; // ISO
  templateId?: string | null;
  exerciseId?: string | null;
  muscleGroupId?: string | null;
  locationId?: string | null;
  onlyComplete?: boolean;
  onlyPartial?: boolean;
  onlyWithPRs?: boolean;
  onlyWithNotes?: boolean;
  onlyWithQuality?: boolean;
  onlyWithSupersets?: boolean;
}

export type SessionHistorySort =
  | "date_desc"
  | "date_asc"
  | "duration_desc"
  | "volume_desc"
  | "completion_desc"
  | "pr_desc"
  | "quality_desc";

export interface SessionComparison {
  a: StrengthSession;
  b: StrengthSession;
  metrics: Array<{
    id: string;
    label: string;
    unit: string;
    a: number | null;
    b: number | null;
    delta: number | null;
    deltaPercent: number | null;
    comparable: boolean;
    note?: string;
  }>;
  sharedExerciseIds: string[];
  onlyInA: string[]; // exercise ids
  onlyInB: string[];
  prsDeltaCount: number;
}

/** עומס לפי קבוצת שריר בטווח זמן. */
export interface MuscleGroupLoad {
  muscleGroupId: string;
  totalSets: number;
  plannedSets: number;
  completedSets: number;
  frequencyDays: number; // מספר ימים נפרדים בהם נעבד
  daysSinceLast: number | null;
  volumeShareKg: number; // נפח משויך (ראשי=1, משני=0.5)
}

export const PRIMARY_MUSCLE_WEIGHT = 1;
export const SECONDARY_MUSCLE_WEIGHT = 0.5;
