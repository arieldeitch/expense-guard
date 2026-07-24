import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  _resetHomeStateForTests,
} from "../storage";
import {
  addEntry,
  addSet,
  addHomeTemplateEntry,
  completeHomeSession,
  createHomeSession,
  createHomeTemplate,
  duplicateSet,
  duplicateHomeTemplate,
  listEntrySets,
  listHomeSessions,
  listHomeTemplateEntries,
  listSessionEntries,
  markSetCompleted,
  markSetSkipped,
  reorderEntries,
  restoreHomeSession,
  startQuickEntry,
  startSessionFromTemplate,
  substituteEntryExercise,
  trashHomeSession,
  trashSet,
  updateSet,
} from "../repo";
import {
  dataCompleteness,
  homeQualityScore,
  medianOf,
  meanOf,
  stabilityFromReps,
  summarizeSets,
  sumReps,
} from "../metrics";
import { detectRecords, previousPerformance, summarizeExerciseHistory } from "../records";
import { _resetExercisesStateForTests } from "@/lib/exercises";
import { getExerciseBySlug, listExercises } from "@/lib/exercises";

// שים לב: seed.ts רץ ב־hydrate ראשוני של state המקורי. reset מנקה לכתובת קייס נקייה,
// אבל exercises נטענים דרך seed. אנחנו נשען על תרגילי seed קיימים כמו "שכיבות סמיכה".
function firstBodyweightExerciseId(): string {
  const list = listExercises().filter((e) => e.bodyweight_based);
  if (!list.length) throw new Error("no bodyweight exercises available in seed");
  return list[0].id;
}

