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
import { createHomeSession, addEntry, listEntrySets } from "@/lib/home";

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

it("keeps the last edit when leaving for unified history immediately", async () => {
  await renderRoute("/running/new/treadmill");
  fireEvent.change(screen.getByLabelText("משך הריצה בדקות"), { target: { value: "37" } });
  fireEvent.change(screen.getByLabelText("משך הריצה בשניות"), { target: { value: "20" } });
  fireEvent.click(screen.getByRole("link", { name: "כל ההיסטוריה" }));
  await screen.findByRole("heading", { name: "כל האימונים במקום אחד" });
  expect(listRuns()[0].duration_seconds).toBe(2240);
});
it("opens the dedicated project with a weekly recommendation", async () => {
  saveSettings({ ...DEFAULT_SETTINGS, weekly_minutes: 180, longest_minutes: 80 });
  await renderRoute("/running/project");
  expect(await screen.findByRole("heading", { name: "התוכנית השבועית" })).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: "דווח ביצוע" })).toHaveLength(7);
});
