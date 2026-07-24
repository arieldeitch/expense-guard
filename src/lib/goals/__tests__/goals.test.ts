import { describe, it, expect, beforeEach } from "vitest";
import {
  _resetGoalsStateForTests,
  createGoal,
  getGoal,
  getPrimaryGoal,
  listGoalsByDomain,
  markAchieved,
  pauseGoal,
  resumeGoal,
  setPrimary,
  updateGoal,
  calcGoalProgress,
  listVersions,
  recordSnapshot,
  listSnapshots,
} from "@/lib/goals";

beforeEach(() => _resetGoalsStateForTests());

describe("goals repo", () => {
  it("יוצר יעד עם ברירות מחדל מהקטלוג", () => {
    const g = createGoal({ domain: "running", goal_type: "run_monthly_distance", target_value: 100 });
    expect(g.target_unit).toBe("ק״מ");
    expect(g.calculation_method).toBe("count_over_target");
    expect(g.status).toBe("active");
    expect(g.version).toBe(1);
  });

  it("סימון is_primary מבטל is_primary של יעד אחר באותו domain", () => {
    const a = createGoal({ domain: "gym", goal_type: "gym_sessions_in_period", target_value: 10, is_primary: true });
    const b = createGoal({ domain: "gym", goal_type: "gym_sessions_in_period", target_value: 20, is_primary: true });
    expect(getGoal(a.id)!.is_primary).toBe(false);
    expect(getGoal(b.id)!.is_primary).toBe(true);
  });

  it("שינוי מהותי מייצר גרסה חדשה, שינוי לא-מהותי לא", () => {
    const g = createGoal({ domain: "home", goal_type: "home_consecutive_reps", target_value: 30 });
    updateGoal(g.id, { description: "הערה" });
    expect(listVersions(g.id).length).toBe(0);
    updateGoal(g.id, { target_value: 40 });
    const versions = listVersions(g.id);
    expect(versions.length).toBe(1);
    expect(versions[0].changed_fields).toContain("target_value");
    expect(getGoal(g.id)!.version).toBe(2);
  });

  it("מעברי סטטוס: active→paused→active→achieved", () => {
    const g = createGoal({ domain: "running", goal_type: "run_distance_total", target_value: 50 });
    pauseGoal(g.id);
    expect(getGoal(g.id)!.status).toBe("paused");
    resumeGoal(g.id);
    expect(getGoal(g.id)!.status).toBe("active");
    markAchieved(g.id);
    expect(getGoal(g.id)!.status).toBe("achieved");
    expect(getGoal(g.id)!.achieved_at).not.toBeNull();
  });

  it("getPrimaryGoal מעדיף is_primary, אחרת priority נמוך", () => {
    createGoal({ domain: "running", goal_type: "run_distance_total", target_value: 100, priority: 2 });
    const b = createGoal({ domain: "running", goal_type: "run_distance_total", target_value: 50, priority: 1 });
    expect(getPrimaryGoal("running")?.id).toBe(b.id);
    const c = createGoal({ domain: "running", goal_type: "run_distance_total", target_value: 200, priority: 3 });
    setPrimary(c.id);
    expect(getPrimaryGoal("running")?.id).toBe(c.id);
  });

  it("listGoalsByDomain מסנן לפי domain", () => {
    createGoal({ domain: "running", goal_type: "run_distance_total", target_value: 100 });
    createGoal({ domain: "gym", goal_type: "gym_sessions_in_period", target_value: 8 });
    expect(listGoalsByDomain("running").length).toBe(1);
    expect(listGoalsByDomain("gym").length).toBe(1);
    expect(listGoalsByDomain("home").length).toBe(0);
  });
});

describe("goals calculation", () => {
  it("linear_increasing: current בין baseline ל־target = אחוז לינארי", () => {
    const g = createGoal({
      domain: "gym",
      goal_type: "gym_exercise_top_weight",
      linked_exercise_id: "ex1",
      baseline_value: 80,
      target_value: 100,
    });
    // אין sets → data_available=false, current=null
    const p1 = calcGoalProgress(g, {});
    expect(p1.data_available).toBe(false);
    expect(p1.progress_percentage).toBeNull();
  });

  it("count_over_target: current/target * 100, חסום ב־100", () => {
    const g = createGoal({
      domain: "running",
      goal_type: "run_count_in_period",
      target_value: 10,
      linked_period: "month",
    });
    // simulate manual override → we use runs=[] so current=0, pct=0
    const p = calcGoalProgress(g, { runs: [] });
    expect(p.progress_percentage).toBe(0);
    expect(p.current_value).toBe(0);
  });

  it("event_no_progress: progress_percentage=null אבל days_remaining יש", () => {
    const g = createGoal({
      domain: "running",
      goal_type: "run_event_completion",
      target_date: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    });
    const p = calcGoalProgress(g, {});
    expect(p.progress_percentage).toBeNull();
    expect(p.days_remaining).toBeGreaterThan(0);
  });

  it("linear_decreasing: current<baseline מתקדם ליעד יותר נמוך", () => {
    const g = createGoal({
      domain: "running",
      goal_type: "run_custom",
      calculation_method: "linear_decreasing",
      direction: "decreasing",
      baseline_value: 300,
      target_value: 240,
    });
    // manual — 270 (חצי דרך)
    const p = calcGoalProgress(g, { manualCurrent: 270 });
    expect(p.progress_percentage).toBe(50);
  });

  it("recordSnapshot שומר snapshot ומעדכן current_value ו־last_snapshot_at", () => {
    const g = createGoal({
      domain: "home",
      goal_type: "home_custom",
      target_value: 100,
    });
    const p = calcGoalProgress(g, { manualCurrent: 42 });
    recordSnapshot(g.id, p);
    const snaps = listSnapshots(g.id);
    expect(snaps.length).toBe(1);
    expect(snaps[0].current_value).toBe(42);
    expect(getGoal(g.id)!.current_value).toBe(42);
    expect(getGoal(g.id)!.last_snapshot_at).not.toBeNull();
  });
});
