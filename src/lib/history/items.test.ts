import { describe, expect, it, beforeEach } from "vitest";
import {
  buildHistoryItems,
  filterHistory,
  formatDayLabel,
  formatMonthLabel,
  groupByWeek,
  historyHref,
  shiftMonth,
} from "./items";
import { __resetRunsStateForTests } from "@/lib/runs/storage";
import { createRun } from "@/lib/runs/repo";
import {
  createHomeSession,
  addEntry,
  addSet,
  completeHomeSession,
  updateHomeSession,
} from "@/lib/home";
import { listExercises } from "@/lib/exercises";
import type { RunSessionInput } from "@/lib/runs/types";

function runInput(overrides: Partial<RunSessionInput> = {}): RunSessionInput {
  return {
    run_type: "treadmill",
    status: "completed",
    started_at: "2026-09-20T18:00:00.000Z",
    ended_at: null,
    timezone: "Asia/Jerusalem",
    duration_seconds: 2240,
    distance_meters: 6250,
    average_speed_kmh: null,
    max_speed_kmh: null,
    average_pace_s_per_km: null,
    average_incline_pct: null,
    max_incline_pct: null,
    calories: null,
    average_heart_rate: null,
    max_heart_rate: null,
    average_cadence_spm: null,
    elevation_gain_m: null,
    elevation_loss_m: null,
    location_id: null,
    treadmill_id: null,
    route_id: null,
    country_code: null,
    city_or_area: null,
    free_text_location: null,
    perceived_effort: null,
    notes: null,
    segments: [],
    provenance: {},
    outlier_overrides: [],
    data_completeness: 0,
    primary_source: "manual",
    ...overrides,
  };
}

describe("unified history rows", () => {
  beforeEach(() => __resetRunsStateForTests());

  it("turns a run into a compact row with the key metric and a day-first label", () => {
    const run = createRun(runInput({ training_plan_item_id: "2026-09-20-1" }));
    const [row] = buildHistoryItems({ runs: [run], home: [], gym: [] });
    expect(row.title).toBe("ריצה על הליכון");
    expect(row.metric).toBe("6.25 ק״מ · 37:20");
    expect(row.sub).toBe("מהתוכנית השבועית");
    expect(row.status).toBe("completed");
    expect(formatDayLabel(row.day)).toBe("א׳ 20.9");
    expect(historyHref(row)).toBe(`/running/${run.id}`);
  });

  it("counts completed home sets and reps, and keeps the partner as context only", () => {
    const ex = listExercises().find((e) => e.slug === "push-ups")!;
    const s = createHomeSession({ name: "פק״ל" });
    updateHomeSession(s.id, { training_partner: "תום" });
    const entry = addEntry(s.id, ex.id);
    for (const reps of [19, 48, 32]) addSet(entry.id, { reps, completed: true });
    completeHomeSession(s.id);
    const items = buildHistoryItems({
      runs: [],
      home: [{ ...s, status: "completed", training_partner: "תום" }],
      gym: [],
    });
    expect(items[0].metric).toBe("1 תרגילים · 3 סטים · 99 חזרות");
    // The exercise is CONTEXT on the row; it must never become the session's title (ADR-0045).
    expect(items[0].title).toBe("פק״ל");
    expect(items[0].sub).toBe("שכיבות סמיכה · יחד עם תום");
    expect(items[0].searchText).toContain("תום");
  });

  it("filters by type, month and free text; drafts are kept but flagged", () => {
    const done = createRun(runInput());
    const draft = createRun(runInput({ status: "draft", started_at: "2026-08-03T06:00:00.000Z" }));
    const items = buildHistoryItems({ runs: [done, draft], home: [], gym: [] });
    expect(items.map((i) => i.status)).toEqual(["completed", "draft"]);
    expect(filterHistory(items, { domain: "run", query: "", month: "2026-09" })).toHaveLength(1);
    expect(filterHistory(items, { domain: "home", query: "", month: null })).toHaveLength(0);
    expect(filterHistory(items, { domain: "all", query: "הליכון", month: null })).toHaveLength(2);
    expect(historyHref(items[1])).toBe(`/running/${draft.id}/edit`);
  });

  it("groups by Sunday–Saturday week with a short summary that ignores drafts", () => {
    const a = createRun(runInput({ started_at: "2026-09-20T06:00:00.000Z" }));
    const b = createRun(
      runInput({
        started_at: "2026-09-22T06:00:00.000Z",
        distance_meters: 5000,
        duration_seconds: 1800,
      }),
    );
    const d = createRun(runInput({ status: "draft", started_at: "2026-09-23T06:00:00.000Z" }));
    const prev = createRun(runInput({ started_at: "2026-09-17T06:00:00.000Z" }));
    const groups = groupByWeek(
      buildHistoryItems({ runs: [a, b, d, prev], home: [], gym: [] }),
      "2026-09-21",
    );
    expect(groups.map((g) => g.label)).toEqual(["השבוע", "שבוע שעבר"]);
    expect(groups[0].items).toHaveLength(3);
    expect(groups[0].summary).toBe("2 אימונים · 1:07:20 · 11.3 ק״מ");
    expect(groups[1].summary).toBe("1 אימונים · 37:20 · 6.3 ק״מ");
  });

  it("steps months in Hebrew", () => {
    expect(formatMonthLabel("2026-09")).toBe("ספטמבר 2026");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});
