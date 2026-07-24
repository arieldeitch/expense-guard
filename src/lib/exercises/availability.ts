/**
 * Availability service — פונקציה דטרמיניסטית שקובעת האם תרגיל בר־ביצוע במקום מסוים.
 *
 * הכלל:
 *  - required_equipment_types + required_equipment_ids חסרים → unavailable.
 *  - optional_equipment חסר → partial (עדיין בר־ביצוע, בהתאמה).
 *  - אין ציוד נדרש כלל (bodyweight) → available.
 *  - מקום ריק / ללא ציוד ידוע → unknown.
 *
 * ה־service אינו קורא ל־storage — הוא מקבל את הציוד כפרמטר.
 */
import type { EquipmentItem } from "@/lib/catalog";
import type {
  AvailabilityStatus,
  EquipmentAvailabilitySummary,
  Exercise,
} from "./types";

export interface LocationEquipmentSnapshot {
  locationId: string;
  items: EquipmentItem[];
}

/**
 * מחזיר סיכום זמינות עבור תרגיל במקום.
 * "זמין" = כל ציוד נדרש (id + type) קיים במקום ו־availability_status='available'.
 * "חלקי" = כל הנדרש קיים אבל חלק מהאופציונלי חסר או תחת תחזוקה.
 * "לא זמין" = חסר לפחות פריט נדרש אחד.
 */
export function getExerciseAvailability(
  exercise: Exercise,
  snapshot: LocationEquipmentSnapshot | null,
): EquipmentAvailabilitySummary {
  const noRequirements =
    exercise.required_equipment_ids.length === 0 &&
    exercise.required_equipment_types.length === 0 &&
    exercise.optional_equipment_ids.length === 0 &&
    exercise.optional_equipment_types.length === 0;

  if (noRequirements) {
    return {
      status: "available",
      missingRequired: [],
      missingOptional: [],
      matchedRequired: [],
      matchedOptional: [],
      humanExplanation: exercise.bodyweight_based
        ? "משקל גוף — לא נדרש ציוד"
        : "לא הוגדר ציוד נדרש",
    };
  }

  if (!snapshot) {
    return {
      status: "unknown",
      missingRequired: [...exercise.required_equipment_types, ...exercise.required_equipment_ids],
      missingOptional: [...exercise.optional_equipment_types, ...exercise.optional_equipment_ids],
      matchedRequired: [],
      matchedOptional: [],
      humanExplanation: "לא נבחר מקום — לא ניתן לקבוע זמינות",
    };
  }

  const active = snapshot.items.filter(
    (i) => i.deleted_at === null && i.is_active && i.availability_status === "available",
  );
  const availableTypes = new Set(active.map((i) => i.equipment_type));
  const availableIds = new Set(active.map((i) => i.id));

  const matchedRequiredTypes = exercise.required_equipment_types.filter((t) => availableTypes.has(t as never));
  const missingRequiredTypes = exercise.required_equipment_types.filter((t) => !availableTypes.has(t as never));
  const matchedRequiredIds = exercise.required_equipment_ids.filter((id) => availableIds.has(id));
  const missingRequiredIds = exercise.required_equipment_ids.filter((id) => !availableIds.has(id));

  const matchedOptionalTypes = exercise.optional_equipment_types.filter((t) => availableTypes.has(t as never));
  const missingOptionalTypes = exercise.optional_equipment_types.filter((t) => !availableTypes.has(t as never));
  const matchedOptionalIds = exercise.optional_equipment_ids.filter((id) => availableIds.has(id));
  const missingOptionalIds = exercise.optional_equipment_ids.filter((id) => !availableIds.has(id));

  const missingRequired = [...missingRequiredTypes, ...missingRequiredIds];
  const missingOptional = [...missingOptionalTypes, ...missingOptionalIds];

  let status: AvailabilityStatus;
  if (missingRequired.length > 0) {
    status = "unavailable";
  } else if (missingOptional.length > 0) {
    status = "partial";
  } else {
    status = "available";
  }

  return {
    status,
    missingRequired,
    missingOptional,
    matchedRequired: [...matchedRequiredTypes, ...matchedRequiredIds],
    matchedOptional: [...matchedOptionalTypes, ...matchedOptionalIds],
    humanExplanation: buildExplanation(status, missingRequired, missingOptional),
  };
}

function buildExplanation(
  status: AvailabilityStatus,
  missingRequired: string[],
  missingOptional: string[],
): string {
  if (status === "available") return "כל הציוד הנדרש קיים במקום";
  if (status === "partial") {
    return `חסר ציוד אופציונלי: ${missingOptional.join(", ")}`;
  }
  if (status === "unavailable") {
    return `חסר ציוד נדרש: ${missingRequired.join(", ")}`;
  }
  return "מצב לא ידוע";
}

/** helper — עוטף את שני המקרים (עם/בלי snapshot) כדי לפשט קריאה מ־UI. */
export function isAvailable(summary: EquipmentAvailabilitySummary): boolean {
  return summary.status === "available" || summary.status === "partial";
}
