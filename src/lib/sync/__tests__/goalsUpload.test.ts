// @vitest-environment jsdom
/**
 * Phase 1 sync — plan determinism, idempotency, duplicate prevention,
 * ownership authority, secret containment, and no-overwrite semantics.
 *
 * No network, no Supabase client, no real clock.
 */
import { beforeEach, describe, expect, it } from "vitest";
import type { Goal } from "@/lib/goals/types";
import {
  GOALS_SYNC_MODULE,
  executeGoalUpload,
  planFingerprint,
  planGoalUpload,
  payloadContainsSecret,
  toCloudGoalRow,
  type CloudGoalRow,
  type GoalUploadClient,
} from "../goalsUpload";
import {
  _resetSyncStateForTests,
  readSyncStateFor,
  recordModuleUpload,
  uploadedIdsFor,
} from "../state";

const AUTH_USER = "11111111-2222-3333-4444-555555555555";

function goal(over: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    user_id: "single-user",
    domain: "running",
    goal_type: "run_distance_total",
    name: "20 ק״מ בשבוע",
    description: null,
    baseline_value: null,
    current_value: 12,
    target_value: 20,
    target_unit: "ק״מ",
    start_date: null,
    target_date: null,
    linked_exercise_id: null,
    linked_route_id: null,
    linked_treadmill_id: null,
    linked_template_id: null,
    linked_metric: null,
    linked_period: null,
    linked_extra_number: null,
    calculation_method: "sum",
    direction: "up",
    event_details: null,
    status: "active",
    priority: 1,
    is_primary: true,
    display_preference: "tile",
    auto_mark_achieved: false,
    version: 1,
    last_snapshot_at: null,
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-02T00:00:00.000Z",
    ...over,
  } as Goal;
}

/** In-memory stand-in with the real no-overwrite semantics. */
function fakeClient(seed: CloudGoalRow[] = []) {
  const rows = new Map<string, CloudGoalRow>(seed.map((r) => [r.id, r]));
  const writes: string[][] = [];
  return {
    rows,
    writes,
    client: {
      async upsertGoals(incoming: CloudGoalRow[]) {
        writes.push(incoming.map((r) => r.id));
        for (const r of incoming) {
          // ignoreDuplicates: existing rows are left exactly as they are.
          if (!rows.has(r.id)) rows.set(r.id, r);
        }
        return { error: null };
      },
      async listGoalIds() {
        return { ids: [...rows.keys()], error: null };
      },
    } satisfies GoalUploadClient,
  };
}

describe("planGoalUpload — identity and ownership", () => {
  it("keeps the local id as the cloud primary key", () => {
    const plan = planGoalUpload({ goals: [goal({ id: "stable-abc" })], authenticatedUserId: AUTH_USER });
    expect(plan.rows).toHaveLength(1);
    expect(plan.rows[0].id).toBe("stable-abc");
  });

  it("takes ownership ONLY from the authenticated user, never from the file", () => {
    const plan = planGoalUpload({
      goals: [goal({ user_id: "single-user" })],
      authenticatedUserId: AUTH_USER,
    });
    expect(plan.rows[0].user_id).toBe(AUTH_USER);
    expect(plan.ignoredSourceOwners).toEqual(["single-user"]);
  });

  it("keeps the local owner as documentation only, never as authority", () => {
    const row = toCloudGoalRow(goal({ user_id: "single-user" }), AUTH_USER);
    expect(row.source_metadata.source_owner_id).toBe("single-user");
    expect(row.payload).not.toHaveProperty("user_id");
  });
});

