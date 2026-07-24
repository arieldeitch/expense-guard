/**
 * Zod schemas ל-Suunto snapshot ו-custom metrics.
 * מגבלות פר-metric נגזרות מ-metric registry.
 */
import { z } from "zod";
import { METRIC_DEFS, metricDef } from "./metrics";

export const customMetricSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "תווית נדרשת")
    .max(40, "תווית ארוכה מדי"),
  value: z.union([
    z
      .number()
      .refine((n) => Number.isFinite(n), { message: "ערך לא תקין" }),
    z.string().trim().min(1, "ערך נדרש").max(80),
  ]),
  unit: z.string().trim().max(20).nullable(),
});

/** בונה scheme עבור snapshot עם ולידציה של טווח פר-metric. */
export const suuntoSnapshotSchema = z
  .object({
    device_name: z.string().trim().max(60).nullable(),
    device_model: z.string().trim().max(60).nullable(),
    distance_meters: z.number().nullable(),
    duration_seconds: z.number().nullable(),
    average_pace_s_per_km: z.number().nullable(),
    average_speed_kmh: z.number().nullable(),
    max_speed_kmh: z.number().nullable(),
    average_heart_rate: z.number().nullable(),
    max_heart_rate: z.number().nullable(),
    average_cadence_spm: z.number().nullable(),
    calories: z.number().nullable(),
    training_effect: z.number().nullable(),
    peak_training_effect: z.number().nullable(),
    epoc_ml_kg: z.number().nullable(),
    recovery_time_hours: z.number().nullable(),
    ascent_m: z.number().nullable(),
    descent_m: z.number().nullable(),
    notes: z.string().max(2000).nullable(),
    custom: z.array(customMetricSchema).max(20),
  })
  .superRefine((val, ctx) => {
    for (const def of METRIC_DEFS) {
      const v = (val as unknown as Record<string, number | null>)[def.key];
      if (v == null) continue;
      if (!Number.isFinite(v)) {
        ctx.addIssue({ code: "custom", path: [def.key], message: "ערך לא תקין" });
        continue;
      }
      if (def.min != null && v < def.min) {
        ctx.addIssue({
          code: "custom",
          path: [def.key],
          message: `נמוך מהטווח הצפוי (מינימום ${def.min})`,
        });
      }
      if (def.max != null && v > def.max) {
        ctx.addIssue({
          code: "custom",
          path: [def.key],
          message: `גבוה מהטווח הצפוי (מקסימום ${def.max})`,
        });
      }
    }
  });

export type SuuntoSnapshotInput = z.infer<typeof suuntoSnapshotSchema>;

/** בודק אם ערך נכנס לטווח הסביר בלי לזרוק — לשימוש ב-UI עבור סימון "חריג". */
export function isOutOfRange(metricKey: string, value: number | null): boolean {
  if (value == null || !Number.isFinite(value)) return false;
  const d = metricDef(metricKey);
  if (!d) return false;
  if (d.min != null && value < d.min) return true;
  if (d.max != null && value > d.max) return true;
  return false;
}
