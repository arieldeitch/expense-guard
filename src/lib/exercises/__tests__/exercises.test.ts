/**
 * Exercises tests — data-layer.
 * מכסה: seed, יצירה, שכפול, ארכוב, מחיקת מערכת (→ ארכוב), חלופות, זמינות, פילטרים.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  _resetExercisesStateForTests,
  archiveExercise,
  createExercise,
  duplicateExercise,
  filterExercises,
  findAlternatives,
  findSimilarExercises,
  getExerciseAvailability,
  listExercises,
  listMuscleGroups,
  restoreExercise,
  toggleFavoriteExercise,
  trashExercise,
  updateExercise,
  EMPTY_EXERCISE_FILTERS,
  type Exercise,
} from "@/lib/exercises";
import type { EquipmentItem } from "@/lib/catalog";

function makeEquipment(type: string, id = `eq-${type}`): EquipmentItem {
  const now = new Date().toISOString();
  return {
    id,
    owner_id: "single-user",
    location_id: "loc-1",
    name: `test-${type}`,
    equipment_type: type as EquipmentItem["equipment_type"],
    manufacturer: null,
    model: null,
    quantity: 1,
    min_weight: null,
    max_weight: null,
    weight_increment: null,
    unit: null,
    availability_status: "available",
    image_url: null,
    notes: null,
    is_favorite: false,
    is_active: true,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}

describe("exercises seed", () => {
  beforeEach(() => _resetExercisesStateForTests());

  it("seeds muscle groups on first read", () => {
    const mgs = listMuscleGroups();
    expect(mgs.length).toBeGreaterThan(10);
    expect(mgs.find((m) => m.code === "chest")).toBeTruthy();
    expect(mgs.find((m) => m.code === "hamstrings")).toBeTruthy();
  });

  it("seeds a starter catalog of exercises", () => {
    const ex = listExercises();
    expect(ex.length).toBeGreaterThan(20);
    expect(ex.some((e) => e.slug === "barbell-bench-press")).toBe(true);
    expect(ex.some((e) => e.slug === "push-ups")).toBe(true);
  });

  it("system exercises are marked is_system=true", () => {
    const ex = listExercises();
    expect(ex.every((e) => e.is_system === true)).toBe(true);
  });

  it("does not re-seed after existing state loaded", () => {
    listExercises();
    const before = listExercises().length;
    listExercises();
    listMuscleGroups();
    expect(listExercises().length).toBe(before);
  });
});

describe("exercises repo", () => {
  beforeEach(() => _resetExercisesStateForTests());

  it("creates a custom exercise with unique slug", () => {
    const mgs = listMuscleGroups();
    const created = createExercise({
      name_he: "לחיצת חזה במוט",
      name_en: null,
      aliases: [],
      slug: "",
      category: "compound",
      primary_muscle_group_id: mgs[0].id,
      secondary_muscle_group_ids: [],
      movement_pattern: "horizontal_push",
      tracking_type: "weight_reps",
      required_equipment_ids: [],
      optional_equipment_ids: [],
      required_equipment_types: [],
      optional_equipment_types: [],
      unilateral: false,
      bodyweight_based: false,
      difficulty: "intermediate",
      default_sets: 3,
      default_reps: 12,
      default_rep_range_min: null,
      default_rep_range_max: null,
      default_rest_seconds: 60,
      default_rpe: null,
      default_rir: null,
      instructions: null,
      technique_cues: [],
      common_mistakes: [],
      safety_notes: null,
      personal_notes: null,
      location_ids: [],
      parent_exercise_id: null,
      variation_type: null,
      variation_notes: null,
      is_custom: true,
    });
    expect(created.slug).not.toBe("barbell-bench-press");
    expect(created.is_system).toBe(false);
    expect(created.is_custom).toBe(true);
  });

  it("finds similar exercises by normalized name", () => {
    const similar = findSimilarExercises("שכיבות סמיכה");
    expect(similar.length).toBeGreaterThan(0);
  });

  it("duplicating creates editable custom copy without variation link", () => {
    const src = listExercises().find((e) => e.slug === "barbell-bench-press");
    expect(src).toBeTruthy();
    const dup = duplicateExercise(src!.id);
    expect(dup).toBeTruthy();
    expect(dup!.is_custom).toBe(true);
    expect(dup!.is_system).toBe(false);
    expect(dup!.parent_exercise_id).toBeNull();
    expect(dup!.slug).not.toBe(src!.slug);
  });

  it("archives a system exercise instead of trashing it", () => {
    const src = listExercises().find((e) => e.is_system);
    expect(src).toBeTruthy();
    trashExercise(src!.id);
    const after = listExercises().find((e) => e.id === src!.id);
    expect(after?.deleted_at).toBeNull();
    expect(after?.is_active).toBe(false);
  });

  it("soft-deletes and restores a custom exercise", () => {
    const dup = duplicateExercise(listExercises()[0].id)!;
    trashExercise(dup.id);
    expect(listExercises().find((e) => e.id === dup.id)?.deleted_at).not.toBeNull();
    restoreExercise(dup.id);
    const restored = listExercises().find((e) => e.id === dup.id);
    expect(restored?.deleted_at).toBeNull();
    expect(restored?.is_active).toBe(true);
  });

  it("toggles favorite", () => {
    const target = listExercises()[0];
    toggleFavoriteExercise(target.id);
    expect(listExercises().find((e) => e.id === target.id)?.is_favorite).toBe(true);
  });

  it("updates a custom exercise but not is_system", () => {
    const dup = duplicateExercise(listExercises()[0].id)!;
    const updated = updateExercise(dup.id, { name_he: "שם חדש" });
    expect(updated?.name_he).toBe("שם חדש");
    expect(updated?.is_system).toBe(false);
  });
});

describe("availability service", () => {
  beforeEach(() => _resetExercisesStateForTests());

  it("bodyweight exercises are available anywhere", () => {
    const pushups = listExercises().find((e) => e.slug === "push-ups")!;
    const a = getExerciseAvailability(pushups, { locationId: "loc-1", items: [] });
    expect(a.status).toBe("available");
  });

  it("marks unavailable when required equipment is missing", () => {
    const bench = listExercises().find((e) => e.slug === "barbell-bench-press")!;
    const a = getExerciseAvailability(bench, { locationId: "loc-1", items: [] });
    expect(a.status).toBe("unavailable");
    expect(a.missingRequired).toContain("barbell");
  });

  it("marks available when all required equipment exists", () => {
    const bench = listExercises().find((e) => e.slug === "barbell-bench-press")!;
    const a = getExerciseAvailability(bench, {
      locationId: "loc-1",
      items: [makeEquipment("barbell"), makeEquipment("bench")],
    });
    expect(a.status).toBe("available");
  });

  it("returns unknown when snapshot is null", () => {
    const bench = listExercises().find((e) => e.slug === "barbell-bench-press")!;
    const a = getExerciseAvailability(bench, null);
    expect(a.status).toBe("unknown");
  });

  it("marks partial when required exists but optional missing", () => {
    const bulg = listExercises().find((e) => e.slug === "bulgarian-split-squat")!;
    // bulg has no required, only optional (dumbbells, bench). With no gear:
    const a = getExerciseAvailability(bulg, { locationId: "loc-1", items: [] });
    expect(a.status).toBe("partial");
  });
});

describe("alternatives service", () => {
  beforeEach(() => _resetExercisesStateForTests());

  it("prefers exercises with same primary muscle and available equipment", () => {
    const target = listExercises().find((e) => e.slug === "barbell-bench-press")!;
    const pool = listExercises();
    const alts = findAlternatives(target, {
      candidatePool: pool,
      snapshot: { locationId: "loc-1", items: [] },
    });
    expect(alts.length).toBeGreaterThan(0);
    // Push-ups should rank high (same primary muscle + fully available bodyweight)
    const pushups = alts.find((a) => a.exercise.slug === "push-ups");
    expect(pushups).toBeTruthy();
  });

  it("excludes the target exercise itself", () => {
    const target = listExercises()[0];
    const alts = findAlternatives(target, {
      candidatePool: listExercises(),
      snapshot: null,
    });
    expect(alts.every((a) => a.exercise.id !== target.id)).toBe(true);
  });
});

describe("filterExercises selector", () => {
  beforeEach(() => _resetExercisesStateForTests());

  it("filters by hebrew query", () => {
    const items = listExercises();
    const filtered = filterExercises({
      exercises: items,
      filters: { ...EMPTY_EXERCISE_FILTERS, query: "שכיבות" },
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((e) => /שכיבות/.test(e.name_he))).toBe(true);
  });

  it("filters by english query", () => {
    const items = listExercises();
    const filtered = filterExercises({
      exercises: items,
      filters: { ...EMPTY_EXERCISE_FILTERS, query: "squat" },
    });
    expect(filtered.some((e) => (e.name_en ?? "").toLowerCase().includes("squat"))).toBe(true);
  });

  it("filters by aliases", () => {
    const items = listExercises();
    const filtered = filterExercises({
      exercises: items,
      filters: { ...EMPTY_EXERCISE_FILTERS, query: "בנץ" },
    });
    expect(filtered.some((e) => e.aliases.includes("בנץ'"))).toBe(true);
  });

  it("filters by location availability", () => {
    const items = listExercises();
    const filtered = filterExercises({
      exercises: items,
      filters: { ...EMPTY_EXERCISE_FILTERS, onlyAvailableInLocation: "loc-1" },
      locationEquipment: [],
    });
    // With no equipment, no exercise requiring gear should pass; bodyweight ones do.
    expect(filtered.every((e) => e.required_equipment_types.length === 0)).toBe(true);
  });

  it("hides archived by default and shows when requested", () => {
    const target = listExercises()[0];
    archiveExercise(target.id);
    const items = listExercises();
    const activeOnly = filterExercises({ exercises: items, filters: EMPTY_EXERCISE_FILTERS });
    expect(activeOnly.some((e) => e.id === target.id)).toBe(false);
    const archived = filterExercises({
      exercises: items,
      filters: { ...EMPTY_EXERCISE_FILTERS, visibility: "archived" },
    });
    expect(archived.some((e) => e.id === target.id)).toBe(true);
  });
});
