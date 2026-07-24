/**
 * Calibration inputs builder — מקבץ ריצות של הליכון מסוים שיש להן snapshot של Suunto,
 * מחשב outliers, וממפה למבנה שנדרש ע"י `proposeCalibration`.
 */
import { assessOutliers, type RunComparisonPoint } from "./outliers";
import { buildSnapshot, isExcluded } from "./repo";
import type { CalibrationInputRun } from "./calibration";
import type { RunSession } from "@/lib/runs";

export interface RunLike {
  id: string;
  started_at: string;
  distance_meters: number | null;
  duration_seconds: number | null;
  treadmill_id: string | null;
  deleted_at: string | null;
  run_type: string;
}

/**
 * מקבל רשימת ריצות ומזהה הליכון. מסנן ריצות רלוונטיות (treadmill_type + treadmill_id
 * + לא מחוקות + יש snapshot של Suunto), מחשב outliers, ומחזיר CalibrationInputRun[].
 */
export function buildCalibrationInputs(
  treadmillId: string,
  runs: RunSession[] | RunLike[],
): CalibrationInputRun[] {
  const eligible = (runs as RunLike[])
    .filter(
      (r) => r.deleted_at == null && r.treadmill_id === treadmillId && r.run_type === "treadmill",
    )
    .map((r) => {
      const snap = buildSnapshot(r.id, "suunto");
      return { run: r, snap };
    })
    .filter(
      (x): x is { run: RunLike; snap: NonNullable<ReturnType<typeof buildSnapshot>> } => !!x.snap,
    );

  const points: RunComparisonPoint[] = eligible.map(({ run, snap }) => ({
    run_id: run.id,
    treadmill_distance_m: run.distance_meters,
    suunto_distance_m: snap.distance_meters,
    treadmill_duration_s: run.duration_seconds,
    suunto_duration_s: snap.duration_seconds,
  }));
  const outliers = assessOutliers(points);
  const outlierMap = new Map(outliers.map((o) => [o.run_id, o]));

  return eligible.map(({ run, snap }) => {
    const o = outlierMap.get(run.id);
    return {
      run_id: run.id,
      started_at: run.started_at,
      treadmill_distance_m: run.distance_meters,
      suunto_distance_m: snap.distance_meters,
      treadmill_duration_s: run.duration_seconds,
      suunto_duration_s: snap.duration_seconds,
      excluded: isExcluded(treadmillId, run.id),
      is_outlier: o?.is_outlier ?? false,
    };
  });
}
