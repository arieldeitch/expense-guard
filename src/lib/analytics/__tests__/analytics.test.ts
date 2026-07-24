/**
 * Analytics — unit tests.
 * מכסה נוסחאות 1RM, comparability, PRs, volume, quality, progress, session history.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_ONE_RM_FORMULA,
  bestEstimate1RM,
  compareSets,
  compareSessions,
  computeWorkoutQuality,
  detectSessionRecords,
  estimate1RMForSet,
  getExerciseHistorySummary,
  getFormula,
  isWorkingSet,
  listSessionHistory,
  setVolumeKg,
  sumSetsVolumeKg,
} from "@/lib/analytics";
import {
  _resetSessionsStateForTests,
  addSet,
  completeSet,
  finishSession,
  startEmptySession,
  addExerciseToSession,
  updateSet,
} from "@/lib/sessions";
import { _resetExercisesStateForTests, createExercise, createMuscleGroup } from "@/lib/exercises";
import { _resetCatalogStateForTests } from "@/lib/catalog";
import { _resetTemplatesStateForTests } from "@/lib/templates";

function makeExercise(overrides: Partial<Parameters<typeof createExercise>[0]> = {}) {
  const mg = createMuscleGroup({ name_he: "חזה", body_region: "chest", is_primary: true });
  return createExercise({
    name_he: "לחיצת חזה",
    name_en: "Bench Press",
    domain: "gym",
    category: "compound",
    movement_pattern: "push_horizontal",
    tracking_type: "weight_reps",
    difficulty: "intermediate",
    primary_muscle_group_id: mg.id,
    secondary_muscle_group_ids: [],
    tags: [],
    equipment_ids: [],
    is_system: false,
    ...overrides,
  });
}

beforeEach(() => {
  _resetCatalogStateForTests();
  _resetTemplatesStateForTests();
  _resetExercisesStateForTests();
  _resetSessionsStateForTests();
});

// ---------- Formulas / 1RM ----------

describe("1RM formulas", () => {
  it("Epley returns weight for 1 rep", () => {
    const f = getFormula("epley-v1");
    expect(f.compute(100, 1)).toBe(100);
  });
  it("Epley increases with reps", () => {
    const f = getFormula("epley-v1");
    expect(f.compute(100, 5)).toBeCloseTo(100 * (1 + 5 / 30), 3);
  });
  it("Brzycki matches formula", () => {
    const f = getFormula("brzycki-v1");
    expect(f.compute(100, 5)).toBeCloseTo(100 * (36 / 32), 3);
  });
  it("default is Epley v1", () => {
    expect(DEFAULT_ONE_RM_FORMULA).toBe("epley-v1");
  });
});

describe("estimate1RMForSet guards", () => {
  const base = {
    id: "s1",
    session_exercise_id: "x",
    set_number: 1,
    weight_unit: "kg" as const,
    duration_seconds: null,
    distance_meters: null,
    rpe: null,
    rir: null,
    rest_seconds: null,
    side: null,
    assistance_value: null,
    notes: null,
    completed_at: null,
    created_at: "",
    updated_at: "",
    deleted_at: null,
    skipped: false,
    planned_reps: null,
    planned_weight: null,
  };
  it("rejects warmup", () => {
    const s = { ...base, set_type: "warmup" as const, actual_reps: 5, actual_weight: 100, completed: true };
    expect(estimate1RMForSet(s, { trackingType: "weight_reps" }).value).toBeNull();
  });
  it("rejects incompatible tracking", () => {
    const s = { ...base, set_type: "regular" as const, actual_reps: 5, actual_weight: 100, completed: true };
    expect(estimate1RMForSet(s, { trackingType: "time" }).value).toBeNull();
  });
  it("rejects when reps too high", () => {
    const s = { ...base, set_type: "regular" as const, actual_reps: 15, actual_weight: 60, completed: true };
    expect(estimate1RMForSet(s, { trackingType: "weight_reps" }).value).toBeNull();
  });
  it("accepts valid working set", () => {
    const s = { ...base, set_type: "regular" as const, actual_reps: 5, actual_weight: 100, completed: true };
    const out = estimate1RMForSet(s, { trackingType: "weight_reps" }).value!;
    expect(out.formula).toBe("epley-v1");
    expect(out.value).toBeGreaterThan(100);
  });
});

// ---------- Comparability ----------

describe("compareSets", () => {
  const base = {
    id: "x",
    session_exercise_id: "e",
    set_number: 1,
    set_type: "regular" as const,
    planned_reps: null,
    actual_reps: 8,
    planned_weight: null,
    actual_weight: 60,
    weight_unit: "kg" as const,
    duration_seconds: null,
    distance_meters: null,
    rpe: null,
    rir: null,
    rest_seconds: null,
    side: null,
    assistance_value: null,
    completed: true,
    skipped: false,
    notes: null,
    completed_at: null,
    created_at: "",
    updated_at: "",
    deleted_at: null,
  };
  it("comparable when identical shape", () => {
    expect(compareSets(base, { ...base, id: "y" }).comparable).toBe(true);
  });
  it("warmup vs working is not comparable", () => {
    const r = compareSets(base, { ...base, id: "y", set_type: "warmup" });
    expect(r.comparable).toBe(false);
    expect(r.reasons).toContain("warmup_vs_working");
  });
  it("large reps gap flagged", () => {
    const r = compareSets(base, { ...base, id: "y", actual_reps: 1 });
    expect(r.reasons).toContain("reps_gap_too_large");
  });
  it("unit mismatch flagged", () => {
    const r = compareSets(base, { ...base, id: "y", weight_unit: "lb" });
    expect(r.reasons).toContain("different_unit");
  });
  it("isWorkingSet excludes warmup", () => {
    expect(isWorkingSet({ ...base, set_type: "warmup" })).toBe(false);
    expect(isWorkingSet(base)).toBe(true);
  });
});

// ---------- Volume ----------

describe("volume calculations", () => {
  const snap = { unilateral: false, tracking_type: "weight_reps" as const };
  const mkSet = (o: Record<string, unknown> = {}) => ({
    id: "s",
    session_exercise_id: "e",
    set_number: 1,
    set_type: "regular" as const,
    planned_reps: null,
    actual_reps: 10,
    planned_weight: null,
    actual_weight: 50,
    weight_unit: "kg" as const,
    duration_seconds: null,
    distance_meters: null,
    rpe: null,
    rir: null,
    rest_seconds: null,
    side: null,
    assistance_value: null,
    completed: true,
    skipped: false,
    notes: null,
    completed_at: null,
    created_at: "",
    updated_at: "",
    deleted_at: null,
    ...o,
  });
  it("weight × reps for a working set", () => {
    expect(setVolumeKg(mkSet(), snap)).toBe(500);
  });
  it("warmup excluded by default", () => {
    expect(setVolumeKg(mkSet({ set_type: "warmup" }), snap)).toBe(0);
  });
  it("skipped/not completed → zero", () => {
    expect(setVolumeKg(mkSet({ completed: false }), snap)).toBe(0);
    expect(setVolumeKg(mkSet({ skipped: true }), snap)).toBe(0);
  });
  it("unilateral doubles", () => {
    expect(setVolumeKg(mkSet(), { ...snap, unilateral: true })).toBe(1000);
  });
  it("bodyweight/time returns zero (not computed here)", () => {
    expect(setVolumeKg(mkSet(), { ...snap, tracking_type: "bodyweight_reps" })).toBe(0);
    expect(setVolumeKg(mkSet(), { ...snap, tracking_type: "time" })).toBe(0);
  });
  it("lb → kg conversion", () => {
    const v = setVolumeKg(mkSet({ actual_weight: 100, weight_unit: "lb" }), snap);
    expect(v).toBeCloseTo(100 * 0.453592 * 10, 1);
  });
  it("sum aggregates", () => {
    expect(sumSetsVolumeKg([mkSet(), mkSet({ id: "s2" })], snap)).toBe(1000);
  });
});

// ---------- Integration: PRs, quality, history ----------

function completeAllSets(exId: string, weights: number[], reps: number) {
  // requires the exercise to have sets already; addSet with copy from prev
  // returns the created sets; we manipulate then complete.
  return { exId, weights, reps };
}

describe("session records — baseline vs PRs", () => {
  it("first session with an exercise emits baseline, not a PR", () => {
    const ex = makeExercise();
    const session = startEmptySession("אימון א׳");
    const se = addExerciseToSession(session.id, ex.id);
    expect(se).not.toBeNull();
    const set = addSet(se!.id, false)!;
    completeSet(set.id, { actual_reps: 5, actual_weight: 60 });
    finishSession(session.id);
    const recs = detectSessionRecords(session.id);
    const baselines = recs.filter((r) => r.isBaseline);
    const real = recs.filter((r) => !r.isBaseline);
    expect(baselines.length).toBeGreaterThan(0);
    expect(real.length).toBe(0);
  });

  it("second session with higher weight generates real PRs", () => {
    const ex = makeExercise();
    const s1 = startEmptySession("א");
    const se1 = addExerciseToSession(s1.id, ex.id)!;
    const set1 = addSet(se1.id, false)!;
    completeSet(set1.id, { actual_reps: 5, actual_weight: 60 });
    finishSession(s1.id);

    const s2 = startEmptySession("ב");
    const se2 = addExerciseToSession(s2.id, ex.id)!;
    const set2 = addSet(se2.id, false)!;
    completeSet(set2.id, { actual_reps: 5, actual_weight: 70 });
    finishSession(s2.id);

    const recs = detectSessionRecords(s2.id).filter((r) => !r.isBaseline);
    const kinds = new Set(recs.map((r) => r.kind));
    expect(kinds.has("top_weight")).toBe(true);
    expect(kinds.has("more_weight_same_reps")).toBe(true);
  });
});

describe("Workout Quality Score", () => {
  it("normalizes weights when RPE/rest absent (no penalty for missing optionals)", () => {
    const ex = makeExercise();
    const s = startEmptySession("א");
    const se = addExerciseToSession(s.id, ex.id)!;
    const set = addSet(se.id, false)!;
    updateSet(set.id, { planned_reps: 8, planned_weight: 60 });
    completeSet(set.id, { actual_reps: 8, actual_weight: 60 });
    finishSession(s.id);
    const q = computeWorkoutQuality(s.id);
    expect(q.excludedComponents).toContain("rpe_alignment");
    expect(q.excludedComponents).toContain("rest_adherence");
    const totalWeight = q.components.reduce((sum, c) => sum + c.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 5);
    if (q.totalScore != null) expect(q.totalScore).toBeLessThanOrEqual(100);
  });
});

describe("session history + comparison", () => {
  it("lists completed session in history and can compare two", () => {
    const ex = makeExercise();
    const s1 = startEmptySession("א");
    const se1 = addExerciseToSession(s1.id, ex.id)!;
    const set1 = addSet(se1.id, false)!;
    completeSet(set1.id, { actual_reps: 5, actual_weight: 60 });
    finishSession(s1.id);

    const s2 = startEmptySession("ב");
    const se2 = addExerciseToSession(s2.id, ex.id)!;
    const set2 = addSet(se2.id, false)!;
    completeSet(set2.id, { actual_reps: 5, actual_weight: 70 });
    finishSession(s2.id);

    const history = listSessionHistory({}, "date_desc");
    expect(history.length).toBe(2);
    const cmp = compareSessions(s2.id, s1.id)!;
    expect(cmp.sharedExerciseIds).toContain(ex.id);
    const vol = cmp.metrics.find((m) => m.id === "volume")!;
    expect(vol.delta).toBeGreaterThan(0);
  });
});

describe("getExerciseHistorySummary", () => {
  it("aggregates last/top values after a session", () => {
    const ex = makeExercise();
    const s = startEmptySession("א");
    const se = addExerciseToSession(s.id, ex.id)!;
    const set = addSet(se.id, false)!;
    completeSet(set.id, { actual_reps: 5, actual_weight: 80 });
    finishSession(s.id);
    const sum = getExerciseHistorySummary(ex.id);
    expect(sum.timesPerformed).toBe(1);
    expect(sum.topWeightKg).toBe(80);
    expect(sum.topEstimated1RM?.value).toBeGreaterThan(80);
  });
});
