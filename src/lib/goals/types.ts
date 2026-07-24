/**
 * Goals domain — טיפוסי בסיס.
 *
 * עקרון על: **המערכת לא ממציאה יעד ולא משנה יעד**. כל שינוי מהותי — ע"י המשתמש בלבד.
 * ראה `docs/ai/goals.md` להסבר מלא ולסוגי היעד הנתמכים.
 */

export type GoalDomain = "running" | "gym" | "home";

export type GoalStatus =
  | "draft"
  | "active"
  | "paused"
  | "achieved"
  | "not_achieved"
  | "cancelled"
  | "archived"
  | "trashed";

/** סוגי יעד — מזהים דטרמיניסטיים לחישוב progress ו־current_value. */
export type GoalType =
  // Running
  | "run_distance_total" // סכום מרחק להשלמה (kmי או ק״מ)
  | "run_event_completion" // אירוע בתאריך (חצי מרתון וכד')
  | "run_time_for_distance" // זמן יעד למרחק (שניות, direction=down)
  | "run_pace_for_distance" // קצב יעד למרחק (s/km, direction=down)
  | "run_weekly_distance" // מרחק שבועי (rolling 7d)
  | "run_monthly_distance" // מרחק חודשי
  | "run_count_in_period" // מספר ריצות בתקופה
  | "run_cumulative_time" // זמן ריצה מצטבר
  | "run_custom"
  // Gym
  | "gym_exercise_top_weight" // משקל שיא לתרגיל (kg)
  | "gym_reps_at_weight" // חזרות במשקל נתון
  | "gym_estimated_1rm" // 1RM מוערך (kg)
  | "gym_sessions_in_period" // אימונים בתקופה
  | "gym_template_completions" // מספר ביצועי תבנית
  | "gym_set_completion_rate" // אחוז השלמת סטים
  | "gym_custom_metric"
  | "gym_custom"
  // Home
  | "home_consecutive_reps" // חזרות רצופות בסט יחיד (שכיבות/כפיפות/וכד')
  | "home_hold_seconds" // משך אחזקה (פלאנק)
  | "home_total_reps_in_session" // סך חזרות באימון לתרגיל
  | "home_sessions_in_period"
  | "home_sets_in_period"
  | "home_reps_per_minute"
  | "home_custom";

/** כיוון היעד: ערך גדול יותר = טוב יותר, או להפך. */
export type GoalDirection = "increasing" | "decreasing" | "count" | "event";

/** תקופת חישוב ל־count-based goals. */
export type GoalPeriod = "week" | "month" | "quarter" | "year" | "custom";

/**
 * `calculation_method` — מזהה נוסחת החישוב. נשמר בכל snapshot כדי לאפשר
 * החלפת נוסחה עתידית עם שקיפות מלאה.
 */
export type CalculationMethod =
  | "linear_increasing" // (current - baseline) / (target - baseline)
  | "linear_decreasing" // (baseline - current) / (baseline - target)
  | "count_over_target" // count / target
  | "rate_percentage" // הערך כבר באחוזים
  | "event_no_progress" // רק זמן שנותר, אין % התקדמות
  | "custom_manual"; // המשתמש מזין current בעצמו

/** תוויות אמון להצגה עם תחזית. אין "בוודאי". */
export type ConfidenceLabel = "none" | "low" | "initial" | "medium" | "high";

/** פרטי אירוע — לסוג יעד `run_event_completion`. */
export interface GoalEventDetails {
  event_name: string | null;
  event_location: string | null;
  distance_meters: number | null;
  target_time_seconds: number | null;
}

