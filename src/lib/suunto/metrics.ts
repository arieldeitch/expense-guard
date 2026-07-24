/**
 * Metric registry — הגדרות ליבה למדדי Suunto.
 * label בעברית, יחידת בסיס, יחידת תצוגה נפוצה, וטווח סביר לוולידציה.
 */
import type { MetricKey, Unit } from "./types";

export interface MetricDef {
  key: Exclude<MetricKey, string & { readonly __custom?: unique symbol }> | string;
  label: string;
  unit: Unit;
  displayUnit: string;
  min: number | null;
  max: number | null;
  /** האם השדה נחשב "בסיסי" (מוצג במסך הראשי של הטופס). */
  common: boolean;
  /** האם השדה זמין להשוואה מול הליכון. */
  comparable: boolean;
  /** קטגוריה לתצוגה מקובצת בטופס המתקדם. */
  group: "core" | "hr" | "load" | "terrain" | "misc";
  description?: string;
}

export const METRIC_DEFS: readonly MetricDef[] = [
  {
    key: "distance_meters",
    label: "מרחק",
    unit: "m",
    displayUnit: 'ק"מ',
    min: 0,
    max: 500_000,
    common: true,
    comparable: true,
    group: "core",
  },
  {
    key: "duration_seconds",
    label: "משך",
    unit: "s",
    displayUnit: "hh:mm:ss",
    min: 1,
    max: 24 * 3600,
    common: true,
    comparable: true,
    group: "core",
  },
  {
    key: "average_pace_s_per_km",
    label: "קצב ממוצע",
    unit: "s_per_km",
    displayUnit: '/ק"מ',
    min: 90,
    max: 30 * 60,
    common: true,
    comparable: true,
    group: "core",
  },
  {
    key: "average_speed_kmh",
    label: "מהירות ממוצעת",
    unit: "kmh",
    displayUnit: 'קמ"ש',
    min: 0.5,
    max: 40,
    common: false,
    comparable: true,
    group: "core",
  },
  {
    key: "max_speed_kmh",
    label: "מהירות מרבית",
    unit: "kmh",
    displayUnit: 'קמ"ש',
    min: 0.5,
    max: 50,
    common: false,
    comparable: true,
    group: "core",
  },
  {
    key: "average_heart_rate",
    label: "דופק ממוצע",
    unit: "bpm",
    displayUnit: "bpm",
    min: 30,
    max: 230,
    common: true,
    comparable: true,
    group: "hr",
  },
  {
    key: "max_heart_rate",
    label: "דופק מרבי",
    unit: "bpm",
    displayUnit: "bpm",
    min: 30,
    max: 240,
    common: true,
    comparable: true,
    group: "hr",
  },
  {
    key: "average_cadence_spm",
    label: "Cadence",
    unit: "spm",
    displayUnit: "spm",
    min: 30,
    max: 260,
    common: true,
    comparable: true,
    group: "hr",
  },
  {
    key: "calories",
    label: "קלוריות",
    unit: "kcal",
    displayUnit: "kcal",
    min: 0,
    max: 10_000,
    common: false,
    comparable: true,
    group: "load",
  },
  {
    key: "training_effect",
    label: "Training Effect",
    unit: "index",
    displayUnit: "/5",
    min: 0,
    max: 5,
    common: false,
    comparable: false,
    group: "load",
  },
  {
    key: "peak_training_effect",
    label: "Peak Training Effect",
    unit: "index",
    displayUnit: "/5",
    min: 0,
    max: 5,
    common: false,
    comparable: false,
    group: "load",
  },
  {
    key: "epoc_ml_kg",
    label: "EPOC",
    unit: "ml_kg",
    displayUnit: "ml/kg",
    min: 0,
    max: 500,
    common: false,
    comparable: false,
    group: "load",
  },
  {
    key: "recovery_time_hours",
    label: "זמן התאוששות",
    unit: "hours",
    displayUnit: "שעות",
    min: 0,
    max: 200,
    common: false,
    comparable: false,
    group: "load",
  },
  {
    key: "ascent_m",
    label: "עלייה מצטברת",
    unit: "m",
    displayUnit: "מ'",
    min: 0,
    max: 20_000,
    common: false,
    comparable: false,
    group: "terrain",
  },
  {
    key: "descent_m",
    label: "ירידה מצטברת",
    unit: "m",
    displayUnit: "מ'",
    min: 0,
    max: 20_000,
    common: false,
    comparable: false,
    group: "terrain",
  },
];

export function metricDef(key: string): MetricDef | null {
  return METRIC_DEFS.find((m) => m.key === key) ?? null;
}

export const COMPARABLE_METRICS = METRIC_DEFS.filter((m) => m.comparable).map((m) => m.key);

export const CUSTOM_PREFIX = "custom:";

export function isCustomKey(key: string): boolean {
  return key.startsWith(CUSTOM_PREFIX);
}

export function customSlug(label: string): string {
  const s = label
    .trim()
    .replace(/[\s]+/g, "_")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .toLowerCase();
  return `${CUSTOM_PREFIX}${s || `m_${Date.now().toString(36)}`}`;
}
