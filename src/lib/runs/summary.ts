/** Aggregate metrics for the running domain screen. */
import type { RunSession } from "./types";
import { weightedAveragePaceByDistance } from "./calc";

export type RunPeriod = "week" | "month" | "year" | "all";

function periodStart(period: RunPeriod, now: Date): Date | null {
  if (period === "all") return null;
  const d = new Date(now);
  if (period === "week") {
    const day = d.getDay(); // Sun=0
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}

export interface RunAggregates {
  count: number;
  total_distance_m: number;
  total_duration_s: number;
  avg_distance_m: number | null;
  avg_duration_s: number | null;
  avg_pace_s_per_km: number | null;
  longest_distance_m: number | null;
  last_run_at: string | null;
  days_since_last: number | null;
  treadmill_count: number;
  outdoor_count: number;
}

const MS_DAY = 86_400_000;

export function computeRunAggregates(
  runs: RunSession[],
  period: RunPeriod = "month",
  now: Date = new Date(),
): RunAggregates {
  const active = runs.filter((r) => r.deleted_at == null && r.status === "completed");
  const start = periodStart(period, now);
  const scoped = start ? active.filter((r) => new Date(r.started_at) >= start) : active;

  let totalD = 0;
  let totalT = 0;
  let longest: number | null = null;
  let treadmill = 0;
  let outdoor = 0;
  for (const r of scoped) {
    if (r.distance_meters != null) {
      totalD += r.distance_meters;
      longest = longest == null ? r.distance_meters : Math.max(longest, r.distance_meters);
    }
    if (r.duration_seconds != null) totalT += r.duration_seconds;
    if (r.run_type === "treadmill") treadmill++;
    else outdoor++;
  }
  const count = scoped.length;
  const lastSorted = [...active].sort((a, b) => (a.started_at < b.started_at ? 1 : -1));
  const last = lastSorted[0] ?? null;
  const days_since_last = last
    ? Math.floor((now.getTime() - new Date(last.started_at).getTime()) / MS_DAY)
    : null;

  const avgPace = weightedAveragePaceByDistance(
    scoped.map((r) => ({
      pace_s_per_km: r.average_pace_s_per_km,
      distance_meters: r.distance_meters,
    })),
  );

  return {
    count,
    total_distance_m: totalD,
    total_duration_s: totalT,
    avg_distance_m: count > 0 && totalD > 0 ? totalD / count : null,
    avg_duration_s: count > 0 && totalT > 0 ? totalT / count : null,
    avg_pace_s_per_km: avgPace,
    longest_distance_m: longest,
    last_run_at: last?.started_at ?? null,
    days_since_last,
    treadmill_count: treadmill,
    outdoor_count: outdoor,
  };
}