describe("planGoalUpload — determinism", () => {
  it("produces an identical plan for the same input regardless of input order", () => {
    const a = goal({ id: "a" });
    const b = goal({ id: "b" });
    const c = goal({ id: "c" });
    const p1 = planGoalUpload({ goals: [a, b, c], authenticatedUserId: AUTH_USER });
    const p2 = planGoalUpload({ goals: [c, a, b], authenticatedUserId: AUTH_USER });
    expect(p1.operationIds).toEqual(p2.operationIds);
    expect(planFingerprint(p1)).toBe(planFingerprint(p2));
  });

  it("derives operation ids from content, not from a running counter", () => {
    const p = planGoalUpload({ goals: [goal({ id: "x" })], authenticatedUserId: AUTH_USER });
    expect(p.operationIds[0]).toMatch(/^goals#x#/);
    const again = planGoalUpload({ goals: [goal({ id: "x" })], authenticatedUserId: AUTH_USER });
    expect(again.operationIds[0]).toBe(p.operationIds[0]);
  });

  it("changes the operation id when the content changes", () => {
    const p1 = planGoalUpload({ goals: [goal({ id: "x", name: "one" })], authenticatedUserId: AUTH_USER });
    const p2 = planGoalUpload({ goals: [goal({ id: "x", name: "two" })], authenticatedUserId: AUTH_USER });
    expect(p1.operationIds[0]).not.toBe(p2.operationIds[0]);
  });
});

describe("planGoalUpload — duplicate prevention and rejection", () => {
  it("writes a repeated local id only once", () => {
    const plan = planGoalUpload({
      goals: [goal({ id: "dup" }), goal({ id: "dup", name: "other" })],
      authenticatedUserId: AUTH_USER,
    });
    expect(plan.rows.filter((r) => r.id === "dup")).toHaveLength(1);
  });

  it("skips ids already recorded as uploaded", () => {
    const plan = planGoalUpload({
      goals: [goal({ id: "old" }), goal({ id: "new" })],
      authenticatedUserId: AUTH_USER,
      alreadyUploaded: new Set(["old"]),
    });
    expect(plan.rows.map((r) => r.id)).toEqual(["new"]);
    expect(plan.skipped).toContainEqual({ id: "old", reason: "already_uploaded" });
  });

  it("rejects a goal without a stable id instead of inventing one", () => {
    const plan = planGoalUpload({
      goals: [goal({ id: "" as unknown as string })],
      authenticatedUserId: AUTH_USER,
    });
    expect(plan.rows).toHaveLength(0);
    expect(plan.skipped[0].reason).toBe("missing_id");
  });

  it("reports an unknown domain rather than swallowing it", () => {
    const plan = planGoalUpload({
      goals: [goal({ domain: "swimming" as unknown as Goal["domain"] })],
      authenticatedUserId: AUTH_USER,
    });
    expect(plan.rows).toHaveLength(0);
    expect(plan.skipped[0].reason).toBe("unknown_domain");
  });
});

describe("secrets", () => {
  it("never carries a secret-shaped field into the payload", () => {
    const dirty = goal({ id: "s" }) as unknown as Record<string, unknown>;
    dirty["access_token"] = "should-not-travel";
    dirty["api_key"] = "nope";
    const row = toCloudGoalRow(dirty as unknown as Goal, AUTH_USER);
    expect(row.payload).not.toHaveProperty("access_token");
    expect(row.payload).not.toHaveProperty("api_key");
    expect(payloadContainsSecret(row)).toBe(false);
    expect(JSON.stringify(row)).not.toContain("should-not-travel");
  });
});

describe("executeGoalUpload — idempotency and no silent overwrite", () => {
  it("writes new rows and confirms them by reading back", async () => {
    const { client, rows } = fakeClient();
    const plan = planGoalUpload({ goals: [goal({ id: "g1" })], authenticatedUserId: AUTH_USER });
    const result = await executeGoalUpload(plan, client);
    expect(result.ok).toBe(true);
    expect(result.written).toBe(1);
    expect(rows.has("g1")).toBe(true);
  });

  it("is a genuine no-op on a second identical run", async () => {
    const { client, rows } = fakeClient();
    const plan = planGoalUpload({ goals: [goal({ id: "g1" })], authenticatedUserId: AUTH_USER });
    await executeGoalUpload(plan, client);
    const before = rows.size;
    const second = await executeGoalUpload(plan, client);
    expect(second.ok).toBe(true);
    expect(rows.size).toBe(before);
  });

  it("does NOT overwrite an existing cloud row that differs", async () => {
    const existing = toCloudGoalRow(goal({ id: "g1", name: "cloud wins" }), AUTH_USER);
    const { client, rows } = fakeClient([existing]);
    const plan = planGoalUpload({
      goals: [goal({ id: "g1", name: "local version" })],
      authenticatedUserId: AUTH_USER,
    });
    await executeGoalUpload(plan, client);
    expect(rows.get("g1")?.name).toBe("cloud wins");
  });

  it("reports failure without claiming success when the write errors", async () => {
    const failing: GoalUploadClient = {
      async upsertGoals() {
        return { error: "permission denied" };
      },
      async listGoalIds() {
        return { ids: [], error: null };
      },
    };
    const plan = planGoalUpload({ goals: [goal({ id: "g1" })], authenticatedUserId: AUTH_USER });
    const result = await executeGoalUpload(plan, failing);
    expect(result.ok).toBe(false);
    expect(result.written).toBe(0);
    expect(result.error).toBe("permission denied");
  });
});

describe("sync state — separate from domain data", () => {
  beforeEach(() => {
    localStorage.clear();
    _resetSyncStateForTests();
  });

  it("records uploaded ids without touching any domain key", () => {
    localStorage.setItem("fitlog:goals:v1", JSON.stringify({ goals: [], snapshots: [], versions: [], activityLinks: [] }));
    const before = localStorage.getItem("fitlog:goals:v1");

    recordModuleUpload(AUTH_USER, GOALS_SYNC_MODULE, ["g1"], "ok", "2026-08-01T00:00:00.000Z");

    expect(localStorage.getItem("fitlog:goals:v1")).toBe(before);
    expect(uploadedIdsFor(AUTH_USER, GOALS_SYNC_MODULE).has("g1")).toBe(true);
  });

  it("accumulates ids across retries instead of forgetting earlier successes", () => {
    recordModuleUpload(AUTH_USER, GOALS_SYNC_MODULE, ["a"], "partial", "2026-08-01T00:00:00.000Z");
    recordModuleUpload(AUTH_USER, GOALS_SYNC_MODULE, ["b"], "ok", "2026-08-01T00:01:00.000Z");
    const ids = uploadedIdsFor(AUTH_USER, GOALS_SYNC_MODULE);
    expect([...ids].sort()).toEqual(["a", "b"]);
  });

  it("does not leak one user's uploaded ids to another user", () => {
    recordModuleUpload(AUTH_USER, GOALS_SYNC_MODULE, ["a"], "ok", "2026-08-01T00:00:00.000Z");
    const other = readSyncStateFor("99999999-0000-0000-0000-000000000000");
    expect(other.modules[GOALS_SYNC_MODULE]).toBeUndefined();
    expect(other.status).toBe("not_synced");
  });

  it("keeps the sync key out of the domain key space used by backup", () => {
    recordModuleUpload(AUTH_USER, GOALS_SYNC_MODULE, ["a"], "ok", "2026-08-01T00:00:00.000Z");
    expect(localStorage.getItem("fitlog:sync-state:v1")).not.toBeNull();
    // The nine domain modules are untouched by sync.
    expect(localStorage.getItem("fitlog:goals:v1")).toBeNull();
  });
});
