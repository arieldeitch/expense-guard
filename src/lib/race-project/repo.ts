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
export function updateWeek(week: WeekPlan) {
  const s = readRunsState();
  const prev = s.trainingWeeks?.find((w) => w.id === week.id);
  const now = new Date().toISOString();
  const next = {
    ...week,
    updated_at: now,
    revisions: prev ? [...prev.revisions, { at: now, days: prev.days, status: prev.status }] : [],
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
  );
}
