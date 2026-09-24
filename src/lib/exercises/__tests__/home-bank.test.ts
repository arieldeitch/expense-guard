/**
 * ADR-0045/0046 — the home exercise bank: equipment → muscle group → exercise, common first,
 * no duplicate catalogue entries, and an illustration key for the movements Ariel actually uses.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { listExercises, listMuscleGroups } from "@/lib/exercises";
import { _resetExercisesStateForTests } from "@/lib/exercises/storage";
import {
  DUMBBELL_GROUPS,
  HOME_BANK_CATEGORIES,
  bankCategoryCount,
  bodyRegionOfExercise,
  bodyweightExercises,
  dumbbellExercises,
  dumbbellExercisesForGroup,
  ropeExercises,
} from "@/lib/exercises/homeBank";
import { movementForSlug } from "@/components/exercises/ExerciseMovementIllustration";

const idByCode = (code: string) => listMuscleGroups().find((m) => m.code === code)?.id ?? null;

describe("home exercise bank", () => {
  beforeEach(() => _resetExercisesStateForTests());

  it("offers three equipment categories, each with something in it", () => {
    expect(HOME_BANK_CATEGORIES.map((c) => c.id)).toEqual(["bodyweight", "dumbbells", "rope"]);
    for (const c of HOME_BANK_CATEGORIES)
      expect(bankCategoryCount(listExercises(), c.id)).toBeGreaterThan(0);
  });

  it("includes the push-up widths and abdominal variants Ariel asked for", () => {
    const slugs = listExercises().map((e) => e.slug);
    for (const slug of [
      "push-ups",
      "diamond-push-ups",
      "wide-push-ups",
      "crunches",
      "sit-ups",
      "reverse-crunches",
      "jump-rope",
    ])
      expect(slugs).toContain(slug);
  });

  it("has no duplicate catalogue entries after the additions", () => {
    const all = listExercises();
    const slugs = all.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const names = all.map((e) => e.name_he.trim());
    expect(new Set(names).size).toBe(names.length);
    // The dumbbell staples exist exactly once, under their original slugs.
    for (const slug of [
      "dumbbell-bicep-curls",
      "seated-dumbbell-shoulder-press",
      "overhead-triceps-extension",
      "dumbbell-floor-press",
      "single-arm-dumbbell-row",
    ])
      expect(slugs.filter((s) => s === slug)).toHaveLength(1);
  });

  it("navigates dumbbells by muscle group with the common exercise first", () => {
    const all = listExercises();
    expect(DUMBBELL_GROUPS.map((g) => g.label)).toEqual([
      "יד קדמית",
      "כתפיים",
      "יד אחורית",
      "חזה",
      "גב",
    ]);
    for (const group of DUMBBELL_GROUPS) {
      const list = dumbbellExercisesForGroup(all, group, idByCode);
      expect(list.length).toBeGreaterThan(0);
      expect(list[0].slug).toBe(group.firstSlug);
      for (const e of list) expect(e.required_equipment_types).toContain("dumbbells");
    }
  });

  it("keeps bodyweight, dumbbells and rope apart", () => {
    const all = listExercises();
    expect(bodyweightExercises(all).every((e) => e.required_equipment_types.length === 0)).toBe(
      true,
    );
    expect(
      dumbbellExercises(all).every((e) => e.required_equipment_types.includes("dumbbells")),
    ).toBe(true);
    expect(ropeExercises(all).map((e) => e.slug)).toEqual(["jump-rope"]);
    expect(bodyweightExercises(all).map((e) => e.slug)).not.toContain("jump-rope");
  });

  it("resolves a body region for the badge", () => {
    const groups = listMuscleGroups();
    const pushUps = listExercises().find((e) => e.slug === "push-ups")!;
    expect(bodyRegionOfExercise(pushUps, groups)).toBe("chest");
  });

  it("maps the common movements to a start/end illustration", () => {
    expect(movementForSlug("push-ups")).toBe("push-up");
    expect(movementForSlug("diamond-push-ups")).toBe("diamond-push-up");
    expect(movementForSlug("wide-push-ups")).toBe("wide-push-up");
    expect(movementForSlug("crunches")).toBe("crunch");
    expect(movementForSlug("dumbbell-bicep-curls")).toBe("dumbbell-curl");
    expect(movementForSlug("seated-dumbbell-shoulder-press")).toBe("shoulder-press");
    expect(movementForSlug("overhead-triceps-extension")).toBe("triceps-extension");
    expect(movementForSlug("dumbbell-floor-press")).toBe("floor-press");
    expect(movementForSlug("single-arm-dumbbell-row")).toBe("row");
    expect(movementForSlug("jump-rope")).toBe("jump-rope");
    // Unknown slugs render nothing rather than breaking the card.
    expect(movementForSlug("bodyweight-squat")).toBeNull();
    expect(movementForSlug(null)).toBeNull();
  });
});
