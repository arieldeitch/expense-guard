/**
 * Session calculations — volume, PRs, completeness.
 * חישוב נפח: weight × reps רק לסטים completed מסוג מתאים.
 * unilateral: כפול 2 (כי מבצע פעמיים בפועל).
 */
import type { WeightUnit } from "@/lib/templates";
import type {
  PersonalRecordFlag,
  PreviousExercisePerformance,
  SessionVolume,
  StrengthSessionExercise,
  StrengthSet,
} from "./types";
import {
  getSession,
  listExerciseSets,
  listSessionBlocks,
  listSessionExercises,
  listSessions,
} from "./repo";
import { getTimer, computeElapsedSeconds } from "./timer";

function toKg(w: number, unit: WeightUnit): number {
  return unit === "lb" ? w * 0.453592 : w;
}

/** בסיס חישובים ל־session. משתמש רק בסטים לא־מחוקים. */
export function computeSessionVolume(sessionId: string): SessionVolume {
  const blocks = listSessionBlocks(sessionId);
  const exercises = listSessionExercises(sessionId);
  let totalSets = 0;
  let completedSets = 0;
  let skippedSets = 0;
  let totalReps = 0;
  let totalVolumeKg = 0;
  let totalDurationSeconds = 0;
  let completedExercises = 0;
  for (const ex of exercises) {
    const sets = listExerciseSets(ex.id);
    totalSets += sets.length;
    for (const st of sets) {
      if (st.skipped) skippedSets++;
      if (st.completed) {
        completedSets++;
        if (st.actual_reps != null) totalReps += st.actual_reps;
        if (st.actual_weight != null && st.actual_reps != null) {
          const perSide = toKg(st.actual_weight, st.weight_unit) * st.actual_reps;
          totalVolumeKg += ex.snapshot.unilateral ? perSide * 2 : perSide;
        }
        if (st.duration_seconds != null) totalDurationSeconds += st.duration_seconds;
      }
    }
    if (ex.completed) completedExercises++;
  }
  const supersetsCount = blocks.filter(
    (b) => b.block_type === "superset" || b.block_type === "circuit",
  ).length;
  return {
    totalSets,
    completedSets,
    skippedSets,
    totalReps,
    totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
    totalDurationSeconds,
    totalExercises: exercises.length,
    completedExercises,
    supersetsCount,
    completionRate: totalSets ? completedSets / totalSets : 0,
  };
}

/** משך אימון חי לפי timer. אם ended_at קיים — נשתמש בו. */
export function computeSessionDurationSeconds(sessionId: string, now = Date.now()): number {
  const session = getSession(sessionId);
  if (!session) return 0;
  if (session.duration_seconds != null) return session.duration_seconds;
  const t = getTimer(sessionId);
  if (!t) return 0;
  return computeElapsedSeconds(t, now);
}

/** data_completeness heuristic — 0..100. */
export function computeDataCompleteness(sessionId: string): {
  score: number;
  details: string[];
} {
  const session = getSession(sessionId);
  if (!session) return { score: 0, details: [] };
  const exercises = listSessionExercises(sessionId);
  const details: string[] = [];
  let filled = 0;
  let expected = 0;
  for (const ex of exercises) {
    const sets = listExerciseSets(ex.id);
    for (const st of sets) {
      expected += 1;
      if (st.completed || st.skipped) filled += 0.5;
      const needsValues =
        ex.snapshot.tracking_type === "weight_reps" ||
        ex.snapshot.tracking_type === "bodyweight_plus_weight";
      if (st.completed) {
        if (needsValues && st.actual_reps != null && st.actual_weight != null) filled += 0.5;
        else if (!needsValues && (st.actual_reps != null || st.duration_seconds != null))
          filled += 0.5;
        else filled += 0.25;
      }
    }
  }
  if (!session.location_id) details.push("מקום אימון חסר");
  if (!exercises.length) details.push("אין תרגילים");
  const score = expected > 0 ? Math.round((filled / expected) * 100) : 0;
  return { score, details };
}

// ---------- Previous performance ----------

