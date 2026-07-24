/**
 * Progress analysis — מדד התקדמות שקוף עבור תרגיל.
 *
 * מבוסס על השוואה של האימונים ב־window האחרון מול חלון קודם באותו אורך.
 * מחזיר תווית תיאורית + רכיבים.
 */
import { listSessionExercises, listExerciseSets, listSessions } from "@/lib/sessions";
import type { StrengthSession } from "@/lib/sessions";
import type { ProgressAnalysis, ProgressComponent, ProgressLabel } from "./types";
import { isWorkingSet } from "./comparability";
import { setVolumeKg, sumSetsVolumeKg, toKg } from "./volume";
import { bestEstimate1RM } from "./oneRM";

interface WindowStats {
  sessions: number;
  avg1RM: number | null;
  avgTopWeight: number | null;
  avgTopReps: number | null;
  avgVolume: number | null;
  avgRpe: number | null;
  completionRate: number | null;
}

function computeWindow(
  sessions: StrengthSession[],
  exerciseId: string,
): WindowStats {
  const stats: WindowStats = {
    sessions: sessions.length,
    avg1RM: null,
    avgTopWeight: null,
    avgTopReps: null,
    avgVolume: null,
    avgRpe: null,
    completionRate: null,
  };
  if (!sessions.length) return stats;
  let sum1RM = 0, cnt1RM = 0;
  let sumTW = 0, cntTW = 0;
  let sumTR = 0, cntTR = 0;
  let sumVol = 0, cntVol = 0;
  let sumRpe = 0, cntRpe = 0;
  let totalSets = 0, doneSets = 0;
  for (const s of sessions) {
    const exs = listSessionExercises(s.id).filter((e) => e.exercise_id === exerciseId);
    for (const ex of exs) {
      const sets = listExerciseSets(ex.id);
      const vol = sumSetsVolumeKg(sets, ex.snapshot);
      if (vol > 0) { sumVol += vol; cntVol++; }
      const oneRm = bestEstimate1RM(sets, { trackingType: ex.snapshot.tracking_type });
      if (oneRm) { sum1RM += oneRm.value; cnt1RM++; }
      let topW = 0, topR = 0;
      for (const st of sets.filter(isWorkingSet)) {
        totalSets++;
        if (st.completed) doneSets++;
        if (st.actual_weight != null) {
          const wkg = toKg(st.actual_weight, st.weight_unit);
          if (wkg > topW) topW = wkg;
        }
        if (st.actual_reps != null && st.actual_reps > topR) topR = st.actual_reps;
        if (st.rpe != null) { sumRpe += st.rpe; cntRpe++; }
      }
      if (topW > 0) { sumTW += topW; cntTW++; }
      if (topR > 0) { sumTR += topR; cntTR++; }
    }
  }
  stats.avg1RM = cnt1RM ? sum1RM / cnt1RM : null;
  stats.avgTopWeight = cntTW ? sumTW / cntTW : null;
  stats.avgTopReps = cntTR ? sumTR / cntTR : null;
  stats.avgVolume = cntVol ? sumVol / cntVol : null;
  stats.avgRpe = cntRpe ? sumRpe / cntRpe : null;
  stats.completionRate = totalSets ? doneSets / totalSets : null;
  return stats;
}

function pct(a: number | null, b: number | null): number | null {
  if (a == null || b == null || b === 0) return null;
  return Math.round(((a - b) / b) * 1000) / 10;
}

function labelFromComponents(components: ProgressComponent[]): ProgressLabel {
  const known = components.filter((c) => c.changePercent != null);
  if (known.length === 0) return "insufficient_data";
  const ups = known.filter((c) => (c.changePercent ?? 0) > 1).length;
  const downs = known.filter((c) => (c.changePercent ?? 0) < -1).length;
  const stable = known.length - ups - downs;
  if (ups === 0 && downs === 0) return "stable";
  if (ups >= 3 && downs === 0) return "clear_improvement";
  if (ups >= 1 && downs === 0) return "mild_improvement";
  if (downs > ups && ups > 0) return "mixed";
  if (downs > 0 && ups === 0 && stable >= 1) return "temporary_dip";
  return "mixed";
}

