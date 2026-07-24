/**
 * Session comparison — משווה שני אימונים.
 * מספק מדדים ברי־השוואה בלבד; מפרט אילו לא ברי־השוואה.
 */
import {
  getSession,
  listSessionExercises,
  computeSessionVolume,
} from "@/lib/sessions";
import type { SessionComparison } from "./types";
import { countRealRecords } from "./records";
import { computeWorkoutQuality } from "./quality";

function pct(a: number | null, b: number | null): number | null {
  if (a == null || b == null || b === 0) return null;
  return Math.round(((a - b) / b) * 1000) / 10;
}

export function compareSessions(aId: string, bId: string): SessionComparison | null {
  const a = getSession(aId);
  const b = getSession(bId);
  if (!a || !b) return null;
  const va = computeSessionVolume(aId);
  const vb = computeSessionVolume(bId);
  const qa = a.status === "completed" ? computeWorkoutQuality(aId).totalScore : null;
  const qb = b.status === "completed" ? computeWorkoutQuality(bId).totalScore : null;
  const setEx = (id: string) => new Set(listSessionExercises(id).map((e) => e.exercise_id));
  const A = setEx(aId), B = setEx(bId);
  const shared = [...A].filter((x) => B.has(x));
  const onlyA = [...A].filter((x) => !B.has(x));
  const onlyB = [...B].filter((x) => !A.has(x));
  const prA = a.status === "completed" ? countRealRecords(aId) : 0;
  const prB = b.status === "completed" ? countRealRecords(bId) : 0;

  const metrics: SessionComparison["metrics"] = [
    metric("duration", "משך", "שניות", a.duration_seconds, b.duration_seconds),
    metric("volume", "נפח", "kg", va.totalVolumeKg, vb.totalVolumeKg),
    metric("sets", "סטים", "סטים", va.totalSets, vb.totalSets),
    metric("completed_sets", "סטים שהושלמו", "סטים", va.completedSets, vb.completedSets),
    metric("reps", "חזרות", "חזרות", va.totalReps, vb.totalReps),
    metric(
      "completion_rate",
      "שיעור השלמה",
      "%",
      Math.round(va.completionRate * 1000) / 10,
      Math.round(vb.completionRate * 1000) / 10,
    ),
    metric("supersets", "סופרסטים", "בלוקים", va.supersetsCount, vb.supersetsCount),
    metric("prs", "שיאים", "שיאים", prA, prB),
    metric("quality", "מדד איכות", "0-100", qa, qb),
    metric("rpe", "RPE כללי", "1-10", a.perceived_effort, b.perceived_effort),
  ];

  return {
    a,
    b,
    metrics,
    sharedExerciseIds: shared,
    onlyInA: onlyA,
    onlyInB: onlyB,
    prsDeltaCount: prA - prB,
  };
}

function metric(
  id: string,
  label: string,
  unit: string,
  a: number | null,
  b: number | null,
): SessionComparison["metrics"][number] {
  const comparable = a != null && b != null;
  const delta = comparable ? Math.round((a! - b!) * 10) / 10 : null;
  return {
    id,
    label,
    unit,
    a,
    b,
    delta,
    deltaPercent: pct(a, b),
    comparable,
    note: comparable ? undefined : "אין נתונים בשני האימונים.",
  };
}
