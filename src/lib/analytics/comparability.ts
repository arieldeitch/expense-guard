/**
 * Comparability — כללי השוואה הוגנת בין סטים ותרגילים.
 *
 * אין להשוות:
 *  - תרגילים שונים / וריאציות שונות.
 *  - סוגי ציוד שונים כאילו הם זהים.
 *  - חד־צדדי מול דו־צדדי ללא התאמה.
 *  - יחידות שונות (מסונרן ל־kg לפני ההשוואה).
 *  - סוגי מעקב שונים.
 *  - סט חימום מול סט עבודה.
 *  - drop/failure מול סט רגיל.
 *  - מספר חזרות שרחוק מאוד (גורם ל־comparability מטעה).
 */
import type { StrengthSet, StrengthSessionExercise } from "@/lib/sessions";
import type { ComparabilityResult, IncomparableReason } from "./types";

const REPS_GAP_TOLERANCE = 3; // הבדל של יותר מ־3 חזרות נחשב לא בר־השוואה ישיר.
const NORMAL_TYPES = new Set(["regular", "amrap"]);

export function compareSets(a: StrengthSet, b: StrengthSet): ComparabilityResult {
  const reasons: IncomparableReason[] = [];
  if (a.weight_unit !== b.weight_unit) reasons.push("different_unit");
  if ((a.side ?? null) !== (b.side ?? null)) reasons.push("different_side");
  const aWarm = a.set_type === "warmup";
  const bWarm = b.set_type === "warmup";
  if (aWarm !== bWarm) reasons.push("warmup_vs_working");
  const aSpecial = a.set_type === "drop_set" || a.set_type === "failure";
  const bSpecial = b.set_type === "drop_set" || b.set_type === "failure";
  if (aSpecial !== bSpecial) reasons.push("drop_or_special_set");
  if (a.actual_reps == null || b.actual_reps == null) reasons.push("missing_values");
  else if (Math.abs(a.actual_reps - b.actual_reps) > REPS_GAP_TOLERANCE)
    reasons.push("reps_gap_too_large");
  return { comparable: reasons.length === 0, reasons };
}

export function compareExercises(
  a: StrengthSessionExercise,
  b: StrengthSessionExercise,
): ComparabilityResult {
  const reasons: IncomparableReason[] = [];
  if (a.exercise_id !== b.exercise_id) reasons.push("different_exercise");
  if (a.snapshot.tracking_type !== b.snapshot.tracking_type)
    reasons.push("different_tracking_type");
  if (a.snapshot.unilateral !== b.snapshot.unilateral) reasons.push("different_side");
  return { comparable: reasons.length === 0, reasons };
}

/** האם סט נחשב "סט עבודה רגיל" — הבסיס להשוואות וזיהוי שיאים. */
export function isWorkingSet(s: StrengthSet): boolean {
  return NORMAL_TYPES.has(s.set_type) && s.completed && !s.skipped;
}

export const INCOMPARABLE_REASON_LABEL_HE: Record<IncomparableReason, string> = {
  different_exercise: "תרגילים שונים",
  different_variation: "וריאציות שונות",
  different_equipment: "ציוד שונה",
  different_tracking_type: "סוג מעקב שונה",
  different_unit: "יחידות שונות",
  different_side: "צד שונה (חד־צדדי מול דו־צדדי)",
  warmup_vs_working: "סט חימום מול סט עבודה",
  drop_or_special_set: "drop set / failure מול סט רגיל",
  reps_gap_too_large: "פער חזרות גדול מכדי להשוות ישירות",
  missing_values: "חסרים ערכים",
};
