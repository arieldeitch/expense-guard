/**
 * Comparison service — פונקציות טהורות להשוואת שני מקורות נתונים.
 *
 * נוסחאות (מקור first, שני):
 *   distance_diff       = second - first
 *   distance_diff_pct   = distance_diff / first * 100          (כאשר first > 0)
 *   ratio_second_first  = second / first                       (כאשר first > 0)
 *   ratio_first_second  = first / second                       (כאשר second > 0)
 *
 * "first" = "מקור בסיס" (בדרך כלל ההליכון), "second" = "מקור נגד" (בדרך כלל Suunto).
 * הכיוון קבוע ולא מומצא — התצוגה חייבת לציין אילו מקורות משווים.
 * כאשר מכנה = 0 → המחזיר null (לא NaN, לא Infinity).
 */
import type { DeviceRunSnapshot, DeviceSourceType } from "./types";

export interface MetricComparison {
  metric: string;
  label: string;
  unit: string;
  first_value: number | null;
  second_value: number | null;
  diff: number | null;
  diff_percent: number | null;
  ratio_second_first: number | null;
  direction: "first_greater" | "second_greater" | "equal" | "unknown";
  explanation: string;
}

export interface ComparisonResult {
  first_source: DeviceSourceType;
  first_label: string;
  second_source: DeviceSourceType;
  second_label: string;
  metrics: MetricComparison[];
  /** האם מספיק נתונים בסיסיים להשוואה משמעותית (מרחק+זמן משני המקורות). */
  is_comparable_basic: boolean;
  summary: string;
}

const SAFE_DIV = (n: number, d: number): number | null =>
  d === 0 || !isFinite(d) || !isFinite(n) ? null : n / d;

function metricDiff(first: number | null, second: number | null) {
  if (first == null || second == null) return { diff: null, pct: null, ratio: null };
  const diff = second - first;
  const pct = first === 0 ? null : (diff / Math.abs(first)) * 100;
  const ratio = SAFE_DIV(second, first);
  return { diff, pct, ratio };
}

function direction(diff: number | null): MetricComparison["direction"] {
  if (diff == null) return "unknown";
  if (diff > 0) return "second_greater";
  if (diff < 0) return "first_greater";
  return "equal";
}

const SOURCE_LABEL: Record<DeviceSourceType, string> = {
  suunto: "Suunto",
  treadmill: "הליכון",
  manual: "הזנה ידנית",
  import: "ייבוא",
  screenshot: "צילום מסך",
  other: "מקור אחר",
};

function fmt(n: number | null, digits = 2): string {
  if (n == null || !isFinite(n)) return "–";
  return n.toFixed(digits);
}

function buildExplanation(
  label: string,
  firstLabel: string,
  secondLabel: string,
  first: number | null,
  second: number | null,
  diff: number | null,
  pct: number | null,
  unit: string,
): string {
  if (first == null || second == null) {
    return "אין מספיק נתונים להשוואה.";
  }
  if (diff === 0) return `${firstLabel} ו-${secondLabel} מדדו ${label} זהה.`;
  const more = diff! > 0 ? "יותר" : "פחות";
  const abs = Math.abs(diff!);
  const pctText = pct == null ? "" : ` (${fmt(Math.abs(pct), 1)}%)`;
  return `${secondLabel} מדד ${fmt(abs)} ${unit} ${more} מ-${firstLabel}${pctText}.`;
}

function compareMetric(
  metric: string,
  label: string,
  unit: string,
  first: number | null,
  second: number | null,
  firstLabel: string,
  secondLabel: string,
): MetricComparison {
  const { diff, pct, ratio } = metricDiff(first, second);
  return {
    metric,
    label,
    unit,
    first_value: first,
    second_value: second,
    diff,
    diff_percent: pct,
    ratio_second_first: ratio,
    direction: direction(diff),
    explanation: buildExplanation(label, firstLabel, secondLabel, first, second, diff, pct, unit),
  };
}

/**
 * מקבל שני snapshots (אחד יכול להיות ריצת ההליכון "כאילו-snapshot").
 * מחזיר תוצאה מסודרת עם כל המדדים הרלוונטיים להשוואה.
 */
