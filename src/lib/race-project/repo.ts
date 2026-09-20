import { useSyncExternalStore } from "react";
import {
  readRunsState,
  readRunsServerSnapshot,
  subscribeRuns,
  writeRunsState,
} from "@/lib/runs/storage";
import {
  DEFAULT_SETTINGS,
  INITIAL_RACES,
  createWeek,
  type CoachSettings,
  type Race,
  type WeekPlan,
} from "./model";
export function useRaceProject() {
  const state = useSyncExternalStore(subscribeRuns, readRunsState, readRunsServerSnapshot);
  return {
    settings: state.coachSettings?.[0] ?? DEFAULT_SETTINGS,
    races: state.races ?? INITIAL_RACES,
    weeks: state.trainingWeeks ?? [],
  };
}
export function saveSettings(settings: CoachSettings) {
  writeRunsState({ ...readRunsState(), coachSettings: [settings] });
}
export function saveRaces(races: Race[]) {
  writeRunsState({ ...readRunsState(), races });
}
export function ensureWeek(start: string): WeekPlan {
  const s = readRunsState();
  const found = s.trainingWeeks?.find((w) => w.id === start);
  if (found) return found;
  const week = createWeek(
    start,
    s.coachSettings?.[0] ?? DEFAULT_SETTINGS,
    s.races ?? INITIAL_RACES,
    s.runs,
  );
  writeRunsState({ ...s, trainingWeeks: [...(s.trainingWeeks ?? []), week] });
  return week;
}
/**
 * Day edits, accept and reject update the week in place. A revision (the previous version)
 * is recorded only when `snapshotPrevious` is set — i.e. on explicit regeneration — so the
 * history lists real versions of the recommendation, not every keystroke.
 */
export function updateWeek(week: WeekPlan, options: { snapshotPrevious?: boolean } = {}) {
  const s = readRunsState();
  const prev = s.trainingWeeks?.find((w) => w.id === week.id);
  const now = new Date().toISOString();
  const revisions = prev?.revisions ?? week.revisions ?? [];
  const next = {
    ...week,
    updated_at: now,
    revisions:
      prev && options.snapshotPrevious
        ? [...revisions, { at: now, days: prev.days, status: prev.status }]
        : revisions,
  };
  writeRunsState({
    ...s,
    trainingWeeks: [...(s.trainingWeeks ?? []).filter((w) => w.id !== week.id), next],
  });
}
export function regenerateWeek(start: string) {
  const s = readRunsState();
  updateWeek(
    createWeek(start, s.coachSettings?.[0] ?? DEFAULT_SETTINGS, s.races ?? INITIAL_RACES, s.runs),
    { snapshotPrevious: true },
  );
}
