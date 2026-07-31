/**
 * Goals hooks — קורא מ־useSyncExternalStore + subscribers, מספק סלקטורים לרכיבים.
 *
 * חישוב progress מתבצע ב־hook לפי snapshot של activities מכל התחומים; זה
 * מבטיח שהמסך תמיד עדכני מיד לאחר autosave של פעילות חדשה.
 */
import { useSyncExternalStore, useMemo } from "react";
import { readGoalsState, readGoalsServerSnapshot, subscribeGoals } from "./storage";
import { useHydrated } from "@/lib/storage/useHydrated";
import {
  listGoals,
  listGoalsByDomain,
  getGoal,
  getPrimaryGoal,
  listSnapshots,
  listVersions,
} from "./repo";
import { calcGoalProgress, type CalcContext } from "./calculation";
import type { Goal, GoalDomain, GoalProgress } from "./types";
import { listRuns } from "@/lib/runs/repo";
import * as sessionsRepo from "@/lib/sessions/repo";
import * as homeRepo from "@/lib/home/repo";

function useGoalsState() {
  return useSyncExternalStore(subscribeGoals, readGoalsState, readGoalsServerSnapshot);
}

export function useAllGoals(includeTrash = false): Goal[] {
  useGoalsState();
  const hydrated = useHydrated();
  return hydrated ? listGoals(includeTrash) : [];
}

/** יעדים שנשלחו לסל — לשחזור מ-/trash. */
export function useTrashedGoals(): Goal[] {
  useGoalsState();
  const hydrated = useHydrated();
  if (!hydrated) return [];
  return listGoals(true).filter((g) => g.status === "trashed");
}

export function useGoalsByDomain(domain: GoalDomain, includeTrash = false): Goal[] {
  useGoalsState();
  const hydrated = useHydrated();
  return hydrated ? listGoalsByDomain(domain, includeTrash) : [];
}

export function useGoal(id: string | undefined): Goal | null {
  useGoalsState();
  const hydrated = useHydrated();
  if (!hydrated || !id) return null;
  return getGoal(id);
}

export function usePrimaryGoal(domain: GoalDomain): Goal | null {
  useGoalsState();
  const hydrated = useHydrated();
  return hydrated ? getPrimaryGoal(domain) : null;
}

/** מרכיב CalcContext ריאלי מכל ה־repositories. */
function buildCalcContext(domain: GoalDomain): CalcContext {
  if (domain === "running") {
    return { runs: listRuns() };
  }
  if (domain === "gym") {
    const sessions = sessionsRepo.listSessions(true);
    const exercises = sessions.flatMap((s) => sessionsRepo.listSessionExercises(s.id));
    const sets = exercises.flatMap((e) => sessionsRepo.listExerciseSets(e.id));
    return {
      strengthSessions: sessions,
      strengthSessionExercises: exercises,
      strengthSets: sets,
    };
  }
  // home
  const sessions = homeRepo.listAllHomeSessions();
  const entries = sessions.flatMap((s) => homeRepo.listSessionEntries(s.id));
  const sets = entries.flatMap((e) => homeRepo.listEntrySets(e.id));
  return { homeSessions: sessions, homeEntries: entries, homeSets: sets };
}

export function useGoalProgress(goal: Goal | null | undefined): GoalProgress | null {
  useGoalsState();
  const hydrated = useHydrated();
  // תלוי גם בקריאה של repositories אחרים — בעתיד ניתן להאזין ל־subscribe שלהם.
  return useMemo(() => {
    if (!hydrated || !goal) return null;
    const ctx = buildCalcContext(goal.domain);
    ctx.manualCurrent = goal.current_value;
    return calcGoalProgress(goal, ctx);
  }, [goal, hydrated]);
}

export function useGoalSnapshots(goalId: string | undefined) {
  useGoalsState();
  const hydrated = useHydrated();
  return hydrated && goalId ? listSnapshots(goalId) : [];
}

export function useGoalVersions(goalId: string | undefined) {
  useGoalsState();
  const hydrated = useHydrated();
  return hydrated && goalId ? listVersions(goalId) : [];
}

/** סופר יעדים פעילים לפי domain — לתצוגה של "עוד N יעדים". */
export function useActiveGoalsCount(domain: GoalDomain): number {
  useGoalsState();
  const hydrated = useHydrated();
  if (!hydrated) return 0;
  return listGoalsByDomain(domain).filter((g) => g.status === "active").length;
}
