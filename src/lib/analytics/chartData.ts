/**
 * Chart data adapters — ממירים היסטוריה למבני סדרות.
 * גרף בודד לכל פעם, tooltip בלחיצה, חלופה מספרית — עניין ה־UI.
 */
import type { ChartSeries } from "./types";
import { getExerciseHistoryRows } from "./exerciseHistory";
import { listSessionExercises, listExerciseSets } from "@/lib/sessions";
import { bestEstimate1RM } from "./oneRM";
import { isWorkingSet } from "./comparability";
import { toKg } from "./volume";

export type ExerciseMetricId =
  | "weight_top"
  | "reps_top"
  | "estimated_1rm"
  | "volume"
  | "rpe_avg"
  | "completion";

export const EXERCISE_METRIC_LABELS: Record<ExerciseMetricId, { label: string; unit: string }> = {
  weight_top: { label: "משקל מרבי בסט", unit: "kg" },
  reps_top: { label: "חזרות מרביות בסט", unit: "חזרות" },
  estimated_1rm: { label: "הערכת 1RM", unit: "kg" },
  volume: { label: "נפח לאימון", unit: "kg" },
  rpe_avg: { label: "RPE ממוצע", unit: "1-10" },
  completion: { label: "שיעור השלמה", unit: "%" },
};

export function buildExerciseMetricSeries(
  exerciseId: string,
  metric: ExerciseMetricId,
): ChartSeries {
  const rows = getExerciseHistoryRows(exerciseId).slice().reverse(); // ישן → חדש לגרף
  const meta = EXERCISE_METRIC_LABELS[metric];
  const points = rows
    .map((row) => {
      const sessionExs = listSessionExercises(row.sessionId).filter(
        (e) => e.exercise_id === exerciseId,
      );
      let value: number | null = null;
      for (const ex of sessionExs) {
        const sets = listExerciseSets(ex.id);
        const working = sets.filter(isWorkingSet);
        switch (metric) {
          case "weight_top": {
            const top = Math.max(
              0,
              ...working
                .filter((s) => s.actual_weight != null)
                .map((s) => toKg(s.actual_weight!, s.weight_unit)),
            );
            if (top > 0) value = Math.max(value ?? 0, top);
            break;
          }
          case "reps_top": {
            const top = Math.max(
              0,
              ...working.filter((s) => s.actual_reps != null).map((s) => s.actual_reps!),
            );
            if (top > 0) value = Math.max(value ?? 0, top);
            break;
          }
          case "estimated_1rm": {
            const one = bestEstimate1RM(sets, { trackingType: ex.snapshot.tracking_type });
            if (one) value = Math.max(value ?? 0, one.value);
            break;
          }
          case "volume": {
            value = (value ?? 0) + row.totalVolumeKg;
            break;
          }
          case "rpe_avg": {
            const rpes = working.map((s) => s.rpe).filter((r): r is number => r != null);
            if (rpes.length) {
              const avg = rpes.reduce((a, b) => a + b, 0) / rpes.length;
              value = value == null ? avg : (value + avg) / 2;
            }
            break;
          }
          case "completion": {
            const total = sets.filter((s) => s.set_type !== "warmup").length;
            const done = sets.filter((s) => s.set_type !== "warmup" && s.completed).length;
            if (total > 0) value = Math.round((done / total) * 100);
            break;
          }
        }
      }
      return value == null ? null : { x: row.date, y: Math.round(value * 10) / 10 };
    })
    .filter((p): p is { x: string; y: number } => !!p);

  return {
    metricId: metric,
    metricLabel: meta.label,
    unit: meta.unit,
    points,
  };
}
