/**
 * Selectors — פונקציות טהורות שמייצרות תצוגות מסוננות/ממוינות.
 * מחוץ ל־hooks כדי שיהיו testable ללא React.
 */
import type { EquipmentItem } from "@/lib/catalog";
import { getExerciseAvailability, type LocationEquipmentSnapshot } from "./availability";
import type { Exercise, ExerciseFilters } from "./types";
import { normalizeExerciseName } from "./schemas";

interface FilterContext {
  exercises: Exercise[];
  filters: ExerciseFilters;
  locationEquipment?: EquipmentItem[];
}

export function filterExercises({
  exercises,
  filters,
  locationEquipment,
}: FilterContext): Exercise[] {
  const snapshot: LocationEquipmentSnapshot | null = filters.onlyAvailableInLocation
    ? { locationId: filters.onlyAvailableInLocation, items: locationEquipment ?? [] }
    : null;

  const query = normalizeExerciseName(filters.query);

  return exercises.filter((e) => {
    if (filters.visibility === "active" && (!e.is_active || e.deleted_at !== null)) return false;
    if (filters.visibility === "archived") {
      if (e.deleted_at !== null || e.is_active) return false;
    }
    if (filters.visibility === "all" && e.deleted_at !== null) {
      // trash lives elsewhere, hide unless explicitly requested
      return false;
    }
    if (filters.favoritesOnly && !e.is_favorite) return false;
    if (filters.customOnly && !e.is_custom) return false;
    if (filters.muscleGroupIds.length > 0) {
      const inPrimary = filters.muscleGroupIds.includes(e.primary_muscle_group_id);
      const inSecondary = e.secondary_muscle_group_ids.some((id) =>
        filters.muscleGroupIds.includes(id),
      );
      if (!inPrimary && !inSecondary) return false;
    }
    if (
      filters.movementPatterns.length > 0 &&
      !filters.movementPatterns.includes(e.movement_pattern)
    )
      return false;
    if (filters.trackingTypes.length > 0 && !filters.trackingTypes.includes(e.tracking_type))
      return false;
    if (filters.categories.length > 0 && !filters.categories.includes(e.category)) return false;
    if (filters.difficulty.length > 0 && !filters.difficulty.includes(e.difficulty)) return false;

    if (snapshot) {
      const availability = getExerciseAvailability(e, snapshot);
      if (availability.status === "unavailable") return false;
    }

    if (query) {
      const haystacks = [e.name_he, e.name_en ?? "", ...e.aliases].map(normalizeExerciseName);
      if (!haystacks.some((h) => h.includes(query))) return false;
    }

    return true;
  });
}

/** מיון: מועדפים ראשית → פעילים → מותאם אישית → שם. */
export function sortExercisesForList(exercises: Exercise[]): Exercise[] {
  return exercises.slice().sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
    return a.name_he.localeCompare(b.name_he, "he");
  });
}