export function compareSnapshots(
  first: DeviceRunSnapshot,
  second: DeviceRunSnapshot,
  opts: { firstLabel?: string; secondLabel?: string } = {},
): ComparisonResult {
  const firstLabel = opts.firstLabel ?? SOURCE_LABEL[first.source_type];
  const secondLabel = opts.secondLabel ?? SOURCE_LABEL[second.source_type];
  const metrics: MetricComparison[] = [
    compareMetric(
      "distance_meters",
      "מרחק",
      "מ'",
      first.distance_meters,
      second.distance_meters,
      firstLabel,
      secondLabel,
    ),
    compareMetric(
      "duration_seconds",
      "משך",
      "שנ'",
      first.duration_seconds,
      second.duration_seconds,
      firstLabel,
      secondLabel,
    ),
    compareMetric(
      "average_pace_s_per_km",
      "קצב ממוצע",
      "שנ'/ק\"מ",
      first.average_pace_s_per_km,
      second.average_pace_s_per_km,
      firstLabel,
      secondLabel,
    ),
    compareMetric(
      "average_speed_kmh",
      "מהירות ממוצעת",
      "קמ\"ש",
      first.average_speed_kmh,
      second.average_speed_kmh,
      firstLabel,
      secondLabel,
    ),
    compareMetric(
      "average_heart_rate",
      "דופק ממוצע",
      "bpm",
      first.average_heart_rate,
      second.average_heart_rate,
      firstLabel,
      secondLabel,
    ),
    compareMetric(
      "max_heart_rate",
      "דופק מרבי",
      "bpm",
      first.max_heart_rate,
      second.max_heart_rate,
      firstLabel,
      secondLabel,
    ),
    compareMetric(
      "average_cadence_spm",
      "Cadence",
      "spm",
      first.average_cadence_spm,
      second.average_cadence_spm,
      firstLabel,
      secondLabel,
    ),
    compareMetric(
      "calories",
      "קלוריות",
      "kcal",
      first.calories,
      second.calories,
      firstLabel,
      secondLabel,
    ),
  ];

  const dist = metrics.find((m) => m.metric === "distance_meters")!;
  const dur = metrics.find((m) => m.metric === "duration_seconds")!;
  const isComparable =
    dist.first_value != null &&
    dist.second_value != null &&
    dur.first_value != null &&
    dur.second_value != null;

  const distSummary = dist.diff_percent;
  const summary = isComparable
    ? distSummary == null
      ? "יש מדידות משני המקורות, אך אחד מהם מרחק אפס."
      : `${secondLabel} מדד ${distSummary >= 0 ? "יותר" : "פחות"} מרחק ב-${fmt(
          Math.abs(distSummary),
          1,
        )}% מ-${firstLabel}.`
    : "אין מספיק נתונים בסיסיים להשוואה מלאה.";

  return {
    first_source: first.source_type,
    first_label: firstLabel,
    second_source: second.source_type,
    second_label: secondLabel,
    metrics,
    is_comparable_basic: isComparable,
    summary,
  };
}

/**
 * בונה "snapshot-דמוי" מריצת ההליכון הרגילה, לצורך השוואה מול Suunto.
 */
export function treadmillSnapshotFromRun(run: {
  distance_meters: number | null;
  duration_seconds: number | null;
  average_pace_s_per_km: number | null;
  average_speed_kmh: number | null;
  max_speed_kmh: number | null;
  average_heart_rate: number | null;
  max_heart_rate: number | null;
  average_cadence_spm: number | null;
  calories: number | null;
}): DeviceRunSnapshot {
  return {
    source_type: "treadmill",
    device_name: null,
    device_model: null,
    entered_at: null,
    distance_meters: run.distance_meters,
    duration_seconds: run.duration_seconds,
    average_pace_s_per_km: run.average_pace_s_per_km,
    average_speed_kmh: run.average_speed_kmh,
    max_speed_kmh: run.max_speed_kmh,
    average_heart_rate: run.average_heart_rate,
    max_heart_rate: run.max_heart_rate,
    average_cadence_spm: run.average_cadence_spm,
    calories: run.calories,
    training_effect: null,
    peak_training_effect: null,
    epoc_ml_kg: null,
    recovery_time_hours: null,
    ascent_m: null,
    descent_m: null,
    notes: null,
    custom: [],
  };
}

// ---------- Statistics ----------

export function median(values: number[]): number | null {
  const arr = values.filter((v) => isFinite(v)).slice().sort((a, b) => a - b);
  if (arr.length === 0) return null;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}
export function mean(values: number[]): number | null {
  const arr = values.filter((v) => isFinite(v));
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
export function stddev(values: number[]): number | null {
  const arr = values.filter((v) => isFinite(v));
  if (arr.length < 2) return null;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}
export function medianAbsoluteDeviation(values: number[]): number | null {
  const m = median(values);
  if (m == null) return null;
  const dev = values.map((v) => Math.abs(v - m));
  return median(dev);
}
