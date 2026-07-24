/**
 * Zod schemas — validation לטופס תבנית ותרגיל תבנית.
 */
import { z } from "zod";

export const templateFormSchema = z
  .object({
    name: z.string().trim().min(1, "יש להזין שם"),
    description: z.string().trim().max(2000).optional().nullable(),
    location_id: z.string().nullable().optional(),
    default_rest_seconds: z.number().int().min(0).max(3600).default(90),
  })
  .strict();

export type TemplateFormValues = z.infer<typeof templateFormSchema>;

export const templateExerciseFormSchema = z
  .object({
    planned_sets: z.number().int().min(1, "לפחות סט אחד").max(50),
    planned_reps: z.number().int().min(0).max(500).nullable(),
    rep_range_min: z.number().int().min(0).max(500).nullable(),
    rep_range_max: z.number().int().min(0).max(500).nullable(),
    planned_weight: z.number().min(0).max(1000).nullable(),
    weight_unit: z.enum(["kg", "lb"]),
    rest_seconds: z.number().int().min(0).max(3600).nullable(),
    default_rpe: z.number().min(1).max(10).nullable(),
    default_rir: z.number().int().min(0).max(10).nullable(),
    set_type: z.enum([
      "regular",
      "warmup",
      "drop_set",
      "failure",
      "amrap",
      "timed",
      "custom",
    ]),
    tempo: z.string().max(20).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine(
    (v) =>
      v.rep_range_min === null ||
      v.rep_range_max === null ||
      v.rep_range_min <= v.rep_range_max,
    { message: "מינימום גדול מהמקסימום", path: ["rep_range_min"] },
  );

export type TemplateExerciseFormValues = z.infer<typeof templateExerciseFormSchema>;