describe("home metrics", () => {
  it("mean/median", () => {
    expect(meanOf([2, 4, 6])).toBe(4);
    expect(medianOf([1, 2, 3])).toBe(2);
    expect(medianOf([1, 2, 3, 4])).toBe(2.5);
    expect(medianOf([])).toBeNull();
  });

  it("stability increases as spread shrinks", () => {
    const stable = stabilityFromReps([10, 10, 10, 10])!;
    const spread = stabilityFromReps([15, 12, 8, 5])!;
    expect(stable).toBeGreaterThan(spread);
    expect(stable).toBeCloseTo(1, 5);
  });

  it("stability null under 2 points", () => {
    expect(stabilityFromReps([])).toBeNull();
    expect(stabilityFromReps([5])).toBeNull();
  });

  it("summarizeSets computes counts and ratios", () => {
    const now = new Date().toISOString();
    const mk = (n: number, reps: number, completed = true) => ({
      id: `s${n}`,
      entry_id: "e",
      set_number: n,
      tracking_type: "reps_only" as const,
      reps,
      duration_seconds: null,
      side: null,
      added_weight: null,
      weight_unit: "kg" as const,
      assistance_value: null,
      round_number: null,
      rpe: null,
      rir: null,
      set_type: "regular" as const,
      notes: null,
      completed,
      skipped: false,
      completed_at: completed ? now : null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
    const s = summarizeSets([mk(1, 20), mk(2, 15), mk(3, 10)]);
    expect(s.totalReps).toBe(45);
    expect(s.averageReps).toBe(15);
    expect(s.medianReps).toBe(15);
    expect(s.maxReps).toBe(20);
    expect(s.firstSetReps).toBe(20);
    expect(s.lastSetReps).toBe(10);
    expect(s.lastToFirstRatio).toBe(0.5);
  });
});

describe("home repo", () => {
  beforeEach(() => {
    _resetHomeStateForTests();
  });

  it("quick entry creates session + entry + set", () => {
    const exId = firstBodyweightExerciseId();
    const { session, entry, set } = startQuickEntry({ exercise_id: exId });
    expect(session.is_quick_entry).toBe(true);
    expect(session.primary_exercise_id).toBe(exId);
    expect(entry.home_session_id).toBe(session.id);
    expect(set.entry_id).toBe(entry.id);
    expect(set.set_number).toBe(1);
    expect(listHomeSessions()).toHaveLength(1);
    expect(listSessionEntries(session.id)).toHaveLength(1);
    expect(listEntrySets(entry.id)).toHaveLength(1);
  });

  it("supports multiple different rep counts per set", () => {
    const exId = firstBodyweightExerciseId();
    const { entry, set } = startQuickEntry({ exercise_id: exId });
    updateSet(set.id, { reps: 18 });
    const s2 = addSet(entry.id);
    updateSet(s2.id, { reps: 14 });
    const s3 = addSet(entry.id);
    updateSet(s3.id, { reps: 9 });
    const s4 = addSet(entry.id);
    updateSet(s4.id, { reps: 6 });
    [set.id, s2.id, s3.id, s4.id].forEach((id) => markSetCompleted(id, true));
    const sets = listEntrySets(entry.id);
    expect(sets.map((s) => s.reps)).toEqual([18, 14, 9, 6]);
    expect(sumReps(sets)).toBe(47);
  });

  it("duplicates and deletes sets with soft delete", () => {
    const { entry, set } = startQuickEntry({ exercise_id: firstBodyweightExerciseId() });
    updateSet(set.id, { reps: 10 });
    const dup = duplicateSet(set.id);
    expect(dup?.reps).toBe(10);
    expect(listEntrySets(entry.id)).toHaveLength(2);
    trashSet(set.id);
    expect(listEntrySets(entry.id)).toHaveLength(1);
  });

  it("markSetSkipped excludes set from rep totals", () => {
    const { entry, set } = startQuickEntry({ exercise_id: firstBodyweightExerciseId() });
    updateSet(set.id, { reps: 12 });
    markSetCompleted(set.id, true);
    const s2 = addSet(entry.id);
    updateSet(s2.id, { reps: 99 });
    markSetSkipped(s2.id, true);
    expect(sumReps(listEntrySets(entry.id))).toBe(12);
  });

  it("substituteEntryExercise updates snapshot", () => {
    const bws = listExercises().filter((e) => e.bodyweight_based);
    expect(bws.length).toBeGreaterThanOrEqual(2);
    const [a, b] = bws;
    const { entry } = startQuickEntry({ exercise_id: a.id });
    substituteEntryExercise(entry.id, b.id);
    const updated = listSessionEntries(entry.home_session_id)[0];
    expect(updated.exercise_id).toBe(b.id);
    expect(updated.snapshot.exercise_id).toBe(b.id);
  });

  it("trash/restore session", () => {
    const s = createHomeSession({ name: "x" });
    trashHomeSession(s.id);
    expect(listHomeSessions().find((x) => x.id === s.id)).toBeUndefined();
    restoreHomeSession(s.id);
    expect(listHomeSessions().find((x) => x.id === s.id)).toBeDefined();
  });

  it("completeHomeSession computes duration", async () => {
    const s = createHomeSession({ name: "x" });
    await new Promise((r) => setTimeout(r, 5));
    const done = completeHomeSession(s.id);
    expect(done?.status).toBe("completed");
    expect(done?.duration_seconds).toBeGreaterThanOrEqual(0);
    expect(done?.ended_at).not.toBeNull();
  });

  it("templates: create/duplicate/entries", () => {
    const t = createHomeTemplate({ name: "פוש בבית" });
    const exId = firstBodyweightExerciseId();
    addHomeTemplateEntry(t.id, exId, { planned_sets: 4, planned_reps: 15 });
    expect(listHomeTemplateEntries(t.id)).toHaveLength(1);
    const dup = duplicateHomeTemplate(t.id);
    expect(dup?.name).toContain("עותק");
    expect(listHomeTemplateEntries(dup!.id)).toHaveLength(1);
    expect(dup!.parent_template_id).toBe(t.id);
  });

  it("startSessionFromTemplate builds entries + sets from snapshot", () => {
    const t = createHomeTemplate({ name: "מלא" });
    const bws = listExercises().filter((e) => e.bodyweight_based).slice(0, 2);
    addHomeTemplateEntry(t.id, bws[0].id, { planned_sets: 3, planned_reps: 12 });
    addHomeTemplateEntry(t.id, bws[1].id, { planned_sets: 2, planned_reps: 10 });
    const session = startSessionFromTemplate(t.id)!;
    expect(session.template_id).toBe(t.id);
    expect(session.template_snapshot?.entries).toHaveLength(2);
    const entries = listSessionEntries(session.id);
    expect(entries).toHaveLength(2);
    expect(listEntrySets(entries[0].id)).toHaveLength(3);
    expect(listEntrySets(entries[1].id)).toHaveLength(2);
  });
});

describe("home records", () => {
  beforeEach(() => {
    _resetHomeStateForTests();
  });

  it("first session is baseline, not a record", () => {
    const exId = firstBodyweightExerciseId();
    const { entry, set, session } = startQuickEntry({ exercise_id: exId });
    updateSet(set.id, { reps: 20 });
    markSetCompleted(set.id, true);
    completeHomeSession(session.id);
    const recs = detectRecords(exId, session.id);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.isBaseline)).toBe(true);
  });

  it("subsequent higher performance beats baseline", () => {
    const exId = firstBodyweightExerciseId();
    // session 1: 20 reps
    const s1 = startQuickEntry({ exercise_id: exId });
    updateSet(s1.set.id, { reps: 20 });
    markSetCompleted(s1.set.id, true);
    completeHomeSession(s1.session.id);
    // session 2: 25 reps
    const s2 = startQuickEntry({ exercise_id: exId });
    updateSet(s2.set.id, { reps: 25 });
    markSetCompleted(s2.set.id, true);
    completeHomeSession(s2.session.id);
    const recs = detectRecords(exId, s2.session.id);
    const nonBaseline = recs.filter((r) => !r.isBaseline);
    expect(nonBaseline.some((r) => r.kind === "top_reps_in_set" && r.value === 25)).toBe(true);
  });

  it("previousPerformance returns last completed session", () => {
    const exId = firstBodyweightExerciseId();
    const s1 = startQuickEntry({ exercise_id: exId });
    updateSet(s1.set.id, { reps: 10 });
    markSetCompleted(s1.set.id, true);
    completeHomeSession(s1.session.id);
    const s2 = startQuickEntry({ exercise_id: exId });
    updateSet(s2.set.id, { reps: 12 });
    markSetCompleted(s2.set.id, true);
    const prev = previousPerformance(exId, s2.session.id);
    expect(prev?.sessionId).toBe(s1.session.id);
    expect(prev?.totalReps).toBe(10);
  });

  it("summarizeExerciseHistory reports insufficient data early", () => {
    const exId = firstBodyweightExerciseId();
    const s1 = startQuickEntry({ exercise_id: exId });
    updateSet(s1.set.id, { reps: 10 });
    markSetCompleted(s1.set.id, true);
    completeHomeSession(s1.session.id);
    const h = summarizeExerciseHistory(exId);
    expect(h.timesPerformed).toBe(1);
    expect(h.trend).toBe("insufficient_data");
    expect(h.topRepsInSet).toBe(10);
  });
});

