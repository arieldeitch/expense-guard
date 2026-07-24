/**
 * Templates repository — unit tests.
 * מכסה: יצירה, טיוטה, הוספת תרגילים, סופרסטים, שינוי סדר, מנוחות, ברירת מחדל,
 * שכפול, versioning, snapshot, ארכוב, שחזור.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  _resetTemplatesStateForTests,
  addExerciseToBlock,
  archiveTemplate,
  activateTemplate,
  buildTemplateSnapshot,
  createBlock,
  createSupersetFromExercises,
  createTemplate,
  DEFAULT_REPS,
  DEFAULT_SETS,
  duplicateTemplate,
  estimateTemplateDuration,
  listBlocks,
  listBlockExercises,
  listTemplates,
  listVersions,
  moveBlock,
  moveTemplateExercise,
  removeBlock,
  removeTemplateExercise,
  restoreTemplate,
  saveVersion,
  trashTemplate,
  updateTemplateExercise,
} from "@/lib/templates";
import { startSessionFromTemplate } from "@/lib/sessions";
import { _resetSessionsStateForTests } from "@/lib/sessions";

beforeEach(() => {
  _resetTemplatesStateForTests();
  _resetSessionsStateForTests();
});

function seedFullTemplate() {
  const t = createTemplate({ name: "Push A" });
  const b1 = createBlock(t.id, { block_type: "single" });
  const b2 = createBlock(t.id, { block_type: "superset" });
  const e1 = addExerciseToBlock(b1.id, { exercise_id: "ex-bench" });
  const e2 = addExerciseToBlock(b2.id, { exercise_id: "ex-press" });
  const e3 = addExerciseToBlock(b2.id, { exercise_id: "ex-fly" });
  return { t, b1, b2, e1, e2, e3 };
}

describe("templates: creation & defaults", () => {
  it("creates a template as draft with version=1", () => {
    const t = createTemplate({ name: "  My Push  " });
    expect(t.name).toBe("My Push");
    expect(t.status).toBe("draft");
    expect(t.version).toBe(1);
    expect(t.usage_count).toBe(0);
    expect(listTemplates()).toHaveLength(1);
  });

  it("added exercise uses 3×12 default", () => {
    const t = createTemplate({ name: "T" });
    const b = createBlock(t.id, { block_type: "single" });
    const ex = addExerciseToBlock(b.id, { exercise_id: "ex-1" });
    expect(ex.planned_sets).toBe(DEFAULT_SETS);
    expect(ex.planned_reps).toBe(DEFAULT_REPS);
  });

  it("override of default is preserved", () => {
    const t = createTemplate({ name: "T" });
    const b = createBlock(t.id, { block_type: "single" });
    const ex = addExerciseToBlock(b.id, {
      exercise_id: "ex-1",
      planned_sets: 5,
      planned_reps: 5,
    });
    expect(ex.planned_sets).toBe(5);
    expect(ex.planned_reps).toBe(5);
  });
});

describe("templates: blocks & ordering", () => {
  it("blocks receive sequential indexes", () => {
    const { t } = seedFullTemplate();
    const blocks = listBlocks(t.id);
    expect(blocks.map((b) => b.sequence)).toEqual([0, 1]);
  });

  it("moveBlock swaps sequences", () => {
    const { t, b1, b2 } = seedFullTemplate();
    moveBlock(b2.id, "up");
    const blocks = listBlocks(t.id);
    expect(blocks[0].id).toBe(b2.id);
    expect(blocks[1].id).toBe(b1.id);
  });

  it("removeBlock soft-deletes and cascades to exercises", () => {
    const { t, b2, e2, e3 } = seedFullTemplate();
    removeBlock(b2.id);
    expect(listBlocks(t.id).find((b) => b.id === b2.id)).toBeUndefined();
    expect(listBlockExercises(b2.id)).toHaveLength(0);
    // exercises are soft-deleted (deleted_at set), not listed
    void e2;
    void e3;
  });
});

describe("templates: supersets", () => {
  it("createSupersetFromExercises groups exercises into one block", () => {
    const t = createTemplate({ name: "T" });
    const b1 = createBlock(t.id, { block_type: "single" });
    const b2 = createBlock(t.id, { block_type: "single" });
    const e1 = addExerciseToBlock(b1.id, { exercise_id: "a" });
    const e2 = addExerciseToBlock(b2.id, { exercise_id: "b" });
    const superset = createSupersetFromExercises(t.id, [e1.id, e2.id]);
    expect(superset).not.toBeNull();
    expect(superset!.block_type).toBe("superset");
    const supers = listBlockExercises(superset!.id);
    expect(supers).toHaveLength(2);
    expect(supers.map((e) => e.sequence)).toEqual([0, 1]);
  });

  it("moving exercise up/down inside superset works", () => {
    const { b2, e2, e3 } = seedFullTemplate();
    moveTemplateExercise(e3.id, "up");
    const list = listBlockExercises(b2.id);
    expect(list[0].id).toBe(e3.id);
    expect(list[1].id).toBe(e2.id);
  });
});

describe("templates: duration estimation", () => {
  it("returns zero for empty template", () => {
    const t = createTemplate({ name: "T" });
    expect(estimateTemplateDuration(t.id).seconds).toBe(0);
  });

  it("returns positive estimate when exercises exist", () => {
    const { t } = seedFullTemplate();
    const dur = estimateTemplateDuration(t.id);
    expect(dur.seconds).toBeGreaterThan(0);
    expect(dur.maxMinutes).toBeGreaterThanOrEqual(dur.minMinutes);
  });
});

describe("templates: versioning & snapshot", () => {
  it("saveVersion bumps template.version and stores snapshot", () => {
    const { t } = seedFullTemplate();
    const v = saveVersion(t.id, "before edit");
    expect(v).not.toBeNull();
    expect(v!.version).toBe(1);
    expect(v!.snapshot.blocks).toHaveLength(2);
    expect(listVersions(t.id)).toHaveLength(1);
    // template version incremented
    const list = listTemplates();
    expect(list[0].version).toBe(2);
  });

  it("buildTemplateSnapshot returns full immutable structure", () => {
    const { t } = seedFullTemplate();
    const snap = buildTemplateSnapshot(t.id);
    expect(snap!.template.name).toBe("Push A");
    expect(snap!.blocks[0].exercises).toHaveLength(1);
  });
});

describe("templates: duplicate", () => {
  it("duplicate copies structure but resets usage", () => {
    const { t } = seedFullTemplate();
    const copy = duplicateTemplate(t.id);
    expect(copy).not.toBeNull();
    expect(copy!.name).toContain("(עותק)");
    expect(copy!.usage_count).toBe(0);
    expect(copy!.parent_template_id).toBe(t.id);
    expect(listBlocks(copy!.id)).toHaveLength(2);
  });
});

describe("templates: lifecycle (archive/trash/restore)", () => {
  it("archives and reactivates", () => {
    const t = createTemplate({ name: "T" });
    archiveTemplate(t.id);
    expect(listTemplates()).toHaveLength(0);
    activateTemplate(t.id);
    expect(listTemplates()).toHaveLength(1);
  });

  it("trash + restore keeps history intact", () => {
    const { t } = seedFullTemplate();
    trashTemplate(t.id);
    expect(listTemplates()).toHaveLength(0);
    restoreTemplate(t.id);
    expect(listBlocks(t.id)).toHaveLength(2);
  });
});

describe("templates: sessions", () => {
  it("startSessionFromTemplate captures snapshot and bumps usage", () => {
    const { t } = seedFullTemplate();
    activateTemplate(t.id);
    const session = startSessionFromTemplate(t.id);
    expect(session).not.toBeNull();
    expect(session!.template_snapshot!.blocks).toHaveLength(2);
    expect(session!.template_version).toBe(1);
    // template usage bumped
    const list = listTemplates();
    expect(list[0].usage_count).toBe(1);
  });

  it("later template edits do not mutate the session snapshot", () => {
    const { t, e1 } = seedFullTemplate();
    activateTemplate(t.id);
    const session = startSessionFromTemplate(t.id)!;
    updateTemplateExercise(e1.id, { planned_sets: 99 });
    // remove an exercise from live template
    removeTemplateExercise(e1.id);
    // snapshot unchanged
    expect(session.template_snapshot!.blocks[0].exercises[0].planned_sets).toBe(DEFAULT_SETS);
    expect(session.template_snapshot!.blocks[0].exercises).toHaveLength(1);
  });
});