const LABEL_HE: Record<ProgressLabel, string> = {
  insufficient_data: "אין מספיק נתונים",
  stable: "יציב",
  mild_improvement: "שיפור קל",
  clear_improvement: "שיפור ברור",
  temporary_dip: "ירידה זמנית",
  mixed: "מגמה מעורבת",
};

export function analyzeExerciseProgress(
  exerciseId: string,
  windowDays = 60,
): ProgressAnalysis {
  const now = Date.now();
  const winMs = windowDays * 86400000;
  const all = listSessions()
    .filter((s) => s.status === "completed" && !s.deleted_at)
    .sort((a, b) => (a.started_at < b.started_at ? 1 : -1));
  const recent = all.filter((s) => now - new Date(s.started_at).getTime() <= winMs);
  const prior = all.filter((s) => {
    const t = new Date(s.started_at).getTime();
    return now - t > winMs && now - t <= winMs * 2;
  });
  const A = computeWindow(recent, exerciseId);
  const B = computeWindow(prior, exerciseId);
  const missing: string[] = [];
  if (A.avgRpe == null && B.avgRpe == null) missing.push("RPE");
  if (A.completionRate == null) missing.push("שיעור השלמה");
  const components: ProgressComponent[] = [
    {
      id: "estimated_1rm",
      label: "הערכת 1RM",
      changePercent: pct(A.avg1RM, B.avg1RM),
      direction: dir(A.avg1RM, B.avg1RM),
    },
    {
      id: "weight_at_reps",
      label: "משקל מרבי בסט עבודה",
      changePercent: pct(A.avgTopWeight, B.avgTopWeight),
      direction: dir(A.avgTopWeight, B.avgTopWeight),
    },
    {
      id: "reps_at_weight",
      label: "חזרות מרביות",
      changePercent: pct(A.avgTopReps, B.avgTopReps),
      direction: dir(A.avgTopReps, B.avgTopReps),
    },
    {
      id: "volume",
      label: "נפח לאימון",
      changePercent: pct(A.avgVolume, B.avgVolume),
      direction: dir(A.avgVolume, B.avgVolume),
    },
    {
      id: "rpe",
      label: "RPE ממוצע",
      changePercent: A.avgRpe != null && B.avgRpe != null ? pct(B.avgRpe, A.avgRpe) : null,
      direction: A.avgRpe != null && B.avgRpe != null ? dir(B.avgRpe, A.avgRpe) : "unknown",
      note: "ירידה ב־RPE באותו עומס נחשבת לחיובית.",
    },
    {
      id: "completion_rate",
      label: "שיעור השלמה",
      changePercent: pct(A.completionRate, B.completionRate),
      direction: dir(A.completionRate, B.completionRate),
    },
    {
      id: "frequency",
      label: "תדירות",
      changePercent:
        B.sessions > 0 ? Math.round(((A.sessions - B.sessions) / B.sessions) * 1000) / 10 : null,
      direction: A.sessions === B.sessions ? "flat" : A.sessions > B.sessions ? "up" : "down",
    },
  ];
  const label = A.sessions < 2 ? "insufficient_data" : labelFromComponents(components);
  const confidence: ProgressAnalysis["confidence"] =
    A.sessions >= 5 && B.sessions >= 5 ? "high" : A.sessions >= 3 ? "medium" : "low";
  return {
    exerciseId,
    label,
    labelHe: LABEL_HE[label],
    explanation:
      label === "insufficient_data"
        ? `נדרשים לפחות שני אימונים בטווח של ${windowDays} ימים.`
        : `השוואה בין ${A.sessions} אימונים אחרונים ל־${B.sessions} אימונים בחלון קודם.`,
    components,
    windowDays,
    sampleSize: A.sessions,
    confidence,
    missingData: missing,
  };
}

function dir(a: number | null, b: number | null): ProgressComponent["direction"] {
  if (a == null || b == null) return "unknown";
  if (Math.abs(a - b) < 1e-6) return "flat";
  return a > b ? "up" : "down";
}
