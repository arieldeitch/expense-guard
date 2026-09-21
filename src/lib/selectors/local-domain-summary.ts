/**
 * useLocalDomainSummary — the home-screen snapshot computed from the user's REAL local data
 * (runs / home sessions / gym sessions / goals in localStorage), not from the mock repository.
 * Before ADR-0042 the launchpad tiles always said "no activity" because `activeRepo` is the
 * demo mock; the summary selector itself is reused unchanged.
 */
import { useMemo } from "react";
import type { Activity, Domain, Goal as RepoGoal } from "@/lib/repo";
import { computeDomainSummary, type DomainSummary } from "@/lib/selectors/domain-summary";
import { useAllRuns } from "@/lib/runs";
import { useHomeSessions } from "@/lib/home";
import { useAllSessions } from "@/lib/sessions";
import { listSessionEntries, listEntrySets } from "@/lib/home/repo";
import { computeSessionVolume } from "@/lib/sessions/calculations";
import { usePrimaryGoal, useGoalProgress } from "@/lib/goals";

export function useLocalDomainSummary(domain: Domain): DomainSummary {
  const runs = useAllRuns();
  const home = useHomeSessions();
  const gym = useAllSessions();
  const goal = usePrimaryGoal(domain);
  const progress = useGoalProgress(goal);

  return useMemo(() => {
    const activities: Activity[] = [];
    if (domain === "running") {
      for (const r of runs) {
        if (r.deleted_at || r.status !== "completed") continue;
        activities.push({
          id: r.id,
          domain,
          occurredAt: r.started_at,
          distanceM: r.distance_meters,
          durationS: r.duration_seconds,
          totalReps: null,
          paceSPerKm: r.average_pace_s_per_km,
        });
      }
    } else if (domain === "home") {
      for (const s of home) {
        if (s.deleted_at || (s.status !== "completed" && s.status !== "partial")) continue;
        let reps = 0;
        for (const e of listSessionEntries(s.id))
          for (const st of listEntrySets(e.id)) if (st.completed) reps += st.reps ?? 0;
        activities.push({
          id: s.id,
          domain,
          occurredAt: s.started_at,
          distanceM: null,
          durationS: s.duration_seconds,
          totalReps: reps || null,
          paceSPerKm: null,
        });
      }
    } else {
      for (const s of gym) {
        if (s.deleted_at || s.status !== "completed") continue;
        const v = computeSessionVolume(s.id);
        activities.push({
          id: s.id,
          domain,
          occurredAt: s.started_at,
          distanceM: null,
          durationS: s.duration_seconds,
          totalReps: v.totalReps || null,
          paceSPerKm: null,
        });
      }
    }
    const goals: RepoGoal[] =
      goal && goal.status === "active" && goal.target_value != null
        ? [
            {
              id: goal.id,
              domain,
              title: goal.name,
              targetValue: goal.target_value,
              targetUnit: goal.target_unit,
              currentValue: progress?.current_value ?? goal.current_value ?? 0,
              priority: goal.priority,
              status: "active",
            },
          ]
        : [];
    return computeDomainSummary(domain, activities, goals);
  }, [domain, runs, home, gym, goal, progress]);
}
