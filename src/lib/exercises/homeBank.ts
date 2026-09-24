/**
 * Home exercise bank — what "הוסף תרגיל" offers, and in what order (ADR-0045).
 *
 * Two levels, never one long flat list:
 *   1. ציוד:  משקל גוף · דאמבלים · חבל  (+ the curated groups for everything else)
 *   2. inside דאמבלים: קבוצת שרירים → the exercises for that muscle, most common first.
 *
 * The bank is a VIEW over the existing catalogue (`listExercises`), keyed by slug. It adds no
 * second source of truth: an exercise appears here because it exists in the catalogue with the
 * right equipment and muscle group, and a user-created exercise shows up automatically.
 */
import type { BodyRegion, Exercise } from "./types";

export type HomeBankCategory = "bodyweight" | "dumbbells" | "rope";

export interface HomeBankCategoryDef {
  id: HomeBankCategory;
  label: string;
  hint: string;
}

export const HOME_BANK_CATEGORIES: HomeBankCategoryDef[] = [
  { id: "bodyweight", label: "משקל גוף", hint: "שכיבות סמיכה, בטן, סקוואט" },
  { id: "dumbbells", label: "דאמבלים", hint: "לפי קבוצת שרירים" },
  { id: "rope", label: "חבל", hint: "קפיצה בחבל" },
];

/** Muscle groups offered inside דאמבלים, in display order. */
export interface DumbbellGroupDef {
  id: string;
  label: string;
  /**
   * Catalogue muscle-group codes that belong to this group. "גב" covers back/lats/traps,
   * because the catalogue splits the back finer than a home routine needs to.
   */
  codes: string[];
  /** The exercise shown first — the simplest, most common one for a home setting. */
  firstSlug: string;
}

export const DUMBBELL_GROUPS: DumbbellGroupDef[] = [
  { id: "biceps", label: "יד קדמית", codes: ["biceps"], firstSlug: "dumbbell-bicep-curls" },
  {
    id: "shoulders",
    label: "כתפיים",
    codes: ["shoulders"],
    firstSlug: "seated-dumbbell-shoulder-press",
  },
  {
    id: "triceps",
    label: "יד אחורית",
    codes: ["triceps"],
    firstSlug: "overhead-triceps-extension",
  },
  { id: "chest", label: "חזה", codes: ["chest"], firstSlug: "dumbbell-floor-press" },
  {
    id: "back",
    label: "גב",
    codes: ["back", "lats", "traps"],
    firstSlug: "single-arm-dumbbell-row",
  },
];

const ROPE_SLUGS = ["jump-rope"];

function isActive(e: Exercise): boolean {
  return !e.deleted_at && e.is_active;
}

function usesDumbbells(e: Exercise): boolean {
  return (e.required_equipment_types ?? []).includes("dumbbells");
}

function isRope(e: Exercise): boolean {
  return ROPE_SLUGS.includes(e.slug);
}

/** Bodyweight home exercises: no equipment required, and not the rope entry. */
export function bodyweightExercises(all: Exercise[]): Exercise[] {
  return all.filter(
    (e) => isActive(e) && !isRope(e) && (e.required_equipment_types ?? []).length === 0,
  );
}

export function ropeExercises(all: Exercise[]): Exercise[] {
  return all.filter((e) => isActive(e) && isRope(e));
}

export function dumbbellExercises(all: Exercise[]): Exercise[] {
  return all.filter((e) => isActive(e) && usesDumbbells(e));
}

/**
 * Dumbbell exercises for one muscle group, common first.
 * `muscleGroupIdByCode` maps a code ("biceps") to the catalogue's muscle-group id, because
 * exercises store the id, not the code.
 */
export function dumbbellExercisesForGroup(
  all: Exercise[],
  group: DumbbellGroupDef,
  muscleGroupIdByCode: (code: string) => string | null,
): Exercise[] {
  const ids = new Set(
    group.codes.map(muscleGroupIdByCode).filter((id): id is string => Boolean(id)),
  );
  const isPrimary = (e: Exercise) => ids.has(e.primary_muscle_group_id ?? "");
  const list = dumbbellExercises(all).filter(
    (e) => isPrimary(e) || (e.secondary_muscle_group_ids ?? []).some((id) => ids.has(id)),
  );
  return list.sort((a, b) => {
    // 1) the designated common exercise, 2) primary before secondary, 3) Hebrew name
    if (a.slug === group.firstSlug) return -1;
    if (b.slug === group.firstSlug) return 1;
    const byPrimary = Number(isPrimary(b)) - Number(isPrimary(a));
    if (byPrimary !== 0) return byPrimary;
    return a.name_he.localeCompare(b.name_he, "he");
  });
}

/** Count shown on the category card, so the person knows there is something inside. */
export function bankCategoryCount(all: Exercise[], category: HomeBankCategory): number {
  if (category === "dumbbells") return dumbbellExercises(all).length;
  if (category === "rope") return ropeExercises(all).length;
  return bodyweightExercises(all).length;
}

/**
 * The coarse body region of an exercise, for the small badge: the exercise stores a muscle
 * group id, and the muscle group carries the region.
 */
export function bodyRegionOfExercise(
  exercise: Exercise,
  muscleGroups: { id: string; body_region: BodyRegion }[],
): BodyRegion | null {
  return muscleGroups.find((m) => m.id === exercise.primary_muscle_group_id)?.body_region ?? null;
}
