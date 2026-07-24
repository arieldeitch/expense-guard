/**
 * Volume calculation service.
 *  base: weight × reps (kg מנורמל)
 *  - סט לא הושלם / דולג → לא נכלל.
 *  - חימום מנוטרל כברירת מחדל, ניתן לכלול בהצגה נפרדת.
 *  - unilateral: כפול 2 (מבצע פעמיים בפועל) — כלל מתועד ב־docs/ai/metrics-strength.md.
 *  - bodyweight ללא עומס מוגדר → מסומן כלא מחושב (מתועד ליוזר בממשק).
 *  - משקל מכונה מוצג כ"נפח מכונה" ואינו בר־השוואה למשקל חופשי (אבחנה בשכבת ה־UI).
 */
import type { WeightUnit } from "@/lib/templates";
import type { StrengthSet } from "@/lib/sessions";
import type { StrengthSessionExerciseSnapshot } from "@/lib/sessions";

export function toKg(w: number, unit: WeightUnit): number {
  return unit === "lb" ? w * 0.453592 : w;
}

export function setVolumeKg(
  set: StrengthSet,
  snapshot: Pick<StrengthSessionExerciseSnapshot, "unilateral" | "tracking_type">,
  opts: { includeWarmup?: boolean } = {},
): number {
  if (!set.completed || set.skipped) return 0;
  if (set.set_type === "warmup" && !opts.includeWarmup) return 0;
  if (set.actual_weight == null || set.actual_reps == null) return 0;
  const t = snapshot.tracking_type;
  if (t === "bodyweight_reps" || t === "time" || t === "static_hold") return 0;
  const base = toKg(set.actual_weight, set.weight_unit) * set.actual_reps;
  return snapshot.unilateral ? base * 2 : base;
}

export function sumSetsVolumeKg(
  sets: StrengthSet[],
  snapshot: Pick<StrengthSessionExerciseSnapshot, "unilateral" | "tracking_type">,
  opts: { includeWarmup?: boolean } = {},
): number {
  let total = 0;
  for (const s of sets) total += setVolumeKg(s, snapshot, opts);
  return Math.round(total * 10) / 10;
}
