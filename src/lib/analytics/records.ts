/**
 * Personal Records service — דטרמיניסטי, שקוף, לא מזייף שיאים באימון ראשון.
 *
 * שיא נקבע רק כאשר קיימת היסטוריה קודמת של הביצוע. באימון ראשון לתרגיל
 * מסומן isBaseline=true והלייבל הוא "נתון בסיס ראשון" (לא "שיא חדש").
 */
import {
  listSessionExercises,
  listExerciseSets,
  listSessions,
} from "@/lib/sessions";
import type { StrengthSession, StrengthSessionExercise, StrengthSet } from "@/lib/sessions";
import type { PersonalRecord } from "./types";
import { isWorkingSet } from "./comparability";
import { setVolumeKg, sumSetsVolumeKg, toKg } from "./volume";
import { bestEstimate1RM, estimate1RMForSet } from "./oneRM";

interface HistorySnapshot {
  topWeight: number;
  topReps: number;
  topSetVolume: number;
  topSessionVolume: number;
  top1RM: number;
  /** reps במשקל מסוים: מפתח = משקל ל־kg מעוגל ל־0.5, ערך = חזרות מקסימליות. */
  repsAtWeight: Map<number, number>;
  /** weight במספר חזרות: מפתח = reps, ערך = משקל מקסימלי (kg). */
  weightAtReps: Map<number, number>;
  /** rpe הנמוך ביותר בעומס (weight,reps) — key: `${w}|${r}`. */
  minRpeByLoad: Map<string, number>;
}

function keyLoad(w: number, r: number): string {
  return `${Math.round(w * 2) / 2}|${r}`;
}
function bucketWeight(w: number): number {
  return Math.round(w * 2) / 2;
}

function collectHistory(
  exerciseId: string,
  excludeSessionId: string,
): { snap: HistorySnapshot; anyHistory: boolean } {
  const snap: HistorySnapshot = {
    topWeight: 0,
    topReps: 0,
    topSetVolume: 0,
    topSessionVolume: 0,
    top1RM: 0,
    repsAtWeight: new Map(),
    weightAtReps: new Map(),
    minRpeByLoad: new Map(),
  };
  let any = false;
  const sessions = listSessions().filter(
    (s) => s.id !== excludeSessionId && s.status === "completed" && !s.deleted_at,
  );
  for (const s of sessions) {
    const exs = listSessionExercises(s.id).filter((e) => e.exercise_id === exerciseId);
    for (const ex of exs) {
      const sets = listExerciseSets(ex.id);
      const vol = sumSetsVolumeKg(sets, ex.snapshot);
      if (vol > snap.topSessionVolume) snap.topSessionVolume = vol;
      const oneRm = bestEstimate1RM(sets, { trackingType: ex.snapshot.tracking_type });
      if (oneRm && oneRm.value > snap.top1RM) snap.top1RM = oneRm.value;
      for (const st of sets.filter(isWorkingSet)) {
        any = true;
        if (st.actual_weight != null) {
          const wkg = toKg(st.actual_weight, st.weight_unit);
          if (wkg > snap.topWeight) snap.topWeight = wkg;
          if (st.actual_reps != null) {
            const setVol = setVolumeKg(st, ex.snapshot);
            if (setVol > snap.topSetVolume) snap.topSetVolume = setVol;
            const wk = bucketWeight(wkg);
            const prevAtW = snap.repsAtWeight.get(wk) ?? 0;
            if (st.actual_reps > prevAtW) snap.repsAtWeight.set(wk, st.actual_reps);
            const prevAtR = snap.weightAtReps.get(st.actual_reps) ?? 0;
            if (wkg > prevAtR) snap.weightAtReps.set(st.actual_reps, wkg);
            if (st.rpe != null) {
              const k = keyLoad(wkg, st.actual_reps);
              const prev = snap.minRpeByLoad.get(k);
              if (prev == null || st.rpe < prev) snap.minRpeByLoad.set(k, st.rpe);
            }
          }
        }
        if (st.actual_reps != null && st.actual_reps > snap.topReps) snap.topReps = st.actual_reps;
      }
    }
  }
  return { snap, anyHistory: any };
}

/**
 * זיהוי כל השיאים באימון (ולכל תרגיל בו).
 * אם אין היסטוריה קודמת לתרגיל — לא מייצר שיא (מוחזר baseline משמעותי אחד).
 */