export function findPreviousPerformance(
  currentSessionId: string,
  exerciseId: string,
): PreviousExercisePerformance | null {
  const all = listSessions().filter(
    (s) => s.id !== currentSessionId && (s.status === "completed" || s.status === "in_progress"),
  );
  for (const s of all) {
    const exs = listSessionExercises(s.id).filter((e) => e.exercise_id === exerciseId);
    if (!exs.length) continue;
    const ex = exs[0];
    const sets = listExerciseSets(ex.id).filter((st) => st.completed);
    if (!sets.length) continue;
    const best = sets.reduce<StrengthSet | null>((acc, st) => {
      if (!acc) return st;
      const a = (st.actual_weight ?? 0) * (st.actual_reps ?? 0);
      const b = (acc.actual_weight ?? 0) * (acc.actual_reps ?? 0);
      return a > b ? st : acc;
    }, null);
    let vol = 0;
    for (const st of sets) {
      if (st.actual_weight != null && st.actual_reps != null) {
        vol += toKg(st.actual_weight, st.weight_unit) * st.actual_reps;
      }
    }
    return {
      sessionId: s.id,
      sessionDate: s.started_at,
      bestSet: best
        ? {
            weight: best.actual_weight,
            reps: best.actual_reps,
            unit: best.weight_unit,
          }
        : null,
      totalVolumeKg: Math.round(vol * 10) / 10,
      sets: sets.map((st) => ({
        set_number: st.set_number,
        actual_reps: st.actual_reps,
        actual_weight: st.actual_weight,
        weight_unit: st.weight_unit,
      })),
      note: null,
    };
  }
  return null;
}

// ---------- PRs ----------

export function detectPersonalRecords(
  currentSessionId: string,
  exerciseId: string,
): PersonalRecordFlag[] {
  const historyAll = listSessions().filter(
    (s) => s.id !== currentSessionId && s.status === "completed",
  );
  let maxWeight = 0;
  let maxReps = 0;
  let maxVolume = 0;
  for (const s of historyAll) {
    const exs = listSessionExercises(s.id).filter((e) => e.exercise_id === exerciseId);
    for (const ex of exs) {
      const sets = listExerciseSets(ex.id).filter((st) => st.completed);
      let vol = 0;
      for (const st of sets) {
        if (st.actual_weight != null)
          maxWeight = Math.max(maxWeight, toKg(st.actual_weight, st.weight_unit));
        if (st.actual_reps != null) maxReps = Math.max(maxReps, st.actual_reps);
        if (st.actual_weight != null && st.actual_reps != null) {
          vol += toKg(st.actual_weight, st.weight_unit) * st.actual_reps;
        }
      }
      maxVolume = Math.max(maxVolume, vol);
    }
  }
  const flags: PersonalRecordFlag[] = [];
  const currentExs = listSessionExercises(currentSessionId).filter(
    (e) => e.exercise_id === exerciseId,
  );
  for (const ex of currentExs) {
    const sets = listExerciseSets(ex.id).filter((st) => st.completed);
    let vol = 0;
    let curMaxWeight = 0;
    let curMaxReps = 0;
    for (const st of sets) {
      if (st.actual_weight != null)
        curMaxWeight = Math.max(curMaxWeight, toKg(st.actual_weight, st.weight_unit));
      if (st.actual_reps != null) curMaxReps = Math.max(curMaxReps, st.actual_reps);
      if (st.actual_weight != null && st.actual_reps != null)
        vol += toKg(st.actual_weight, st.weight_unit) * st.actual_reps;
    }
    if (maxWeight > 0 && curMaxWeight > maxWeight)
      flags.push({ kind: "top_weight", value: Math.round(curMaxWeight * 10) / 10, label: "משקל שיא" });
    if (maxReps > 0 && curMaxReps > maxReps)
      flags.push({ kind: "top_reps", value: curMaxReps, label: "מספר חזרות שיא" });
    if (maxVolume > 0 && vol > maxVolume)
      flags.push({ kind: "top_volume", value: Math.round(vol), label: "נפח שיא" });
  }
  return flags;
}

/** Exercise completion helper. */
export function isExerciseComplete(ex: StrengthSessionExercise): boolean {
  return ex.completed;
}
