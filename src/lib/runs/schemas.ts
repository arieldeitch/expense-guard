/** Zod schemas + outlier detection for run inputs. */
import { z } from "zod";
import { REASONABLE_RANGES } from "./labels";
import type { RunNumericField } from "./types";

const nn = (min?: number, max?: number) => {
  let s = z.number().finite();
  if (min != null) s = s.min(min, `ערך קטן מדי (מינ' ${min})`);
  if (max != null) s = s.max(max, `ערך גדול מדי (מקס' ${max})`);
  return s.optional().nullable();
};

export const runFormSchema = z
  .object({
    run_type: z.enum(["treadmill", "outdoor"]),
    started_at: z.string().min(1, "יש לבחור תאריך ושעה"),
    duration_seconds: nn(0).refine((v) => v == null || v > 0, "משך חייב להיות חיובי"),
    distance_meters: nn(0),
    average_speed_kmh: nn(0),
    max_speed_kmh: nn(0),
    average_pace_s_per_km: nn(0),
    average_incline_pct: nn(-20, 60),
    max_incline_pct: nn(-20, 60),
    calories: nn(0, 20_000),
    average_heart_rate: nn(20, 250),
    max_heart_rate: nn(20, 250),
    average_cadence_spm: nn(20, 300),
    elevation_gain_m: nn(0, 15_000),
    elevation_loss_m: nn(0, 15_000),
    perceived_effort: nn(1, 10),
    location_id: z.string().nullable().optional(),
    treadmill_id: z.string().nullable().optional(),
    route_id: z.string().nullable().optional(),
    country_code: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/i, "קוד מדינה חייב להיות שתי אותיות")
      .transform((s) => s.toUpperCase())
      .nullable()
      .optional()
      .or(z.literal("").transform(() => null)),
    city_or_area: z.string().trim().max(120).nullable().optional(),
    free_text_location: z.string().trim().max(200).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    status: z.enum(["draft", "completed", "archived"]),
  })
  .refine(
    (v) =>
      v.status === "draft" ||
      v.duration_seconds != null ||
      v.distance_meters != null ||
      v.average_pace_s_per_km != null ||
      v.average_speed_kmh != null,
    {
      message: "יש להזין לפחות מדד ביצוע אחד (משך, מרחק, קצב או מהירות)",
      path: ["duration_seconds"],
    },
  );

export type RunFormValues = z.infer<typeof runFormSchema>;

export const routeFormSchema = z.object({
  name: z.string().trim().min(1, "יש להזין שם למסלול").max(80),
  route_type: z.enum(["fixed", "park", "road", "trail", "city", "loop", "other"]),
  location_id: z.string().nullable().optional(),
  country_code: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/i, "קוד מדינה חייב להיות שתי אותיות")
    .transform((s) => s.toUpperCase())
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  city_or_area: z.string().trim().max(120).nullable().optional(),
  typical_distance_meters: z.number().finite().min(0).max(500_000).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  is_favorite: z.boolean().optional(),
});
export type RouteFormValues = z.infer<typeof routeFormSchema>;

/** מזהה שדות שנמצאים מחוץ לטווח סביר — לאזהרה, לא לחסימה. */
export function detectOutliers(
  values: Partial<Record<RunNumericField | "perceived_effort", number | null>>,
): (RunNumericField | "perceived_effort")[] {
  const out: (RunNumericField | "perceived_effort")[] = [];
  for (const [field, range] of Object.entries(REASONABLE_RANGES) as [
    keyof typeof REASONABLE_RANGES,
    { min: number; max: number },
  ][]) {
    const v = values[field as keyof typeof values];
    if (v == null || !Number.isFinite(v)) continue;
    if (v < range.min || v > range.max) out.push(field as RunNumericField | "perceived_effort");
  }
  return out;
}
