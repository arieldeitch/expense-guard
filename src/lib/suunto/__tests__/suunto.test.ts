import { describe, it, expect, beforeEach } from "vitest";
import {
  compareSnapshots,
  treadmillSnapshotFromRun,
  proposeCalibration,
  labelFromSample,
  assessOutliers,
  suuntoRepo,
} from "../index";
import { __resetSuuntoStateForTests } from "../storage";
import type { DeviceRunSnapshot } from "../types";

function snap(overrides: Partial<DeviceRunSnapshot> = {}): DeviceRunSnapshot {
  return {
    source_type: "suunto",
    device_name: "Suunto",
    device_model: null,
    entered_at: new Date().toISOString(),
    distance_meters: 5000,
    duration_seconds: 1500,
    average_pace_s_per_km: 300,
    average_speed_kmh: 12,
    max_speed_kmh: null,
    average_heart_rate: null,
    max_heart_rate: null,
    average_cadence_spm: null,
    calories: null,
    training_effect: null,
    peak_training_effect: null,
    epoc_ml_kg: null,
    recovery_time_hours: null,
    ascent_m: null,
    descent_m: null,
    notes: null,
    custom: [],
    ...overrides,
  };
}

describe("compareSnapshots", () => {
  it("computes diff and direction relative to first source", () => {
    const first = treadmillSnapshotFromRun({
      distance_meters: 5000,
      duration_seconds: 1500,
      average_pace_s_per_km: 300,
      average_speed_kmh: 12,
      max_speed_kmh: null,
      average_heart_rate: null,
      max_heart_rate: null,
      average_cadence_spm: null,
      calories: null,
    });
    const second = snap({ distance_meters: 5150 });
    const result = compareSnapshots(first, second);
    const dist = result.metrics.find((m) => m.metric === "distance_meters")!;
    expect(dist.diff).toBe(150);
    expect(dist.direction).toBe("second_greater");
    expect(dist.diff_percent).toBeCloseTo(3, 5);
    expect(result.is_comparable_basic).toBe(true);
  });

  it("handles zero denominator without NaN", () => {
    const a = treadmillSnapshotFromRun({
      distance_meters: 0,
      duration_seconds: 0,
      average_pace_s_per_km: null,
      average_speed_kmh: null,
      max_speed_kmh: null,
      average_heart_rate: null,
      max_heart_rate: null,
      average_cadence_spm: null,
      calories: null,
    });
    const b = snap({ distance_meters: 5000, duration_seconds: 1500 });
    const r = compareSnapshots(a, b);
    const d = r.metrics.find((m) => m.metric === "distance_meters")!;
    expect(d.diff_percent).toBeNull();
    expect(d.ratio_second_first).toBeNull();
  });
});

describe("proposeCalibration", () => {
  it("returns insufficient when <3 samples", () => {
    const p = proposeCalibration("t1", [
      {
        run_id: "r1",
        started_at: "2025-01-01",
        treadmill_distance_m: 5000,
        suunto_distance_m: 5100,
        treadmill_duration_s: 1500,
        suunto_duration_s: 1500,
        excluded: false,
        is_outlier: false,
      },
      {
        run_id: "r2",
        started_at: "2025-01-02",
        treadmill_distance_m: 5000,
        suunto_distance_m: 5150,
        treadmill_duration_s: 1500,
        suunto_duration_s: 1500,
        excluded: false,
        is_outlier: false,
      },
    ]);
    expect(p.factor).toBeNull();
    expect(p.confidence_label).toBe("insufficient");
  });

  it("uses median ratio and excludes outliers from calc but records them", () => {
    const p = proposeCalibration("t1", [
      { run_id: "a", started_at: "2025-01-01", treadmill_distance_m: 5000, suunto_distance_m: 5100, treadmill_duration_s: 1500, suunto_duration_s: 1500, excluded: false, is_outlier: false },
      { run_id: "b", started_at: "2025-01-02", treadmill_distance_m: 5000, suunto_distance_m: 5150, treadmill_duration_s: 1500, suunto_duration_s: 1500, excluded: false, is_outlier: false },
      { run_id: "c", started_at: "2025-01-03", treadmill_distance_m: 5000, suunto_distance_m: 5120, treadmill_duration_s: 1500, suunto_duration_s: 1500, excluded: false, is_outlier: false },
      { run_id: "d", started_at: "2025-01-04", treadmill_distance_m: 5000, suunto_distance_m: 9000, treadmill_duration_s: 1500, suunto_duration_s: 1500, excluded: false, is_outlier: true },
    ]);
    expect(p.sample_size).toBe(3);
    expect(p.factor).toBeCloseTo(1.024, 3);
    expect(p.excluded_run_ids).toContain("d");
    expect(p.confidence_label).toBe("low");
  });
});

