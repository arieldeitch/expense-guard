// @vitest-environment jsdom
import { expect, it } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";
import { listRuns } from "@/lib/runs/repo";
import { ensureWeek, saveSettings } from "@/lib/race-project/repo";
import { DEFAULT_SETTINGS } from "@/lib/race-project/model";
import { buildBackup, importBackup, validateBackup } from "@/lib/backup";
import { readRunsState, writeRunsState } from "@/lib/runs/storage";
import { listExercises } from "@/lib/exercises";
import { createHomeSession, addEntry, listEntrySets, startQuickEntry } from "@/lib/home";

it("saves a linked run with 37:20 immediately on completion", async () => {
  const week = ensureWeek("2026-09-20");
  await renderRoute(`/running/new/treadmill?plan=${week.days[1].id}`);
  const minuteInput = screen.getByLabelText("משך הריצה בדקות");
  fireEvent.change(minuteInput, { target: { value: "37" } });
  fireEvent.change(screen.getByLabelText("משך הריצה בשניות"), { target: { value: "20" } });
  fireEvent.change(screen.getByLabelText("מרחק בקילומטרים"), { target: { value: "6.25" } });
  fireEvent.change(screen.getByLabelText("מהירות ממוצעת בקמש"), { target: { value: "10,4" } });
  fireEvent.click(screen.getByRole("button", { name: /שמור.*סיים|שמירה.*סיום/ }));
  await waitFor(() => expect(listRuns()[0].status).toBe("completed"));
  expect(listRuns()[0].duration_seconds).toBe(2240);
  expect(listRuns()[0].distance_meters).toBe(6250);
  expect(listRuns()[0].average_speed_kmh).toBe(10.4);
  expect(listRuns()[0].training_plan_item_id).toBe(week.days[1].id);
});
it("backup restores the project, preferences and chosen week", () => {
  saveSettings({ ...DEFAULT_SETTINGS, weekly_minutes: 180, longest_minutes: 80 });
  ensureWeek("2026-09-20");
  const backup = buildBackup();
  expect(validateBackup(backup).ok).toBe(true);
  writeRunsState({ ...readRunsState(), trainingWeeks: [], coachSettings: [] });
  expect(importBackup(backup, "replace").ok).toBe(true);
  expect(readRunsState().trainingWeeks?.[0].id).toBe("2026-09-20");
  expect(readRunsState().coachSettings?.[0].weekly_minutes).toBe(180);
});
it("records three unequal sets in one home exercise", async () => {
  const ex = listExercises().find((e) => e.slug === "crunches")!;
  expect(ex).toBeTruthy();
  const s = createHomeSession({ name: "פק״ל בדיקה" });
  const entry = addEntry(s.id, ex.id);
  await renderRoute(`/home/sessions/${s.id}`);
  fireEvent.change(await screen.findByLabelText("חזרות לכל סט"), {
    target: { value: "15, 20, 17" },
  });
  fireEvent.click(screen.getByRole("button", { name: "הוסף סטים שבוצעו" }));
  expect(listEntrySets(entry.id).map((s) => s.reps)).toEqual([15, 20, 17]);
});

it("keeps the last edit when leaving through the back link immediately", async () => {
  await renderRoute("/running/new/treadmill");
  fireEvent.change(screen.getByLabelText("משך הריצה בדקות"), { target: { value: "37" } });
  fireEvent.change(screen.getByLabelText("משך הריצה בשניות"), { target: { value: "20" } });
  fireEvent.change(screen.getByLabelText("מרחק בקילומטרים"), { target: { value: "6,25" } });
  fireEvent.click(screen.getByRole("link", { name: "חזרה" }));
  await waitFor(() => expect(screen.queryByLabelText("משך הריצה בדקות")).toBeNull());
  expect(listRuns()[0].duration_seconds).toBe(2240);
  expect(listRuns()[0].distance_meters).toBe(6250);
  // Derived from duration + distance; never stored as a manual value.
  expect(listRuns()[0].average_pace_s_per_km).toBeCloseTo(358.4, 3);
  expect(listRuns()[0].provenance.average_pace_s_per_km).toBe("derived");
});
it("the home screen offers report and history in the main navigation", async () => {
  await renderRoute("/");
  const nav = screen.getAllByRole("navigation", { name: "ניווט ראשי" })[0];
  expect(nav).toHaveTextContent("דיווח");
  expect(nav).toHaveTextContent("היסטוריה");
  expect(nav).toHaveTextContent("תוכניות");
});
it("editing an existing run keeps derived pace live instead of freezing it as input", async () => {
  await renderRoute("/running/new/treadmill");
  fireEvent.change(screen.getByLabelText("משך הריצה בדקות"), { target: { value: "37" } });
  fireEvent.change(screen.getByLabelText("משך הריצה בשניות"), { target: { value: "20" } });
  fireEvent.change(screen.getByLabelText("מרחק בקילומטרים"), { target: { value: "6.25" } });
  fireEvent.click(screen.getByRole("button", { name: /שמור.*סיים|שמירה.*סיום/ }));
  await waitFor(() => expect(listRuns()[0].status).toBe("completed"));
  const id = listRuns()[0].id;
  await renderRoute(`/running/${id}/edit`);
  // The derived pace is a hint, not a value the user typed.
  expect(screen.getByLabelText("קצב לק״מ בדקות")).toHaveValue(null);
  expect(screen.getByText(/קצב מחושב: 5:58/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("משך הריצה בדקות"), { target: { value: "40" } });
  expect(screen.getByText(/קצב מחושב: 6:27/)).toBeInTheDocument();
  await waitFor(() => expect(listRuns()[0].average_pace_s_per_km).toBeCloseTo(387.2, 3));
  expect(listRuns()[0].provenance.average_pace_s_per_km).toBe("derived");
});
it("bulk sets fill the empty starter set instead of leaving it behind", async () => {
  const ex = listExercises().find((e) => e.slug === "push-ups")!;
  const { session, entry } = startQuickEntry({ exercise_id: ex.id });
  expect(listEntrySets(entry.id)).toHaveLength(1);
  await renderRoute(`/home/sessions/${session.id}`);
  fireEvent.change(await screen.findByLabelText("חזרות לכל סט"), {
    target: { value: "19, 48, 32" },
  });
  fireEvent.click(screen.getByRole("button", { name: "הוסף סטים שבוצעו" }));
  const sets = listEntrySets(entry.id);
  expect(sets.map((s) => s.reps)).toEqual([19, 48, 32]);
  expect(sets.every((s) => s.completed)).toBe(true);
});
it("quick report lists the curated home groups with push-up and crunch variants", async () => {
  await renderRoute("/home/quick");
  // The interactive tile nests a second button role, so count matches rather than expecting one.
  const pick = (name: string) => screen.queryAllByRole("button", { name }).length;
  await screen.findByRole("heading", { name: "חזה ודחיפה" });
  expect(pick("שכיבות סמיכה יהלום")).toBeGreaterThan(0);
  expect(pick("כפיפות בטן הפוכות")).toBeGreaterThan(0);
  expect(pick("קפיצה בחבל")).toBeGreaterThan(0);
  expect(pick("לחיצת חזה במוט")).toBe(0);
});
it("opens the dedicated project with a weekly recommendation", async () => {
  saveSettings({ ...DEFAULT_SETTINGS, weekly_minutes: 180, longest_minutes: 80 });
  await renderRoute("/running/project");
  expect(await screen.findByRole("heading", { name: "התוכנית השבועית" })).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: "דווח ביצוע" })).toHaveLength(7);
});