export function detectSessionRecords(sessionId: string): PersonalRecord[] {
  const session = listSessions().find((s) => s.id === sessionId);
  if (!session) return [];
  const records: PersonalRecord[] = [];
  const exs = listSessionExercises(sessionId);
  const byExercise = new Map<string, StrengthSessionExercise[]>();
  for (const ex of exs) {
    const arr = byExercise.get(ex.exercise_id) ?? [];
    arr.push(ex);
    byExercise.set(ex.exercise_id, arr);
  }
  for (const [exerciseId, list] of byExercise) {
    const { snap, anyHistory } = collectHistory(exerciseId, sessionId);
    let curTopWeight = 0;
    let curTopReps = 0;
    let curTopSetVol = 0;
    let curSessionVol = 0;
    let curBestSet: StrengthSet | null = null;
    let cur1RM = 0;
    let cur1RMSetId: string | null = null;
    for (const ex of list) {
      const sets = listExerciseSets(ex.id);
      curSessionVol += sumSetsVolumeKg(sets, ex.snapshot);
      const oneRm = bestEstimate1RM(sets, { trackingType: ex.snapshot.tracking_type });
      if (oneRm && oneRm.value > cur1RM) {
        cur1RM = oneRm.value;
        cur1RMSetId = oneRm.sourceSetId;
      }
      for (const st of sets.filter(isWorkingSet)) {
        if (st.actual_weight != null) {
          const wkg = toKg(st.actual_weight, st.weight_unit);
          if (wkg > curTopWeight) curTopWeight = wkg;
          if (st.actual_reps != null) {
            const v = setVolumeKg(st, ex.snapshot);
            if (v > curTopSetVol) {
              curTopSetVol = v;
              curBestSet = st;
            }
          }
        }
        if (st.actual_reps != null && st.actual_reps > curTopReps) curTopReps = st.actual_reps;
      }
    }

    if (!anyHistory) {
      // baseline — לא מוצג כשיא. מדווח פעם אחת אם יש נתון משמעותי.
      if (curTopWeight > 0) {
        records.push({
          kind: "top_weight",
          exerciseId,
          sessionId,
          setId: null,
          date: session.started_at,
          value: Math.round(curTopWeight * 10) / 10,
          unit: "kg",
          previousValue: null,
          comparisonNote: "נתון בסיס ראשון — עדיין אין ביצוע קודם להשוואה.",
          isBaseline: true,
        });
      }
      continue;
    }

    if (curTopWeight > snap.topWeight)
      records.push({
        kind: "top_weight",
        exerciseId,
        sessionId,
        setId: null,
        date: session.started_at,
        value: Math.round(curTopWeight * 10) / 10,
        unit: "kg",
        previousValue: Math.round(snap.topWeight * 10) / 10,
        comparisonNote: "משקל גבוה יותר מכל ביצוע קודם באותו תרגיל (מנורמל ל־kg).",
        isBaseline: false,
      });
    if (curTopReps > snap.topReps)
      records.push({
        kind: "top_reps",
        exerciseId,
        sessionId,
        setId: null,
        date: session.started_at,
        value: curTopReps,
        unit: "reps",
        previousValue: snap.topReps,
        comparisonNote: "יותר חזרות בסט עבודה מכל היסטוריה קודמת.",
        isBaseline: false,
      });
    if (curTopSetVol > snap.topSetVolume && curBestSet)
      records.push({
        kind: "top_set_volume",
        exerciseId,
        sessionId,
        setId: curBestSet.id,
        date: session.started_at,
        value: Math.round(curTopSetVol * 10) / 10,
        unit: "volume_kg",
        previousValue: Math.round(snap.topSetVolume * 10) / 10,
        comparisonNote: "נפח סט (weight × reps) גבוה מכל סט עבודה קודם.",
        isBaseline: false,
      });
    if (curSessionVol > snap.topSessionVolume)
      records.push({
        kind: "top_session_volume",
        exerciseId,
        sessionId,
        setId: null,
        date: session.started_at,
        value: Math.round(curSessionVol * 10) / 10,
        unit: "volume_kg",
        previousValue: Math.round(snap.topSessionVolume * 10) / 10,
        comparisonNote: "נפח כולל בתרגיל באימון זה גבוה מכל אימון קודם.",
        isBaseline: false,
      });
    if (cur1RM > snap.top1RM && cur1RM > 0)
      records.push({
        kind: "top_estimated_1rm",
        exerciseId,
        sessionId,
        setId: cur1RMSetId,
        date: session.started_at,
        value: Math.round(cur1RM * 10) / 10,
        unit: "1rm_kg",
        previousValue: Math.round(snap.top1RM * 10) / 10,
        comparisonNote: "הערכת 1RM עלתה — לא מדובר בביצוע 1RM אמיתי.",
        formula: "epley-v1",
        isBaseline: false,
      });

    // more_reps_same_weight / more_weight_same_reps / lower_rpe_same_load — סורק סטים ספציפיים
    for (const ex of list) {
      const sets = listExerciseSets(ex.id).filter(isWorkingSet);
      for (const st of sets) {
        if (st.actual_weight == null || st.actual_reps == null) continue;
        const wkg = toKg(st.actual_weight, st.weight_unit);
        const wk = bucketWeight(wkg);
        const prevReps = snap.repsAtWeight.get(wk);
        if (prevReps != null && st.actual_reps > prevReps) {
          records.push({
            kind: "more_reps_same_weight",
            exerciseId,
            sessionId,
            setId: st.id,
            date: session.started_at,
            value: st.actual_reps,
            unit: "reps",
            previousValue: prevReps,
            comparisonNote: `יותר חזרות (${st.actual_reps}) באותו משקל (${wk}kg) בהשוואה לביצוע קודם (${prevReps}).`,
            isBaseline: false,
          });
        }
        const prevWeight = snap.weightAtReps.get(st.actual_reps);
        if (prevWeight != null && wkg > prevWeight) {
          records.push({
            kind: "more_weight_same_reps",
            exerciseId,
            sessionId,
            setId: st.id,
            date: session.started_at,
            value: Math.round(wkg * 10) / 10,
            unit: "kg",
            previousValue: Math.round(prevWeight * 10) / 10,
            comparisonNote: `משקל גבוה יותר באותו מספר חזרות (${st.actual_reps}).`,
            isBaseline: false,
          });
        }
        if (st.rpe != null) {
          const k = keyLoad(wkg, st.actual_reps);
          const prevRpe = snap.minRpeByLoad.get(k);
          if (prevRpe != null && st.rpe < prevRpe) {
            records.push({
              kind: "lower_rpe_same_load",
              exerciseId,
              sessionId,
              setId: st.id,
              date: session.started_at,
              value: st.rpe,
              unit: "rpe",
              previousValue: prevRpe,
              comparisonNote: `RPE נמוך יותר (${st.rpe}) באותו עומס בהשוואה לביצוע קודם (${prevRpe}).`,
              isBaseline: false,
            });
          }
        }
      }
    }
  }
  return dedupeRecords(records);
}

