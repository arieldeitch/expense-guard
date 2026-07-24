/** תוויות עברית + טווחים סבירים לוולידציה + נתוני תצוגה למודול הריצה. */
import type { RunType, RunStatus, RunSegment, RunningRoute } from "./types";

export const RUN_TYPE_LABELS: Record<RunType, string> = {
  treadmill: "הליכון",
  outdoor: "חוץ",
};

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  draft: "טיוטה",
  completed: "הושלמה",
  archived: "בארכיון",
};

export const SEGMENT_TYPE_LABELS: Record<RunSegment["segment_type"], string> = {
  warmup: "חימום",
  work: "עבודה",
  recovery: "התאוששות",
  cooldown: "קירור",
  custom: "מותאם",
};

export const SEGMENT_TYPE_ORDERED: RunSegment["segment_type"][] = [
  "warmup",
  "work",
  "recovery",
  "cooldown",
  "custom",
];

export const ROUTE_TYPE_LABELS: Record<RunningRoute["route_type"], string> = {
  fixed: "מסלול קבוע",
  park: "פארק",
  road: "כביש",
  trail: "שביל",
  city: "עיר",
  loop: "מסלול מעגלי",
  other: "אחר",
};

export const ROUTE_TYPE_ORDERED: RunningRoute["route_type"][] = [
  "fixed",
  "park",
  "road",
  "trail",
  "city",
  "loop",
  "other",
];

/** טווחים סבירים לאזהרות (לא לחסימה). */
export const REASONABLE_RANGES = {
  duration_seconds: { min: 30, max: 12 * 3600 }, // 30s .. 12h
  distance_meters: { min: 50, max: 250_000 }, // 50m .. 250km
  average_speed_kmh: { min: 2, max: 40 },
  max_speed_kmh: { min: 2, max: 45 },
  average_pace_s_per_km: { min: 120, max: 1800 }, // 2:00 .. 30:00 /km
  average_incline_pct: { min: -10, max: 30 },
  max_incline_pct: { min: -10, max: 40 },
  average_heart_rate: { min: 30, max: 230 },
  max_heart_rate: { min: 30, max: 240 },
  average_cadence_spm: { min: 40, max: 240 },
  calories: { min: 0, max: 10_000 },
  elevation_gain_m: { min: 0, max: 10_000 },
  elevation_loss_m: { min: 0, max: 10_000 },
  perceived_effort: { min: 1, max: 10 },
} as const;
