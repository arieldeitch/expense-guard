/**
 * One-time, idempotent upload of local goals to Supabase.
 *
 * Split deliberately in two:
 *   * `planGoalUpload` is pure and deterministic — no network, no clock, no
 *     storage. Everything worth asserting is asserted against the plan.
 *   * `executeGoalUpload` performs the writes.
 *
 * Contract, inherited from LOCAL_TO_SUPABASE_MIGRATION_CONTRACT.md:
 *   * Record identity survives. The local `id` is the cloud primary key; ids
 *     are never regenerated.
 *   * Cloud ownership comes ONLY from the authenticated user id. The local
 *     `user_id` ("single-user") is kept under source_metadata as documentation
 *     and is never an authorisation authority.
 *   * Re-running is a no-op: the same input produces the same op ids, and the
 *     write uses ignoreDuplicates so an existing row is never overwritten.
 *   * Secrets never travel.
 */
import type { Goal } from "@/lib/goals/types";
import { checksumOf, stableStringify } from "@/lib/storage/checksum";

export const GOALS_SYNC_MODULE = "goals";

/** Never leaves the device, even if some future local field is named this way. */
const FORBIDDEN_FIELD_PATTERN =
  /(^|_)(token|secret|password|passwd|api_?key|access_?key|service_?role|session_?token|bearer|credential)s?($|_)/i;

export interface CloudGoalRow {
  id: string;
  user_id: string;
  domain: string;
  goal_type: string;
  name: string;
  status: string;
  priority: number;
  is_primary: boolean;
  target_value: number | null;
  target_unit: string | null;
  current_value: number | null;
  version: number;
  payload: Record<string, unknown>;
  source_metadata: Record<string, unknown>;
  content_checksum: string;
  op_id: string;
  client_created_at: string | null;
  client_updated_at: string | null;
}

export interface SkippedGoal {
  id: string;
  reason: "already_uploaded" | "missing_id" | "unknown_domain";
}

export interface GoalUploadPlan {
  /** Rows to write, ordered deterministically by id. */
  rows: CloudGoalRow[];
  skipped: SkippedGoal[];
  /** Deterministic — same input always yields the same ids, in the same order. */
  operationIds: string[];
  authenticatedUserId: string;
  /** Local owner values found in the file and rejected as authority. */
  ignoredSourceOwners: string[];
}

const VALID_DOMAINS = new Set(["running", "gym", "home"]);

function stripSecrets(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    if (FORBIDDEN_FIELD_PATTERN.test(k)) continue;
    out[k] = v;
  }
  return out;
}

function numberOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Maps one local goal to its cloud row. `authenticatedUserId` is the ONLY
 * source of ownership.
 */
export function toCloudGoalRow(goal: Goal, authenticatedUserId: string): CloudGoalRow {
  const payload = stripSecrets(JSON.parse(JSON.stringify(goal)) as Record<string, unknown>);
  // The local owner is documentation only; it must not appear as authority.
  delete payload["user_id"];

  const content_checksum = checksumOf(payload);

  return {
    id: goal.id,
    user_id: authenticatedUserId,
    domain: goal.domain,
    goal_type: goal.goal_type,
    name: goal.name,
    status: goal.status,
    priority: typeof goal.priority === "number" ? goal.priority : 1,
    is_primary: Boolean(goal.is_primary),
    target_value: numberOrNull(goal.target_value),
    target_unit: goal.target_unit ?? null,
    current_value: numberOrNull(goal.current_value),
    version: typeof goal.version === "number" ? goal.version : 1,
    payload,
    source_metadata: { source_owner_id: goal.user_id ?? null, source: "localStorage" },
    content_checksum,
    // Deterministic: derived from the stable id and the content, never a counter.
    op_id: `${GOALS_SYNC_MODULE}#${goal.id}#${content_checksum}`,
    client_created_at: goal.created_at ?? null,
    client_updated_at: goal.updated_at ?? null,
  };
}

export interface PlanGoalUploadInput {
  goals: readonly Goal[];
  authenticatedUserId: string;
  /** Ids already confirmed in the cloud for this user — skipped, not rewritten. */
  alreadyUploaded?: ReadonlySet<string>;
}

/**
 * Pure. Same input → identical plan, including ordering.
 */
