import { beforeEach, describe, expect, it } from "vitest";
import * as repo from "@/lib/runs/repo";
import { __resetRunsStateForTests } from "@/lib/runs/storage";
import type { RunSessionInput } from "@/lib/runs/types";
import { computeRunAggregates } from "@/lib/runs/summary";

function baseInput(overrides: Partial<RunSessionInput> = {}): RunSessionInput {
  return {
    run_type: "outdoor",
    status: "completed",
    started_at: new Date().toISOString(),
    ended_at: null,
    timezone: "Asia/Jerusalem",
    duration_seconds: 1800,
    distance_meters: 5000,
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

describe("runs repository", () => {
  beforeEach(() => __resetRunsStateForTests());

  it("create derives pace and speed when duration+distance given", () => {
    const r = repo.createRun(baseInput());
    expect(r.average_pace_s_per_km).toBe(360);
    expect(r.provenance.average_pace_s_per_km).toBe("derived");
    expect(r.average_speed_kmh).toBeCloseTo(10, 5);
  });

  it("manual pace is not overwritten by derive", () => {
    const r = repo.createRun(
      baseInput({
        average_pace_s_per_km: 400,
        provenance: { average_pace_s_per_km: "manual" },
      }),
    );
    expect(r.average_pace_s_per_km).toBe(400);
  });

  it("update recalculates derived when raw changes", () => {
    const r = repo.createRun(baseInput({ duration_seconds: null, distance_meters: null }));
    expect(r.average_pace_s_per_km).toBeNull();
    const updated = repo.updateRun(r.id, { duration_seconds: 1800, distance_meters: 5000 });
    expect(updated?.average_pace_s_per_km).toBe(360);
  });

  it("soft delete then restore", () => {
    const r = repo.createRun(baseInput());
    expect(repo.softDeleteRun(r.id)).toBe(true);
    expect(repo.getRun(r.id)?.deleted_at).not.toBeNull();
    expect(repo.restoreRun(r.id)).toBe(true);
    expect(repo.getRun(r.id)?.deleted_at).toBeNull();
  });

  it("archive and unarchive keep history intact", () => {
    const r = repo.createRun(baseInput());
    repo.archiveRun(r.id);
    expect(repo.getRun(r.id)?.status).toBe("archived");
    repo.unarchiveRun(r.id);
    expect(repo.getRun(r.id)?.status).toBe("completed");
  });

  it("duplicate creates a draft without performance values", () => {
    const src = repo.createRun(baseInput({ location_id: "loc-1", notes: "great run" }));
    const dup = repo.duplicateRun(src.id);
    expect(dup?.status).toBe("draft");
    expect(dup?.location_id).toBe("loc-1");
    expect(dup?.duration_seconds).toBeNull();
    expect(dup?.distance_meters).toBeNull();
    expect(dup?.notes).toBeNull();
    expect(dup?.id).not.toBe(src.id);
  });

  it("purge only removes items already in trash", () => {
    const r = repo.createRun(baseInput());
    expect(repo.purgeRun(r.id)).toBe(false);
    repo.softDeleteRun(r.id);
    expect(repo.purgeRun(r.id)).toBe(true);
    expect(repo.getRun(r.id)).toBeNull();
  });

  it("sumSegments sums duration and distance, computes pace", () => {
    const s = repo.sumSegments([
      {
        id: "1",
        sequence: 0,
        segment_type: "warmup",
        duration_seconds: 600,
        distance_meters: 1000,
        average_speed_kmh: null,
        average_pace_s_per_km: null,
        incline_pct: null,
        notes: null,
      },
      {
        id: "2",
        sequence: 1,
        segment_type: "work",
        duration_seconds: 1200,
        distance_meters: 4000,
        average_speed_kmh: null,
        average_pace_s_per_km: null,
        incline_pct: null,
        notes: null,
      },
    ]);
    expect(s.duration_seconds).toBe(1800);
    expect(s.distance_meters).toBe(5000);
    expect(s.average_pace_s_per_km).toBe(360);
  });

  it("routes CRUD + soft delete", () => {
    const route = repo.createRoute({
      name: "המרובע",
      route_type: "loop",
      location_id: null,
      country_code: "IL",
      city_or_area: "כפר סבא",
      typical_distance_meters: 5000,
      description: null,
      notes: null,
      image_url: null,
      is_favorite: false,
      is_active: true,
    });
    expect(repo.getRoute(route.id)?.name).toBe("המרובע");
    repo.softDeleteRoute(route.id);
    expect(repo.getRoute(route.id)?.deleted_at).not.toBeNull();
  });

  it("aggregates over a month", () => {
    repo.createRun(baseInput({ distance_meters: 5000, duration_seconds: 1800 }));
    repo.createRun(
      baseInput({ distance_meters: 10000, duration_seconds: 3600, run_type: "treadmill" }),
    );
    const agg = computeRunAggregates(repo.listRuns(), "all");
    expect(agg.count).toBe(2);
    expect(agg.total_distance_m).toBe(15000);
    expect(agg.longest_distance_m).toBe(10000);
    expect(agg.treadmill_count).toBe(1);
    expect(agg.outdoor_count).toBe(1);
    // weighted avg = (5000*360 + 10000*360)/15000 = 360
    expect(agg.avg_pace_s_per_km).toBe(360);
  });
});
