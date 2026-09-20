import { describe, expect, it, beforeEach } from "vitest";
import { createWeek, DEFAULT_SETTINGS, INITIAL_RACES, dayKey, weekStart } from "./model";
import { ensureWeek, saveSettings, updateWeek, regenerateWeek } from "./repo";
import { __resetRunsStateForTests, readRunsState } from "@/lib/runs/storage";
const settings = { ...DEFAULT_SETTINGS, weekly_minutes: 180, longest_minutes: 80 };
describe("weekly running project", () => {
  beforeEach(() => __resetRunsStateForTests());
  it("uses Jerusalem midnight and Sunday to Saturday even across DST", () => {
    expect(dayKey("2026-09-19T22:00:00Z")).toBe("2026-09-20");
    expect(weekStart("2026-10-31")).toBe("2026-10-25");
    const w = createWeek("2026-10-25", settings, [], []);
    expect(w.days.map((d) => d.date)).toEqual([
      "2026-10-25",
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
    ]);
  });
  it("requires baseline and does not invent race dates", () => {
    const w = createWeek("2026-09-20", DEFAULT_SETTINGS, INITIAL_RACES, []);
    expect(w.days.every((d) => d.recommended.minutes === null)).toBe(true);
    expect(w.days.some((d) => d.recommended.kind === "race")).toBe(false);
  });
  it("keeps prescribed volume within baseline and separates the chosen plan", () => {
    const w = createWeek("2026-09-20", settings, [], []);
    expect(w.days.reduce((s, d) => s + (d.recommended.minutes ?? 0), 0)).toBeLessThanOrEqual(180);
    expect(w.days[6].recommended.kind).toBe("long");
    w.days[6].chosen.minutes = 55;
    expect(w.days[6].recommended.minutes).toBe(80);
  });
  it("reduces load near a dated race and rests after it", () => {
    const w = createWeek("2026-09-20", settings, [{ ...INITIAL_RACES[1], date: "2026-09-24" }], []);
    expect(w.days[4].recommended.kind).toBe("race");
    expect(w.days[5].recommended.kind).toBe("rest");
    expect(w.days.some((d) => d.recommended.kind === "intervals")).toBe(false);
  });
  it("does not recommend running with pain", () => {
    const w = createWeek(
      "2026-09-20",
      { ...settings, recovery: "pain" },
      [{ ...INITIAL_RACES[1], date: "2026-09-24" }],
      [],
    );
    expect(w.days.every((d) => d.recommended.kind === "rest")).toBe(true);
  });
  it("opening a week preserves edits; explicit regeneration retains the previous version", () => {
    saveSettings(settings);
    const w = ensureWeek("2026-09-20");
    updateWeek({
      ...w,
      status: "accepted",
      days: w.days.map((d, i) => (i === 6 ? { ...d, chosen: { ...d.chosen, minutes: 55 } } : d)),
    });
    expect(ensureWeek(w.id).days[6].chosen.minutes).toBe(55);
    regenerateWeek(w.id);
    const next = readRunsState().trainingWeeks![0];
    expect(next.revisions.at(-1)?.days[6].chosen.minutes).toBe(55);
    expect(next.days[6].recommended.minutes).toBe(80);
  });
});
