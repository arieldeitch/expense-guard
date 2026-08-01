/**
 * Sync entrypoint — the one-time, idempotent upload of local goals.
 *
 * What this never does: clear, replace, move or remove any `fitlog:*` domain
 * key. A successful upload only writes a marker under `fitlog:sync-state:v1`.
 * The export/backup path is completely unaffected.
 */
import { listGoals } from "@/lib/goals/repo";
import { getAuthState } from "@/lib/supabase/session";
import {
  executeGoalUpload,
  planGoalUpload,
  GOALS_SYNC_MODULE,
  type CloudGoalRow,
  type GoalUploadClient,
  type GoalUploadResult,
} from "./goalsUpload";
import { readSyncStateFor, recordModuleUpload, uploadedIdsFor, type SyncState } from "./state";

export * from "./state";
export * from "./goalsUpload";

/** Real client. Isolated here so every other module stays network-free. */
export function createSupabaseGoalUploadClient(): GoalUploadClient {
  const load = async () => (await import("@/lib/supabase/tables")).phase1Client();

  return {
    async upsertGoals(rows: CloudGoalRow[]) {
      try {
        const supabase = await load();
        const { upsertGoals } = await import("@/lib/supabase/tables");
        // Insert-if-absent: an existing cloud row is never overwritten, and a
        // re-run of the same upload is a genuine no-op.
        return upsertGoals(supabase, rows);
      } catch (e) {
        return { error: e instanceof Error ? e.message : "upload failed" };
      }
    },

    async listGoalIds() {
      try {
        const supabase = await load();
        const { selectGoalIds } = await import("@/lib/supabase/tables");
        return selectGoalIds(supabase);
      } catch (e) {
        return { ids: [], error: e instanceof Error ? e.message : "read failed" };
      }
    },
  };
}

export interface OneTimeUploadOutcome {
  ran: boolean;
  reason: "not_signed_in" | "nothing_to_upload" | "uploaded" | "failed";
  result: GoalUploadResult | null;
  state: SyncState | null;
}

/**
 * Runs the upload for the signed-in user. Safe to call repeatedly: ids already
 * recorded as uploaded are skipped, and the write itself is insert-if-absent.
 */
export async function runOneTimeGoalUpload(
  client: GoalUploadClient = createSupabaseGoalUploadClient(),
  now: () => string = () => new Date().toISOString(),
): Promise<OneTimeUploadOutcome> {
  const auth = await getAuthState();
  if (auth.kind !== "signed_in") {
    return { ran: false, reason: "not_signed_in", result: null, state: null };
  }

  const userId = auth.userId;
  const plan = planGoalUpload({
    goals: listGoals(),
    authenticatedUserId: userId,
    alreadyUploaded: uploadedIdsFor(userId, GOALS_SYNC_MODULE),
  });

  if (plan.rows.length === 0) {
    return {
      ran: false,
      reason: "nothing_to_upload",
      result: null,
      state: readSyncStateFor(userId),
    };
  }

  const result = await executeGoalUpload(plan, client);
  const uploadedNow = plan.rows.map((r) => r.id).filter((id) => result.confirmedIds.includes(id));
  const outcome = result.ok ? "ok" : uploadedNow.length > 0 ? "partial" : "failed";

  const state = recordModuleUpload(
    userId,
    GOALS_SYNC_MODULE,
    uploadedNow,
    outcome,
    now(),
    result.error,
  );

  return {
    ran: true,
    reason: result.ok ? "uploaded" : "failed",
    result,
    state,
  };
}
