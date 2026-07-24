/**
 * Muscle group load — סיכום פעילות לפי קבוצת שריר בטווח זמן.
 * ראשי=1, משני=0.5. אלה תצוגה, לא המלצה רפואית.
 */
import { listSessions, listSessionExercises, listExerciseSets } from "@/lib/sessions";
import { getExercise } from "@/lib/exercises";
import { PRIMARY_MUSCLE_WEIGHT, SECONDARY_MUSCLE_WEIGHT } from "./types";
import type { MuscleGroupLoad } from "./types";
import { sumSetsVolumeKg } from "./volume";

export function muscleGroupLoadInRange(fromIso: string, toIso: string): MuscleGroupLoad[] {
  const sessions = listSessions().filter(
    (s) => !s.deleted_at && s.status === "completed" && s.started_at >= fromIso && s.started_at <= toIso,
  );
  const acc = new Map<string, MuscleGroupLoad>();
  const dayByGroup = new Map<string, Set<string>>();
  const lastByGroup = new Map<string, string>();
  for (const s of sessions) {
    const day = s.started_at.slice(0, 10);
    const exs = listSessionExercises(s.id);
    for (const ex of exs) {
      const sets = listExerciseSets(ex.id);
      const total = sets.length;
      const completed = sets.filter((st) => st.completed).length;
      const planned = ex.snapshot.planned_sets;
      const vol = sumSetsVolumeKg(sets, ex.snapshot);
      const base = getExercise(ex.exercise_id);
      const primary = ex.snapshot.primary_muscle_group_id ?? base?.primary_muscle_group_id ?? null;
      const secondaries = base?.secondary_muscle_group_ids ?? [];
      const contributions: Array<[string, number]> = [];
      if (primary) contributions.push([primary, PRIMARY_MUSCLE_WEIGHT]);
      for (const sec of secondaries) contributions.push([sec, SECONDARY_MUSCLE_WEIGHT]);
      for (const [gid, w] of contributions) {
        const row = acc.get(gid) ?? {
          muscleGroupId: gid,
          totalSets: 0,
          plannedSets: 0,
          completedSets: 0,
          frequencyDays: 0,
          daysSinceLast: null,
          volumeShareKg: 0,
        };
        row.totalSets += Math.round(total * w);
        row.plannedSets += Math.round(planned * w);
        row.completedSets += Math.round(completed * w);
        row.volumeShareKg = Math.round((row.volumeShareKg + vol * w) * 10) / 10;
        acc.set(gid, row);
        const days = dayByGroup.get(gid) ?? new Set<string>();
        days.add(day);
        dayByGroup.set(gid, days);
        const prevLast = lastByGroup.get(gid);
        if (!prevLast || s.started_at > prevLast) lastByGroup.set(gid, s.started_at);
      }
    }
  }
  const now = Date.now();
  for (const [gid, row] of acc) {
    row.frequencyDays = dayByGroup.get(gid)?.size ?? 0;
    const last = lastByGroup.get(gid);
    row.daysSinceLast = last ? Math.floor((now - new Date(last).getTime()) / 86400000) : null;
  }
  return [...acc.values()].sort((a, b) => b.totalSets - a.totalSets);
}
