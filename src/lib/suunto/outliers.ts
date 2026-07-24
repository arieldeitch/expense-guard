/**
 * Outlier service — זיהוי חריגות סטטיסטית בפער מרחק לפי הליכון.
 * שיטה: MAD (Median Absolute Deviation). ריצה נחשבת חריגה כאשר
 *   |diff_pct - median| > k * MAD  (ברירת מחדל k=3), או:
 *   - הפרש הזמן בין המקורות > 10% מהזמן הקצר.
 *   - מרחק קטן מסף מינימלי (default 400m) → לא אמין לחישוב יחס.
 *   - חסר נתון מרכזי (מרחק/זמן) — לא חריג, פשוט לא ניתן להשוואה.
 */

import { median, medianAbsoluteDeviation } from "./compare";

export interface RunComparisonPoint {
  run_id: string;
  treadmill_distance_m: number | null;
  suunto_distance_m: number | null;
  treadmill_duration_s: number | null;
  suunto_duration_s: number | null;
}

export interface OutlierAssessment {
  run_id: string;
  is_outlier: boolean;
  reasons: OutlierReason[];
  distance_diff_percent: number | null;
  time_diff_percent: number | null;
}

export type OutlierReason =
  | "distance_deviation"
  | "time_deviation"
  | "distance_too_short"
  | "missing_data";

export interface OutlierConfig {
  k_mad: number; // סף חריגה
  min_distance_m: number; // סף מרחק מינימלי
  time_deviation_threshold: number; // % הפרש זמן מותר
}

export const DEFAULT_OUTLIER_CONFIG: OutlierConfig = {
  k_mad: 3,
  min_distance_m: 400,
  time_deviation_threshold: 10,
};

function pctDiff(a: number | null, b: number | null): number | null {
  if (a == null || b == null || a <= 0) return null;
  return ((b - a) / a) * 100;
}

function timePct(a: number | null, b: number | null): number | null {
  if (a == null || b == null || a <= 0 || b <= 0) return null;
  const shorter = Math.min(a, b);
  return (Math.abs(a - b) / shorter) * 100;
}

export function assessOutliers(
  points: RunComparisonPoint[],
  cfg: OutlierConfig = DEFAULT_OUTLIER_CONFIG,
): OutlierAssessment[] {
  const diffs = points
    .map((p) => pctDiff(p.treadmill_distance_m, p.suunto_distance_m))
    .filter((v): v is number => v != null);
  const med = median(diffs);
  const mad = medianAbsoluteDeviation(diffs);
  // אם MAD=0 (כל הפערים זהים), אנחנו לא מסמנים חריגה על סמך פיזור.
  const threshold = mad == null || mad === 0 ? null : cfg.k_mad * mad;

  return points.map<OutlierAssessment>((p) => {
    const reasons: OutlierReason[] = [];
    const dpct = pctDiff(p.treadmill_distance_m, p.suunto_distance_m);
    const tpct = timePct(p.treadmill_duration_s, p.suunto_duration_s);

    if (p.treadmill_distance_m == null || p.suunto_distance_m == null) reasons.push("missing_data");
    if (
      p.treadmill_distance_m != null &&
      p.treadmill_distance_m > 0 &&
      p.treadmill_distance_m < cfg.min_distance_m
    ) {
      reasons.push("distance_too_short");
    }
    if (dpct != null && med != null && threshold != null && Math.abs(dpct - med) > threshold) {
      reasons.push("distance_deviation");
    }
    if (tpct != null && tpct > cfg.time_deviation_threshold) {
      reasons.push("time_deviation");
    }
    // ריצה נחשבת חריגה כשיש reason מלבד "missing_data" בלבד
    const meaningful = reasons.filter((r) => r !== "missing_data");
    return {
      run_id: p.run_id,
      is_outlier: meaningful.length > 0,
      reasons,
      distance_diff_percent: dpct,
      time_diff_percent: tpct,
    };
  });
}

export const OUTLIER_REASON_LABEL: Record<OutlierReason, string> = {
  distance_deviation: "הפער חורג מהחציון של הליכון זה",
  time_deviation: "הפרש הזמן בין המקורות גדול",
  distance_too_short: "המרחק קצר מדי לחישוב יחס אמין",
  missing_data: "חסרים נתונים",
};
