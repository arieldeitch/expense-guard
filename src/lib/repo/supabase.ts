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
 *
 * Row shapes come from the generated `Database` type (R-35). There is no local
 * duplicate of the schema and no cast on the query result.
 */
import type { Database } from "@/integrations/supabase/types";
import type { Activity, Domain, Goal, Repository } from "./types";

type GoalRow = Database["public"]["Tables"]["goals"]["Row"];

/** The columns `listGoals` actually selects. Derived, never re-declared. */
export type GoalSummaryRow = Pick<
  GoalRow,
  "id" | "domain" | "name" | "target_value" | "target_unit" | "current_value" | "priority" | "status"
>;

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

/**
 * The generated type says `number | null`. PostgREST can still hand back a
 * `numeric` as a string depending on server configuration, so this coerces
 * rather than silently reporting 0 if that ever happens.
 */
function num(v: number | null): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v === null || v === undefined) return 0;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toRepoGoal(row: GoalSummaryRow): Goal | null {
  const status = toRepoStatus(row.status);
  if (status === null) return null;
  return {
    id: row.id,
    domain: row.domain as Domain,
    title: row.name,
    targetValue: num(row.target_value),
    targetUnit: row.target_unit ?? "",
    currentValue: num(row.current_value),
    priority: typeof row.priority === "number" ? row.priority : 1,
    status,
  };
}

async function client() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
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
        return data.map(toRepoGoal).filter((g): g is Goal => g !== null);
      } catch {
        return [];
      }
    },
  };
}
