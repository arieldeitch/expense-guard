/**
 * Fixtures משותפים לבדיקות render/route.
 *
 * מטרה: לבנות קלט **מלא ותקף** לפי ה-domain contract הנוכחי, בלי להחליש טיפוסים
 * ובלי `as`/`any`. אם contract ישתנה — הקומפיילר ישבור כאן, וזו התנהגות רצויה.
 */
import type { RunSessionInput } from "@/lib/runs/types";

/**
 * `RunSessionInput` תקף ומלא. ברירת המחדל היא ריצת חוץ שהושלמה;
 * העבר `overrides` לשינוי שדות ספציפיים (למשל `{ run_type: "treadmill" }`).
 */
export function runInput(overrides: Partial<RunSessionInput> = {}): RunSessionInput {
  return {
    run_type: "outdoor",
    status: "completed",
    started_at: new Date("2026-07-01T06:00:00.000Z").toISOString(),
    ended_at: null,
    timezone: "Asia/Jerusalem",
    duration_seconds: 1800,
    distance_meters: 5000,
    average_speed_kmh: null,
    max_speed_kmh: null,
    average_pace_s_per_km: null,
    average_incline_pct: null,
    max_incline_pct: null,
    calories: null,
    average_heart_rate: null,
    max_heart_rate: null,
    average_cadence_spm: null,
    elevation_gain_m: null,
    elevation_loss_m: null,
    location_id: null,
    treadmill_id: null,
    route_id: null,
    country_code: null,
    city_or_area: null,
    free_text_location: null,
    perceived_effort: null,
    notes: null,
    segments: [],
    provenance: {},
    outlier_overrides: [],
    data_completeness: 0,
    primary_source: "manual",
    ...overrides,
  };
}
