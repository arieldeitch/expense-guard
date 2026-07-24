/**
 * Equipment compatibility — בודק זמינות ציוד לכל תרגילי התבנית במקום נתון.
 */
import {
  getExerciseAvailability,
  type LocationEquipmentSnapshot,
  getExercise,
} from "@/lib/exercises";
import { listEquipmentInLocation, getLocation } from "@/lib/catalog";
import { listTemplateExercises, getTemplate } from "./repo";
import type { TemplateEquipmentCheck } from "./types";

export function checkTemplateEquipment(templateId: string): TemplateEquipmentCheck {
  const template = getTemplate(templateId);
  const exs = listTemplateExercises(templateId);
  const locationId = template?.location_id ?? null;

  const snapshot: LocationEquipmentSnapshot | null = locationId
    ? { locationId, items: listEquipmentInLocation(locationId) }
    : null;

  const missing: TemplateEquipmentCheck["missingByExercise"] = [];
  let available = 0,
    partial = 0,
    unavailable = 0;

  for (const te of exs) {
    const ex = getExercise(te.exercise_id);
    if (!ex) continue;
    const status = getExerciseAvailability(ex, snapshot);
    if (status.status === "available") available += 1;
    else if (status.status === "partial") {
      partial += 1;
      if (status.missingOptional.length > 0) {
        missing.push({ exercise_id: te.exercise_id, missing: status.missingOptional });
      }
    } else if (status.status === "unavailable") {
      unavailable += 1;
      missing.push({ exercise_id: te.exercise_id, missing: status.missingRequired });
    }
  }

  return {
    totalExercises: exs.length,
    availableExercises: available,
    partialExercises: partial,
    unavailableExercises: unavailable,
    unknown: !locationId,
    missingByExercise: missing,
  };
}

/** משמש UI כדי להציג שם מקום. */
export function getTemplateLocationName(templateId: string): string | null {
  const t = getTemplate(templateId);
  if (!t?.location_id) return null;
  return getLocation(t.location_id)?.name ?? null;
}
