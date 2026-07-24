/**
 * Calibration service — יוצר הצעת מקדם כיול פר-הליכון.
 *
 * חוקי מדגם וסף:
 *   n = מספר ריצות אליגיביליות (שני מקורות, לא מחוקות, לא בהחרגה, מרחק וזמן תקינים).
 *   n<3    → insufficient — אין הצעת כיול.
 *   n=3    → low.
 *   n=4    → preliminary.
 *   n=5..9 → basic.
 *   n=10..19→ moderate.
 *   n≥20   → relatively_high.
 *
 * נוסחה עיקרית (default):
 *   factor = median(suunto_distance / treadmill_distance)
 *
 * factor > 1 → Suunto מדד יותר → treadmill מדד "פחות מדי".
 * factor < 1 → Suunto מדד פחות → treadmill מדד "יותר מדי".
 * אין כאן קביעה מי "נכון" — זו רק הצעה שקופה לגישור בין המקורות.
 */

import { median, mean, stddev } from "./compare";
import type { CalibrationMethod, ConfidenceLabel, TreadmillCalibrationProfile } from "./types";

export interface CalibrationInputRun {
  run_id: string;
  started_at: string;
  treadmill_distance_m: number | null;
  suunto_distance_m: number | null;
  treadmill_duration_s: number | null;
  suunto_duration_s: number | null;
  /** האם הריצה הוחרגה ידנית ע"י המשתמש. */
  excluded: boolean;
  /** האם זוהתה כחריגה סטטיסטית. */
  is_outlier: boolean;
}

export interface CalibrationProposal {
  treadmill_id: string;
  factor: number | null; // null אם insufficient
  method: CalibrationMethod;
  sample_size: number;
  eligible_before_outlier_filter: number;
  confidence_label: ConfidenceLabel;
  period_start: string | null;
  period_end: string | null;
  included_run_ids: string[];
  excluded_run_ids: string[];
  diagnostics: {
    mean_ratio: number;
    median_ratio: number;
    stddev_percent: number;
    min_ratio: number;
    max_ratio: number;
    median_distance_diff_percent: number;
  };
  narrative: string;
}

export function labelFromSample(n: number): ConfidenceLabel {
  if (n < 3) return "insufficient";
  if (n === 3) return "low";
  if (n === 4) return "preliminary";
  if (n <= 9) return "basic";
  if (n <= 19) return "moderate";
  return "relatively_high";
}

const CONFIDENCE_LABEL_HE: Record<ConfidenceLabel, string> = {
  insufficient: "אין מספיק נתונים",
  low: "נמוכה",
  preliminary: "ראשונית",
  basic: "בסיסית",
  moderate: "בינונית",
  relatively_high: "גבוהה יחסית",
};
export const confidenceLabelHebrew = (l: ConfidenceLabel) => CONFIDENCE_LABEL_HE[l];

function ratio(t: number | null, s: number | null): number | null {
  if (t == null || s == null || t <= 0 || s <= 0) return null;
  return s / t;
}

/** מסנן ריצות אליגיביליות: יש מרחק+זמן משני המקורות, לא מחוקה, לא מוחרגת. */
export function eligibleRuns(runs: CalibrationInputRun[]): CalibrationInputRun[] {
  return runs.filter(
    (r) =>
      !r.excluded &&
      r.treadmill_distance_m != null &&
      r.treadmill_distance_m > 0 &&
      r.suunto_distance_m != null &&
      r.suunto_distance_m > 0 &&
      r.treadmill_duration_s != null &&
      r.treadmill_duration_s > 0 &&
      r.suunto_duration_s != null &&
      r.suunto_duration_s > 0,
  );
}

/** מחשב הצעת כיול. עוצם את המדגם ל-outliers אוטומטית (אך שומר אותם ברשימת excluded). */
export function proposeCalibration(
  treadmillId: string,
  runs: CalibrationInputRun[],
  method: CalibrationMethod = "median_ratio_distance",
): CalibrationProposal {
  const eligible = eligibleRuns(runs);
  const eligibleBefore = eligible.length;
  const included = eligible.filter((r) => !r.is_outlier);
  const excludedByOutlier = eligible.filter((r) => r.is_outlier);
  const manuallyExcluded = runs.filter((r) => r.excluded);

  const ratios = included
    .map((r) => ratio(r.treadmill_distance_m, r.suunto_distance_m))
    .filter((v): v is number => v != null);
  const distPct = included
    .map((r) =>
      r.treadmill_distance_m! === 0
        ? null
        : ((r.suunto_distance_m! - r.treadmill_distance_m!) / r.treadmill_distance_m!) * 100,
    )
    .filter((v): v is number => v != null);

  const medianRatio = median(ratios) ?? 0;
  const meanRatio = mean(ratios) ?? 0;
  const sd = stddev(ratios) ?? 0;
  const sdPercent = meanRatio > 0 ? (sd / meanRatio) * 100 : 0;
  const minR = ratios.length ? Math.min(...ratios) : 0;
  const maxR = ratios.length ? Math.max(...ratios) : 0;
  const medianDiffPct = median(distPct) ?? 0;

  const n = included.length;
  const label = labelFromSample(n);
  const factor =
    label === "insufficient" ? null : method === "mean_ratio_distance" ? meanRatio : medianRatio;

  const dates = included.map((r) => r.started_at).sort();
  const periodStart = dates[0] ?? null;
  const periodEnd = dates[dates.length - 1] ?? null;

  const factorTxt = factor == null ? "אין" : factor.toFixed(4);
  const narrative =
    label === "insufficient"
      ? `אין עדיין מספיק ריצות עם שני מקורות (יש ${n}; דרושות לפחות 3).`
      : `על סמך ${n} ריצות עם שני מקורות באותו הליכון, מקדם ההצעה הוא ${factorTxt} (${CONFIDENCE_LABEL_HE[label]}). ` +
        `Suunto מדד ${medianDiffPct >= 0 ? "יותר" : "פחות"} ב-${Math.abs(medianDiffPct).toFixed(
          1,
        )}% בממוצע החציוני מהמרחק בהליכון.`;

  return {
    treadmill_id: treadmillId,
    factor,
    method,
    sample_size: n,
    eligible_before_outlier_filter: eligibleBefore,
    confidence_label: label,
    period_start: periodStart,
    period_end: periodEnd,
    included_run_ids: included.map((r) => r.run_id),
    excluded_run_ids: [
      ...excludedByOutlier.map((r) => r.run_id),
      ...manuallyExcluded.map((r) => r.run_id),
    ],
    diagnostics: {
      mean_ratio: meanRatio,
      median_ratio: medianRatio,
      stddev_percent: sdPercent,
      min_ratio: minR,
      max_ratio: maxR,
      median_distance_diff_percent: medianDiffPct,
    },
    narrative,
  };
}

/**
 * מיישם מקדם על מרחק הליכון כדי לקבל "מרחק מוצע" (בלבד לתצוגה).
 * לעולם לא כותב לרשומת המקור.
 */
export function applyCalibrationToDistance(
  treadmillDistanceM: number | null,
  profile: TreadmillCalibrationProfile | null,
): number | null {
  if (treadmillDistanceM == null || profile == null || profile.status !== "approved") return null;
  return treadmillDistanceM * profile.factor;
}
