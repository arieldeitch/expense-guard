/**
 * Zod schemas לוולידציה של טפסי exercises.
 * שדות חובה: שם, קטגוריה, קבוצת שריר ראשית, סוג מעקב.
 */
import { z } from "zod";
import {
  CATEGORIES_ORDERED,
  DIFFICULTIES_ORDERED,
  MOVEMENT_PATTERNS_ORDERED,
  TRACKING_TYPES_ORDERED,
} from "./labels";

const optionalNullableString = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `עד ${max} תווים`)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .nullable();

export const exerciseFormSchema = z
  .object({
    name_he: z.string().trim().min(1, "יש להזין שם").max(120, "עד 120 תווים"),
    name_en: optionalNullableString(120),
    aliases: z.array(z.string().trim().min(1).max(60)).max(10, "עד 10 שמות חלופיים").optional(),
    category: z.enum(CATEGORIES_ORDERED as [string, ...string[]]),
    primary_muscle_group_id: z.string().min(1, "יש לבחור קבוצת שריר ראשית"),
    secondary_muscle_group_ids: z.array(z.string().min(1)).max(6, "עד 6 קבוצות שריר משניות"),
    movement_pattern: z.enum(MOVEMENT_PATTERNS_ORDERED as [string, ...string[]]),
    tracking_type: z.enum(TRACKING_TYPES_ORDERED as [string, ...string[]]),
    required_equipment_ids: z.array(z.string().min(1)).max(20),
    optional_equipment_ids: z.array(z.string().min(1)).max(20),
    required_equipment_types: z.array(z.string().min(1)).max(20),
    optional_equipment_types: z.array(z.string().min(1)).max(20),
    unilateral: z.boolean().optional(),
    bodyweight_based: z.boolean().optional(),
    difficulty: z.enum(DIFFICULTIES_ORDERED as [string, ...string[]]),
    default_sets: z.number().int().min(1, "לפחות סט אחד").max(20),
    default_reps: z.number().int().min(1).max(999).nullable().optional(),
    default_rep_range_min: z.number().int().min(1).max(999).nullable().optional(),
    default_rep_range_max: z.number().int().min(1).max(999).nullable().optional(),
    default_rest_seconds: z.number().int().min(0).max(3600).nullable().optional(),
    default_rpe: z.number().min(1).max(10).nullable().optional(),
    default_rir: z.number().int().min(0).max(10).nullable().optional(),
    instructions: optionalNullableString(2000),
    technique_cues: z.array(z.string().trim().min(1).max(200)).max(10),
    common_mistakes: z.array(z.string().trim().min(1).max(200)).max(10),
    safety_notes: optionalNullableString(500),
    personal_notes: optionalNullableString(500),
    location_ids: z.array(z.string().min(1)).optional(),
    parent_exercise_id: z.string().min(1).nullable().optional(),
    variation_notes: optionalNullableString(300),
    is_favorite: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.default_rep_range_min == null ||
      data.default_rep_range_max == null ||
      data.default_rep_range_min <= data.default_rep_range_max,
    { message: "טווח חזרות מינימלי חייב להיות ≤ מקסימלי", path: ["default_rep_range_max"] },
  );

export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

/** נורמליזציה של שם לזיהוי כפילות. */
export function normalizeExerciseName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/["'׳״`]/g, "")
    .replace(/\s+/g, " ");
}