describe("home quality score", () => {
  it("returns 0 when no data", () => {
    const q = homeQualityScore({ sets: [] });
    expect(q.score).toBe(0);
  });

  it("scales with completion + stability", () => {
    const now = new Date().toISOString();
    const set = (n: number, reps: number) => ({
      id: `s${n}`,
      entry_id: "e",
      set_number: n,
      tracking_type: "reps_only" as const,
      reps,
      duration_seconds: null,
      side: null,
      added_weight: null,
      weight_unit: "kg" as const,
      assistance_value: null,
      round_number: null,
      rpe: null,
      rir: null,
      set_type: "regular" as const,
      notes: null,
      completed: true,
      skipped: false,
      completed_at: now,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
    const stable = homeQualityScore({ sets: [set(1, 12), set(2, 12), set(3, 12)] });
    const varied = homeQualityScore({ sets: [set(1, 20), set(2, 5)] });
    expect(stable.score).toBeGreaterThan(varied.score);
  });

  it("dataCompleteness counts sets with reps/time", () => {
    const now = new Date().toISOString();
    const base = {
      entry_id: "e",
      tracking_type: "reps_only" as const,
      duration_seconds: null,
      side: null,
      added_weight: null,
      weight_unit: "kg" as const,
      assistance_value: null,
      round_number: null,
      rpe: null,
      rir: null,
      set_type: "regular" as const,
      notes: null,
      completed: true,
      skipped: false,
      completed_at: now,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    expect(
      dataCompleteness([
        { ...base, id: "1", set_number: 1, reps: 10 },
        { ...base, id: "2", set_number: 2, reps: null },
      ]),
    ).toBe(50);
  });
});