/** רשומת snapshot חיצונית — לא raw, ניתן לחשב מחדש. */
export interface GoalSnapshot {
  id: string;
  goal_id: string;
  snapshot_at: string; // ISO
  current_value: number | null;
  progress_percentage: number | null; // 0..100 (או null באירועים)
  remaining_value: number | null; // ערך גולמי — פער ליעד
  days_remaining: number | null; // אם יש target_date
  projected_value: number | null; // תחזית דטרמיניסטית
  projection_method: string | null;
  source_activity_ids: string[]; // מזהי פעילות שתרמו
  calculation_details: string; // הסבר קריא לאדם
  calculation_method: CalculationMethod;
  formula_version: string; // "v1"
  confidence_label: ConfidenceLabel;
  created_at: string;
}

/** רשומת גרסה — לאודיט של שינויים מהותיים. */
export interface GoalVersion {
  id: string;
  goal_id: string;
  version: number;
  snapshot: GoalFrozen; // המצב המלא לפני השינוי
  changed_fields: string[]; // אילו שדות השתנו
  reason: string | null;
  created_at: string;
}

/** דמות "קפואה" של הגדרת יעד לצורך גרסאות (ללא שדות שאינם רלוונטיים). */
export interface GoalFrozen {
  name: string;
  goal_type: GoalType;
  baseline_value: number | null;
  target_value: number | null;
  target_unit: string;
  start_date: string | null;
  target_date: string | null;
  linked_exercise_id: string | null;
  linked_route_id: string | null;
  linked_treadmill_id: string | null;
  linked_template_id: string | null;
  linked_metric: string | null;
  linked_period: GoalPeriod | null;
  linked_extra_number: number | null;
  calculation_method: CalculationMethod;
  event_details: GoalEventDetails | null;
}

/** רשומת Goal עיקרית. */
export interface Goal {
  id: string;
  user_id: string; // single-user, thabt for future RLS
  domain: GoalDomain;
  goal_type: GoalType;

  name: string;
  description: string | null;

  baseline_value: number | null; // אם רלוונטי
  current_value: number | null; // מחושב מנתוני פעילות
  target_value: number | null; // המשתמש מזין
  target_unit: string; // "ק״מ", "kg", "חזרות", "שניות" וכו'

  start_date: string | null;
  target_date: string | null;

  linked_exercise_id: string | null;
  linked_route_id: string | null;
  linked_treadmill_id: string | null;
  linked_template_id: string | null;
  linked_metric: string | null; // מזהה חופשי לסוגי custom
  linked_period: GoalPeriod | null; // תקופה עבור count-goals
  linked_extra_number: number | null; // ערך משני (למשל משקל ב־reps_at_weight)

  calculation_method: CalculationMethod;
  direction: GoalDirection;

  event_details: GoalEventDetails | null;

  status: GoalStatus;
  priority: number; // 1 = highest
  is_primary: boolean; // המשתמש סימן כראשי בתחום זה
  display_preference: "tile" | "compact" | "hidden";
  auto_mark_achieved: boolean; // ברירת מחדל false — אישור ידני

  version: number; // עולה בכל שינוי מהותי
  last_snapshot_at: string | null;

  created_at: string;
  updated_at: string;
  achieved_at: string | null;
  deleted_at: string | null;
}

/** קלט יצירה — המשתמש חייב להזין name+target ברוב הסוגים. */
export type NewGoalInput = Partial<Omit<Goal, "id" | "user_id" | "created_at" | "updated_at">> & {
  domain: GoalDomain;
  goal_type: GoalType;
};

/** תוצאה של חישוב progress — עשירה, שקופה. */
export interface GoalProgress {
  goal_id: string;
  current_value: number | null;
  progress_percentage: number | null; // null באירוע
  remaining_value: number | null;
  days_remaining: number | null;
  projected_value: number | null;
  projection_method: string | null;
  calculation_method: CalculationMethod;
  formula_version: string;
  calculation_details: string;
  source_activity_ids: string[];
  confidence_label: ConfidenceLabel;
  is_target_met: boolean; // האם הערך הנוכחי כבר עומד ביעד
  is_target_date_passed: boolean;
  data_available: boolean;
}
