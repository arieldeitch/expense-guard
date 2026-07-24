/**
 * Exercise history — היסטוריה מלאה של תרגיל בודד לרוחב sessions.
 *
 * מחזיר rows ממויינות מהחדש לישן, plus סיכום top-level (best set, top volume, וכו').
 */
import { getExercise } from "@/lib/exercises";
import {
  getSession,
  listSessionExercises,
  listExerciseSets,
  listSessions,
} from "@/lib/sessions";
import type { StrengthSession } from "@/lib/sessions";
import type {
  ExerciseHistoryRow,
  ExerciseHistorySet,
  ExerciseHistorySummary,
  Estimated1RM,
} from "./types";
import { setVolumeKg, sumSetsVolumeKg, toKg } from "./volume";
import { isWorkingSet } from "./comparability";
import { bestEstimate1RM, estimate1RMForSet } from "./oneRM";

const FINISHED_STATUSES = new Set<StrengthSession["status"]>(["completed", "in_progress"]);

export function getExerciseHistoryRows(exerciseId: string): ExerciseHistoryRow[] {
  const sessions = listSessions().filter((s) => FINISHED_STATUSES.has(s.status) && !s.deleted_at);
  const rows: ExerciseHistoryRow[] = [];
  for (const s of sessions) {
    const exs = listSessionExercises(s.id).filter((e) => e.exercise_id === exerciseId);
    for (const ex of exs) {
      const rawSets = listExerciseSets(ex.id);
      const sets: ExerciseHistorySet[] = rawSets.map((st) => ({
        setId: st.id,
        setNumber: st.set_number,
        setType: st.set_type,
        weightKg:
          st.actual_weight != null
            ? Math.round(toKg(st.actual_weight, st.weight_unit) * 10) / 10
            : null,
        weightRaw: st.actual_weight,
        weightUnit: st.weight_unit,
        reps: st.actual_reps,
        rpe: st.rpe,
        rir: st.rir,
        durationSeconds: st.duration_seconds,
        side: st.side,
        completed: st.completed,
        skipped: st.skipped,
      }));
      const totalVolume = sumSetsVolumeKg(rawSets, ex.snapshot);
      // best working set = weight × reps מרבי מתוך סטי עבודה
      const working = rawSets.filter(isWorkingSet);
      let bestSet: ExerciseHistoryRow["bestWorkingSet"] = null;
      let bestScore = 0;
      for (const st of working) {
        const v = setVolumeKg(st, ex.snapshot);
        if (v > bestScore) {
          bestScore = v;
          const oneRm = estimate1RMForSet(st, { trackingType: ex.snapshot.tracking_type }).value;
          bestSet = {
            setId: st.id,
            weightKg: st.actual_weight != null ? toKg(st.actual_weight, st.weight_unit) : null,
            reps: st.actual_reps,
            estimated1RM: oneRm ? oneRm.value : null,
          };
        }
      }
      rows.push({
        sessionId: s.id,
        date: s.started_at,
        templateId: s.template_id,
        locationId: s.location_id,
        sets,
        totalVolumeKg: totalVolume,
        bestWorkingSet: bestSet,
        note: ex.notes,
      });
    }
  }
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  return rows;
}

export function getExerciseHistorySummary(exerciseId: string): ExerciseHistorySummary {
  const rows = getExerciseHistoryRows(exerciseId);
  const exercise = getExercise(exerciseId);
  const trackingType = exercise?.tracking_type ?? null;

  let topWeight = 0;
  let topReps = 0;
  let topSetVol = 0;
  let topSessionVol = 0;
  let allWorking: Array<{ w: number; r: number; setId: string; snapshotUnilateral: boolean }> = [];

  for (const row of rows) {
    if (row.totalVolumeKg > topSessionVol) topSessionVol = row.totalVolumeKg;
    for (const s of row.sets) {
      if (s.setType === "warmup" || !s.completed || s.skipped) continue;
      if (s.weightKg != null && s.weightKg > topWeight) topWeight = s.weightKg;
      if (s.reps != null && s.reps > topReps) topReps = s.reps;
      if (s.weightKg != null && s.reps != null) {
        const v = s.weightKg * s.reps;
        if (v > topSetVol) topSetVol = v;
        allWorking.push({
          w: s.weightKg,
          r: s.reps,
          setId: s.setId,
          snapshotUnilateral: false,
        });
      }
    }
  }

  // Estimated 1RM על פני כל ההיסטוריה
  let top1RM: Estimated1RM | null = null;
  for (const row of rows) {
    const exs = listSessionExercises(row.sessionId).filter((e) => e.exercise_id === exerciseId);
    for (const ex of exs) {
      const cand = bestEstimate1RM(listExerciseSets(ex.id), {
        trackingType: ex.snapshot.tracking_type,
      });
      if (cand && (!top1RM || cand.value > top1RM.value)) top1RM = cand;
    }
  }

  const last = rows[0] ?? null;
  const lastSession = last ? getSession(last.sessionId) : null;
  const lastWorking = last?.sets.filter((s) => s.setType !== "warmup" && s.completed) ?? [];
  const lastWorkingSet = lastWorking[lastWorking.length - 1] ?? null;
  const daysSinceLast =
    last?.date != null ? Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000) : null;

  return {
    exerciseId,
    timesPerformed: rows.length,
    lastPerformedAt: last?.date ?? null,
    lastWeightKg: lastWorkingSet?.weightKg ?? null,
    lastReps: lastWorkingSet?.reps ?? null,
    lastVolumeKg: last?.totalVolumeKg ?? 0,
    topWeightKg: topWeight || null,
    topReps: topReps || null,
    topSetVolumeKg: topSetVol ? Math.round(topSetVol * 10) / 10 : null,
    topSessionVolumeKg: topSessionVol ? Math.round(topSessionVol * 10) / 10 : null,
    topEstimated1RM: top1RM,
    lastNote: last?.note ?? null,
    lastLocationId: last?.locationId ?? null,
    lastTemplateId: last?.templateId ?? null,
    trackingType,
    daysSinceLast,
  };
}