function dedupeRecords(list: PersonalRecord[]): PersonalRecord[] {
  const seen = new Set<string>();
  const out: PersonalRecord[] = [];
  for (const r of list) {
    const key = `${r.kind}:${r.exerciseId}:${r.setId ?? ""}:${r.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

/** ספירה פשוטה עבור אריחי היסטוריה. לא כולל baseline. */
export function countRealRecords(sessionId: string): number {
  return detectSessionRecords(sessionId).filter((r) => !r.isBaseline).length;
}

export const PR_KIND_LABEL_HE: Record<PersonalRecord["kind"], string> = {
  top_weight: "משקל שיא",
  top_reps: "חזרות שיא",
  top_reps_at_weight: "חזרות שיא במשקל נתון",
  top_set_volume: "נפח סט שיא",
  top_session_volume: "נפח אימון שיא",
  top_estimated_1rm: "הערכת 1RM שיא",
  all_sets_in_target_range: "כל הסטים בטווח היעד",
  lower_rpe_same_load: "RPE נמוך יותר בעומס דומה",
  more_reps_same_weight: "יותר חזרות באותו משקל",
  more_weight_same_reps: "יותר משקל באותו מספר חזרות",
};

export function labelForRecord(pr: PersonalRecord): string {
  return pr.isBaseline ? "נתון בסיס ראשון" : PR_KIND_LABEL_HE[pr.kind];
}