export function planGoalUpload(input: PlanGoalUploadInput): GoalUploadPlan {
  const { goals, authenticatedUserId } = input;
  const alreadyUploaded = input.alreadyUploaded ?? new Set<string>();

  const rows: CloudGoalRow[] = [];
  const skipped: SkippedGoal[] = [];
  const ignoredOwners = new Set<string>();
  const seen = new Set<string>();

  // Sort by stable id so the plan is order-independent w.r.t. local state.
  const ordered = [...goals].sort((a, b) => String(a?.id ?? "").localeCompare(String(b?.id ?? "")));

  for (const goal of ordered) {
    const id = goal?.id;
    if (typeof id !== "string" || id.length === 0) {
      skipped.push({ id: "", reason: "missing_id" });
      continue;
    }
    if (seen.has(id)) continue; // duplicate id inside the local file — write once
    seen.add(id);

    if (!VALID_DOMAINS.has(goal.domain)) {
      skipped.push({ id, reason: "unknown_domain" });
      continue;
    }
    if (alreadyUploaded.has(id)) {
      skipped.push({ id, reason: "already_uploaded" });
      continue;
    }
    if (typeof goal.user_id === "string" && goal.user_id.length > 0) {
      ignoredOwners.add(goal.user_id);
    }
    rows.push(toCloudGoalRow(goal, authenticatedUserId));
  }

  return {
    rows,
    skipped,
    operationIds: rows.map((r) => r.op_id),
    authenticatedUserId,
    ignoredSourceOwners: [...ignoredOwners].sort(),
  };
}

/** Stable fingerprint of a plan — two runs over the same data must match. */
export function planFingerprint(plan: GoalUploadPlan): string {
  return checksumOf(plan.rows.map((r) => ({ id: r.id, op_id: r.op_id })));
}

export interface GoalUploadResult {
  ok: boolean;
  attempted: number;
  written: number;
  skipped: number;
  /** Ids now confirmed present in the cloud (written this run or already there). */
  confirmedIds: string[];
  error: string | null;
}

/** The narrow slice of the Supabase client this module needs. Keeps tests honest. */
export interface GoalUploadClient {
  upsertGoals: (rows: CloudGoalRow[]) => Promise<{ error: string | null }>;
  listGoalIds: () => Promise<{ ids: string[]; error: string | null }>;
}

/**
 * Executes a plan.
 *
 * Writes use insert-if-absent semantics (`ignoreDuplicates`), so an existing
 * cloud row is NEVER overwritten and a re-run is a genuine no-op. Local data is
 * not touched at any point — success only adds a marker in the sync state.
 */
export async function executeGoalUpload(
  plan: GoalUploadPlan,
  client: GoalUploadClient,
): Promise<GoalUploadResult> {
  if (plan.rows.length === 0) {
    const existing = await client.listGoalIds();
    return {
      ok: existing.error === null,
      attempted: 0,
      written: 0,
      skipped: plan.skipped.length,
      confirmedIds: existing.ids,
      error: existing.error,
    };
  }

  const { error } = await client.upsertGoals(plan.rows);
  if (error) {
    return {
      ok: false,
      attempted: plan.rows.length,
      written: 0,
      skipped: plan.skipped.length,
      confirmedIds: [],
      error,
    };
  }

  // Confirm by reading back, rather than trusting the write.
  const after = await client.listGoalIds();
  if (after.error) {
    return {
      ok: false,
      attempted: plan.rows.length,
      written: 0,
      skipped: plan.skipped.length,
      confirmedIds: [],
      error: after.error,
    };
  }

  const confirmed = new Set(after.ids);
  const written = plan.rows.filter((r) => confirmed.has(r.id)).length;
  return {
    ok: written === plan.rows.length,
    attempted: plan.rows.length,
    written,
    skipped: plan.skipped.length,
    confirmedIds: [...confirmed].sort(),
    error: written === plan.rows.length ? null : "חלק מהיעדים לא נכתבו לענן.",
  };
}

/** Exposed for tests that assert nothing secret ever reaches a payload. */
export function payloadContainsSecret(row: CloudGoalRow): boolean {
  return /("(?:[a-z_]*)(token|secret|password|api_?key|service_?role|credential)[a-z_]*")/i.test(
    stableStringify(row),
  );
}
