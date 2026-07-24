/**
 * Session history — הצגת אימוני עבר כאריחים עם פילטרים ומיון.
 * derived fields: נפח, שיאים, שינוי מול אימון דומה קודם, קבוצות שריר עיקריות.
 */
import {
  listSessions,
  listSessionExercises,
  computeSessionVolume,
} from "@/lib/sessions";
import type { StrengthSession } from "@/lib/sessions";
import { getExercise } from "@/lib/exercises";
import type {
  SessionHistoryFilters,
  SessionHistorySort,
  SessionHistoryTile,
} from "./types";
import { countRealRecords } from "./records";
import { computeWorkoutQuality } from "./quality";

const HISTORY_STATUSES = new Set<StrengthSession["status"]>([
  "completed",
  "abandoned",
  "draft",
  "archived",
]);

export function buildSessionHistoryTile(session: StrengthSession): SessionHistoryTile {
  const vol = computeSessionVolume(session.id);
  const exs = listSessionExercises(session.id);
  const muscleIds = new Set<string>();
  for (const ex of exs) {
    if (ex.snapshot.primary_muscle_group_id) muscleIds.add(ex.snapshot.primary_muscle_group_id);
    else {
      const e = getExercise(ex.exercise_id);
      if (e?.primary_muscle_group_id) muscleIds.add(e.primary_muscle_group_id);
    }
  }
  const prCount = session.status === "completed" ? countRealRecords(session.id) : 0;
  const quality = session.status === "completed" ? computeWorkoutQuality(session.id).totalScore : null;
  const vsPrev = findSimilarPrevious(session);
  let vsPreviousSimilar: SessionHistoryTile["vsPreviousSimilar"] = null;
  if (vsPrev) {
    const prevVol = computeSessionVolume(vsPrev.id);
    vsPreviousSimilar = {
      sessionId: vsPrev.id,
      volumeDeltaKg: Math.round((vol.totalVolumeKg - prevVol.totalVolumeKg) * 10) / 10,
      volumeDeltaPercent:
        prevVol.totalVolumeKg > 0
          ? Math.round(((vol.totalVolumeKg - prevVol.totalVolumeKg) / prevVol.totalVolumeKg) * 1000) / 10
          : null,
      completionDelta:
        Math.round((vol.completionRate - computeSessionVolume(vsPrev.id).completionRate) * 1000) / 10,
    };
  }
  return {
    session,
    totalExercises: exs.length,
    totalSets: vol.totalSets,
    completedSets: vol.completedSets,
    totalReps: vol.totalReps,
    totalVolumeKg: vol.totalVolumeKg,
    completionRate: vol.completionRate,
    primaryMuscleGroupIds: Array.from(muscleIds),
    supersetsCount: vol.supersetsCount,
    personalRecordsCount: prCount,
    qualityScore: quality,
    status: session.status,
    vsPreviousSimilar,
  };
}

function findSimilarPrevious(session: StrengthSession): StrengthSession | null {
  const all = listSessions().filter(
    (s) =>
      s.id !== session.id &&
      s.status === "completed" &&
      !s.deleted_at &&
      new Date(s.started_at).getTime() < new Date(session.started_at).getTime(),
  );
  if (session.template_id) {
    const sameTpl = all.find((s) => s.template_id === session.template_id);
    if (sameTpl) return sameTpl;
  }
  return all[0] ?? null;
}

function passesFilters(tile: SessionHistoryTile, f: SessionHistoryFilters): boolean {
  const s = tile.session;
  if (f.from && s.started_at < f.from) return false;
  if (f.to && s.started_at > f.to) return false;
  if (f.templateId && s.template_id !== f.templateId) return false;
  if (f.locationId && s.location_id !== f.locationId) return false;
  if (f.onlyComplete && tile.completionRate < 1) return false;
  if (f.onlyPartial && (tile.completionRate === 1 || tile.completionRate === 0)) return false;
  if (f.onlyWithPRs && tile.personalRecordsCount === 0) return false;
  if (f.onlyWithNotes && !s.notes) return false;
  if (f.onlyWithQuality && tile.qualityScore == null) return false;
  if (f.onlyWithSupersets && tile.supersetsCount === 0) return false;
  if (f.exerciseId) {
    const exs = listSessionExercises(s.id);
    if (!exs.some((e) => e.exercise_id === f.exerciseId)) return false;
  }
  if (f.muscleGroupId) {
    if (!tile.primaryMuscleGroupIds.includes(f.muscleGroupId)) return false;
  }
  return true;
}

const SORTERS: Record<SessionHistorySort, (a: SessionHistoryTile, b: SessionHistoryTile) => number> =
  {
    date_desc: (a, b) => (a.session.started_at < b.session.started_at ? 1 : -1),
    date_asc: (a, b) => (a.session.started_at > b.session.started_at ? 1 : -1),
    duration_desc: (a, b) =>
      (b.session.duration_seconds ?? 0) - (a.session.duration_seconds ?? 0),
    volume_desc: (a, b) => b.totalVolumeKg - a.totalVolumeKg,
    completion_desc: (a, b) => b.completionRate - a.completionRate,
    pr_desc: (a, b) => b.personalRecordsCount - a.personalRecordsCount,
    quality_desc: (a, b) => (b.qualityScore ?? -1) - (a.qualityScore ?? -1),
  };

export function listSessionHistory(
  filters: SessionHistoryFilters = {},
  sort: SessionHistorySort = "date_desc",
): SessionHistoryTile[] {
  const sessions = listSessions().filter(
    (s) => !s.deleted_at && HISTORY_STATUSES.has(s.status),
  );
  const tiles = sessions.map(buildSessionHistoryTile).filter((t) => passesFilters(t, filters));
  tiles.sort(SORTERS[sort]);
  return tiles;
}
