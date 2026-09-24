/**
 * ADR-0045 — the two fixed routines, from Ariel's feedback:
 * quantity not time, editable reports, and a session title that is never an exercise name.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  PAKAL_DEFINITIONS,
  addEntry,
  addSet,
  completeHomeSession,
  ensurePakalTemplate,
  ensurePakalTemplates,
  findOpenPakalSession,
  isPakalSession,
  listEntrySets,
  listHomeSessions,
  listHomeTemplateEntries,
  listHomeTemplates,
  listSessionEntries,
  openPakalSession,
  pakalLines,
  pakalSlotOf,
  pakalTotal,
  setPakalQuantity,
  startQuickEntry,
  trashEntry,
  updateHomeTemplate,
} from "@/lib/home";
import { _resetHomeStateForTests } from "@/lib/home/storage";
import { listExercises } from "@/lib/exercises";

const slugId = (slug: string) => listExercises().find((e) => e.slug === slug)!.id;

describe("פק״לים — fixed morning/evening routines", () => {
  beforeEach(() => _resetHomeStateForTests());

  it("seeds both routines once, no matter how often the home screen renders", () => {
    ensurePakalTemplates();
    ensurePakalTemplates();
    ensurePakalTemplate("morning");
    const templates = listHomeTemplates();
    expect(templates.filter((t) => t.name === "פק״לים בוקר")).toHaveLength(1);
    expect(templates.filter((t) => t.name === "פק״לים ערב")).toHaveLength(1);
    expect(templates.map((t) => t.id)).toContain(PAKAL_DEFINITIONS.morning.templateId);
    expect(listHomeTemplateEntries(PAKAL_DEFINITIONS.morning.templateId).length).toBeGreaterThan(0);
  });

  it("never overwrites a renamed or re-planned routine", () => {
    const template = ensurePakalTemplate("morning");
    updateHomeTemplate(template.id, { name: "פק״ל של אריאל" });
    const entries = listHomeTemplateEntries(template.id);
    expect(ensurePakalTemplate("morning").name).toBe("פק״ל של אריאל");
    expect(listHomeTemplateEntries(template.id)).toHaveLength(entries.length);
  });

  it("opens one report per day and resumes it instead of creating a second", () => {
    const first = openPakalSession("morning");
    const second = openPakalSession("morning");
    expect(second.id).toBe(first.id);
    expect(listHomeSessions().filter((s) => s.template_id === first.template_id)).toHaveLength(1);
    expect(findOpenPakalSession("morning")?.id).toBe(first.id);
    // The evening routine is a separate report.
    expect(openPakalSession("evening").id).not.toBe(first.id);
  });

  it("names the report after the routine, never after an exercise", () => {
    const session = openPakalSession("morning");
    expect(session.name).toBe("פק״לים בוקר");
    const exerciseNames = listSessionEntries(session.id).map((e) => e.snapshot.exercise_name);
    expect(exerciseNames.length).toBeGreaterThan(0);
    expect(exerciseNames).not.toContain(session.name);
    expect(isPakalSession(session)).toBe(true);
    expect(pakalSlotOf(session)).toBe("morning");
  });

  it("quick entry no longer inherits the exercise name either", () => {
    const { session } = startQuickEntry({ exercise_id: slugId("push-ups") });
    expect(session.name).toBe("דיווח מהיר");
    expect(session.name).not.toBe("שכיבות סמיכה");
  });

  it("is quantity-first: one set per exercise, reps only, no timer", () => {
    const session = openPakalSession("morning");
    const lines = pakalLines(session.id);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      const sets = listEntrySets(line.entryId);
      expect(sets).toHaveLength(1);
      expect(sets[0].duration_seconds).toBeNull();
      expect(sets[0].reps).toBeNull();
    }
    setPakalQuantity(lines[0], 30);
    expect(listEntrySets(lines[0].entryId)[0].reps).toBe(30);
    expect(listEntrySets(lines[0].entryId)[0].duration_seconds).toBeNull();
    expect(listEntrySets(lines[0].entryId)[0].completed).toBe(true);
  });

  it("edits a saved report in place — same record, no duplicate", () => {
    const session = openPakalSession("morning");
    const lines = pakalLines(session.id);
    setPakalQuantity(lines[0], 20);
    setPakalQuantity(lines[1], 15);
    completeHomeSession(session.id);
    const afterSave = listHomeSessions().length;
    const startedAt = session.started_at;

    // Ariel notices the first number was wrong and fixes it.
    const reopened = openPakalSession("morning");
    expect(reopened.id).toBe(session.id);
    setPakalQuantity(pakalLines(session.id)[0], 25);

    expect(listHomeSessions()).toHaveLength(afterSave);
    expect(pakalLines(session.id)[0].quantity).toBe(25);
    expect(pakalLines(session.id)[1].quantity).toBe(15);
    expect(listHomeSessions().find((s) => s.id === session.id)!.started_at).toBe(startedAt);
    expect(pakalTotal(session.id)).toBe(40);
  });

  it("adds and removes an exercise inside an existing report", () => {
    const session = openPakalSession("evening");
    const before = pakalLines(session.id).length;

    const entry = addEntry(session.id, slugId("jump-rope"));
    addSet(entry.id, { reps: null, duration_seconds: null });
    expect(pakalLines(session.id)).toHaveLength(before + 1);

    trashEntry(pakalLines(session.id)[0].entryId);
    expect(pakalLines(session.id)).toHaveLength(before);
  });

  it("counts the total repetitions of the routine", () => {
    const session = openPakalSession("morning");
    for (const line of pakalLines(session.id)) setPakalQuantity(line, 10);
    expect(pakalTotal(session.id)).toBe(10 * pakalLines(session.id).length);
  });
});
