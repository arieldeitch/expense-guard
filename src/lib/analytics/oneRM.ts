/**
 * Estimated 1RM service — עם שקיפות מלאה ומגבלות.
 * חוקים:
 *  - מוצג במפורש כ"הערכת 1RM" (לא כערך אמיתי).
 *  - חוסם סטי חימום, drop/failure, tracking שאינו weight_reps/bodyweight_plus_weight.
 *  - חוסם טווח חזרות שגדול מהמומלץ לנוסחה.
 *  - אינו מעודד ניסיון של 1RM אמיתי — זהו חישוב סטטיסטי בלבד.
 */
import type { TrackingType } from "@/lib/exercises";
import type { WeightUnit } from "@/lib/templates";
import type { StrengthSet } from "@/lib/sessions";
import type { Estimated1RM, OneRmFormulaId } from "./types";
import { DEFAULT_ONE_RM_FORMULA, getFormula } from "./formulas";

function toKg(w: number, u: WeightUnit): number {
  return u === "lb" ? w * 0.453592 : w;
}

const ELIGIBLE_TRACKING: TrackingType[] = ["weight_reps", "bodyweight_plus_weight"];

export interface OneRmContext {
  trackingType: TrackingType | null;
  formula?: OneRmFormulaId;
}

/**
 * הערכת 1RM לסט בודד. מחזיר null עם reason אם אינו כשיר.
 */
export function estimate1RMForSet(
  set: StrengthSet,
  ctx: OneRmContext,
): { value: Estimated1RM | null; reason?: string } {
  const formula = getFormula(ctx.formula ?? DEFAULT_ONE_RM_FORMULA);
  if (!ctx.trackingType || !ELIGIBLE_TRACKING.includes(ctx.trackingType)) {
    return { value: null, reason: "לא רלוונטי לסוג מעקב זה" };
  }
  if (set.set_type === "warmup") return { value: null, reason: "סט חימום — לא נכלל בהערכת 1RM" };
  if (set.set_type === "drop_set" || set.set_type === "failure") {
    return { value: null, reason: "סוג סט אינו כשיר להערכת 1RM" };
  }
  if (!set.completed) return { value: null, reason: "סט לא הושלם" };
  if (set.actual_weight == null || set.actual_reps == null || set.actual_reps < 1) {
    return { value: null, reason: "חסרים משקל או חזרות" };
  }
  if (set.actual_reps > formula.maxReps) {
    return { value: null, reason: `מעל טווח החזרות של הנוסחה (${formula.maxReps})` };
  }
  const weightKg = toKg(set.actual_weight, set.weight_unit);
  const value = Math.round(formula.compute(weightKg, set.actual_reps) * 10) / 10;
  return {
    value: {
      value,
      unit: "kg",
      formula: formula.id,
      formulaLabel: formula.label,
      sourceSetId: set.id,
      sourceWeightKg: Math.round(weightKg * 10) / 10,
      sourceReps: set.actual_reps,
      calculatedAt: new Date().toISOString(),
    },
  };
}

/** ה־1RM הגבוה ביותר מתוך רשימת סטים (מסנן אוטומטית לא כשירים). */
export function bestEstimate1RM(
  sets: StrengthSet[],
  ctx: OneRmContext,
): Estimated1RM | null {
  let best: Estimated1RM | null = null;
  for (const s of sets) {
    const { value } = estimate1RMForSet(s, ctx);
    if (value && (!best || value.value > best.value)) best = value;
  }
  return best;
}
