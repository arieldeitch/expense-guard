/**
 * Supabase repository adapter — implements the SAME `Repository` contract the
 * mock implements, so no UI changes.
 *
 * Phase 1 boundary, stated plainly rather than hidden:
 *   * `listGoals` is cloud-backed.
 *   * `listActivities` / `listAllActivities` return [] because Phase 1 creates
 *     no activities table. That is byte-identical to what the mock repository
 *     returns today (it is empty unless demo mode is on), so nothing regresses.
 *     Sessions, runs and templates reach the cloud in a later phase.
 *
 * Every read is scoped by RLS to auth.uid(); this file never filters by user
 * itself, because a client-side filter is not a security boundary.
 */
import type { Activity, Domain, Goal, Repository } from "./types";

/** Only these three map onto the repository contract's narrow status set. */
function toRepoStatus(status: string): Goal["status"] | null {
  switch (status) {
    case "draft":
    case "active":
      return "active";
    case "achieved":
      return "achieved";
    case "paused":
      return "paused";
    // cancelled / not_achieved / archived / trashed are not surfaced here.
    default:
      return null;
  }
}

interface CloudGoalRowShape {
  id: string;
  domain: string;
  name: string | null;
  target_value: number | string | null;
  target_unit: string | null;
  current_value: number | string | null;
  priority: number | null;
  status: string;
}

/** `numeric` comes back from PostgREST as a string; coerce without losing null. */
function num(v: number | string | null | undefined): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function toRepoGoal(row: CloudGoalRowShape): Goal | null {
  const status = toRepoStatus(row.status);
  if (status === null) return null;
  return {
    id: row.id,
    domain: row.domain as Domain,
    title: row.name ?? "",
    targetValue: num(row.target_value),
    targetUnit: row.target_unit ?? "",
    currentValue: num(row.current_value),
    priority: typeof row.priority === "number" ? row.priority : 1,
    status,
  };
}

async function client() {
  const { phase1Client } = await import("@/lib/supabase/tables");
  return phase1Client();
}

/**
 * Reads never throw. A network or auth failure degrades to an empty result so
 * the surrounding screen keeps rendering — the app must survive Supabase being
 * unavailable.
 */
export function createSupabaseRepository(): Repository {
  return {
    async listActivities(_domain: Domain): Promise<Activity[]> {
      return [];
    },

    async listAllActivities(): Promise<Activity[]> {
      return [];
    },

    async listGoals(domain: Domain): Promise<Goal[]> {
      try {
        const supabase = await client();
        const { data, error } = await supabase
          .from("goals")
          .select("id, domain, name, target_value, target_unit, current_value, priority, status")
          .eq("domain", domain)
          .order("priority", { ascending: true })
          .order("id", { ascending: true });

        if (error || !Array.isArray(data)) return [];
        return (data as unknown as CloudGoalRowShape[])
          .map(toRepoGoal)
          .filter((g): g is Goal => g !== null);
      } catch {
        return [];
      }
    },
  };
}