describe("labelFromSample", () => {
  it.each([
    [0, "insufficient"],
    [2, "insufficient"],
    [3, "low"],
    [4, "preliminary"],
    [5, "basic"],
    [9, "basic"],
    [10, "moderate"],
    [19, "moderate"],
    [20, "relatively_high"],
    [100, "relatively_high"],
  ])("n=%i → %s", (n, label) => {
    expect(labelFromSample(n)).toBe(label);
  });
});

describe("assessOutliers", () => {
  it("flags large distance deviation", () => {
    const res = assessOutliers([
      { run_id: "a", treadmill_distance_m: 5000, suunto_distance_m: 5050, treadmill_duration_s: 1500, suunto_duration_s: 1500 },
      { run_id: "b", treadmill_distance_m: 5000, suunto_distance_m: 5100, treadmill_duration_s: 1500, suunto_duration_s: 1500 },
      { run_id: "c", treadmill_distance_m: 5000, suunto_distance_m: 5080, treadmill_duration_s: 1500, suunto_duration_s: 1500 },
      { run_id: "d", treadmill_distance_m: 5000, suunto_distance_m: 8000, treadmill_duration_s: 1500, suunto_duration_s: 1500 },
    ]);
    const d = res.find((x) => x.run_id === "d")!;
    expect(d.is_outlier).toBe(true);
    expect(d.reasons).toContain("distance_deviation");
  });
});

describe("suuntoRepo snapshot lifecycle", () => {
  beforeEach(() => __resetSuuntoStateForTests());

  it("upsert then buildSnapshot returns same data; delete + restore preserves it", () => {
    const s = snap({ distance_meters: 5200, duration_seconds: 1600 });
    suuntoRepo.upsertSuuntoSnapshot("run-1", s);
    const built = suuntoRepo.getSuuntoSnapshot("run-1");
    expect(built?.distance_meters).toBe(5200);
    expect(built?.duration_seconds).toBe(1600);

    suuntoRepo.softDeleteSuuntoForRun("run-1", "suunto");
    expect(suuntoRepo.getSuuntoSnapshot("run-1")).toBeNull();
    expect(suuntoRepo.hasTrashedSource("run-1", "suunto")).toBe(true);

    const n = suuntoRepo.restoreSuuntoForRun("run-1", "suunto");
    expect(n).toBeGreaterThan(0);
    expect(suuntoRepo.getSuuntoSnapshot("run-1")?.distance_meters).toBe(5200);
  });

  it("second upsert replaces prior suunto rows atomically", () => {
    suuntoRepo.upsertSuuntoSnapshot("run-2", snap({ distance_meters: 5000 }));
    suuntoRepo.upsertSuuntoSnapshot("run-2", snap({ distance_meters: 6000 }));
    const built = suuntoRepo.getSuuntoSnapshot("run-2");
    expect(built?.distance_meters).toBe(6000);
    // הישן הפך ל-deleted; חדש פעיל
    expect(suuntoRepo.listActiveReadings("run-2", "suunto").length).toBeGreaterThan(0);
  });
});
