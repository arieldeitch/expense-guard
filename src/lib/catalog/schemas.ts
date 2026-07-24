/**
 * Zod schemas לוולידציה של טופסי catalog.
 * שדות חובה: name/display_name + טיפוס. כל השאר optional.
 */
import { z } from "zod";
import {
  AVAILABILITY_ORDERED,
  EQUIPMENT_TYPES_ORDERED,
  LOCATION_TYPES_ORDERED,
} from "./labels";

const COUNTRY_CODE = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/, "קוד מדינה חייב להיות שתי אותיות (ISO)")
  .transform((s) => s.toUpperCase());

const optionalNullableString = (max: number, message?: string) =>
  z
    .string()
    .trim()
    .max(max, message ?? `עד ${max} תווים`)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .nullable();

const optionalPositiveNumber = () =>
  z
    .number()
    .finite()
    .nonnegative("הערך חייב להיות אפס או חיובי")
    .optional()
    .nullable();

export const locationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "יש להזין שם למקום")
    .max(80, "עד 80 תווים"),
  location_type: z.enum(LOCATION_TYPES_ORDERED as [string, ...string[]]),
  country_code: COUNTRY_CODE.optional().nullable().or(z.literal("").transform(() => null)),
  city: optionalNullableString(80),
  area: optionalNullableString(80),
  address: optionalNullableString(200),
  description: optionalNullableString(500),
  notes: optionalNullableString(500),
  latitude: z
    .number()
    .min(-90, "קו רוחב לא תקין")
    .max(90, "קו רוחב לא תקין")
    .optional()
    .nullable(),
  longitude: z
    .number()
    .min(-180, "קו אורך לא תקין")
    .max(180, "קו אורך לא תקין")
    .optional()
    .nullable(),
  is_favorite: z.boolean().optional(),
  is_default: z.boolean().optional(),
});

export type LocationFormValues = z.infer<typeof locationFormSchema>;

export const treadmillFormSchema = z.object({
  location_id: z.string().min(1, "חסר מזהה מקום"),
  display_name: z.string().trim().min(1, "יש להזין שם תצוגה").max(80),
  machine_number: optionalNullableString(30),
  manufacturer: optionalNullableString(60),
  model: optionalNullableString(60),
  serial_number: optionalNullableString(80),
  visual_description: optionalNullableString(200),
  image_url: optionalNullableString(2_000_000, "תמונה גדולה מדי"),
  notes: optionalNullableString(500),
  is_favorite: z.boolean().optional(),
});

export type TreadmillFormValues = z.infer<typeof treadmillFormSchema>;

export const equipmentFormSchema = z
  .object({
    location_id: z.string().min(1, "חסר מזהה מקום"),
    name: z.string().trim().min(1, "יש להזין שם").max(80),
    equipment_type: z.enum(EQUIPMENT_TYPES_ORDERED as [string, ...string[]]),
    manufacturer: optionalNullableString(60),
    model: optionalNullableString(60),
    quantity: z
      .number()
      .int("כמות שלמה בלבד")
      .min(1, "כמות חייבת להיות לפחות 1")
      .max(9999),
    min_weight: optionalPositiveNumber(),
    max_weight: optionalPositiveNumber(),
    weight_increment: z
      .number()
      .finite()
      .positive("צעד חייב להיות חיובי")
      .optional()
      .nullable(),
    unit: z.enum(["kg", "lb"]).optional().nullable(),
    availability_status: z.enum(AVAILABILITY_ORDERED as [string, ...string[]]),
    image_url: optionalNullableString(2_000_000, "תמונה גדולה מדי"),
    notes: optionalNullableString(500),
    is_favorite: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.min_weight === null ||
      data.min_weight === undefined ||
      data.max_weight === null ||
      data.max_weight === undefined ||
      data.min_weight <= data.max_weight,
    { message: "משקל מינימלי חייב להיות ≤ משקל מקסימלי", path: ["max_weight"] },
  );

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

/** נורמליזציה של שם — לזיהוי כפילויות. */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/["'׳״`]/g, "")
    .replace(/\s+/g, " ");
}
