/**
 * Goals repository — CRUD + lifecycle + versioning + snapshots.
 * כל mutation דרך commit() → אוטומטית נשמר ל־localStorage.
 *
 * חוקים:
 * - status transitions מותרים מפורטים ב־ALLOWED_TRANSITIONS.
 * - שינוי מהותי (name/target/type/…) מייצר GoalVersion חדש ומעלה version.
 * - snapshots לא נמחקים היסטורית — רק snapshots נוספים.
 * - סימון is_primary=true מבטל is_primary של יעדים אחרים באותו domain.
 * - achieved_at נקבע רק בסטטוס achieved.
 */
import type {
  Goal,
  GoalDomain,
  GoalFrozen,
  GoalProgress,
  GoalSnapshot,
  GoalStatus,
  GoalVersion,
  NewGoalInput,
} from "./types";
import { commit, readGoalsState, GOALS_OWNER_ID } from "./storage";
import { getGoalTypeSpec } from "./catalog";
import type { GoalActivityLink } from "./storage";

// ---------- Helpers ----------

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  const uuid = g.crypto?.randomUUID?.();
  if (uuid) return `${prefix}_${uuid}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function freeze(g: Goal): GoalFrozen {
  return {
    name: g.name,
    goal_type: g.goal_type,
    baseline_value: g.baseline_value,
    target_value: g.target_value,
    target_unit: g.target_unit,
    start_date: g.start_date,
    target_date: g.target_date,
    linked_exercise_id: g.linked_exercise_id,
    linked_route_id: g.linked_route_id,
    linked_treadmill_id: g.linked_treadmill_id,
    linked_template_id: g.linked_template_id,
    linked_metric: g.linked_metric,
    linked_period: g.linked_period,
    linked_extra_number: g.linked_extra_number,
    calculation_method: g.calculation_method,
    event_details: g.event_details,
  };
}

const MATERIAL_FIELDS: (keyof GoalFrozen)[] = [
  "name",
  "goal_type",
  "baseline_value",
  "target_value",
  "target_unit",
  "start_date",
  "target_date",
  "linked_exercise_id",
  "linked_route_id",
  "linked_treadmill_id",
  "linked_template_id",
  "linked_metric",
  "linked_period",
  "linked_extra_number",
  "calculation_method",
];

function diffFrozen(a: GoalFrozen, b: GoalFrozen): string[] {
  const changed: string[] = [];
  for (const k of MATERIAL_FIELDS) {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) changed.push(k as string);
  }
  return changed;
}

const ALLOWED_TRANSITIONS: Record<GoalStatus, GoalStatus[]> = {
  draft: ["active", "cancelled", "trashed"],
  active: ["paused", "achieved", "not_achieved", "cancelled", "archived", "trashed"],
  paused: ["active", "cancelled", "archived", "trashed"],
  achieved: ["active", "archived", "trashed"],
  not_achieved: ["active", "archived", "trashed"],
  cancelled: ["active", "archived", "trashed"],
  archived: ["active", "trashed"],
  trashed: ["active", "draft"],
};

function canTransition(from: GoalStatus, to: GoalStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// ---------- Reads ----------

export function listGoals(includeTrash = false): Goal[] {
  const s = readGoalsState();
  return includeTrash ? s.goals : s.goals.filter((g) => g.status !== "trashed");
}

export function listGoalsByDomain(domain: GoalDomain, includeTrash = false): Goal[] {
  return listGoals(includeTrash).filter((g) => g.domain === domain);
}

export function getGoal(id: string): Goal | null {
  return readGoalsState().goals.find((g) => g.id === id) ?? null;
}

export function listActiveGoals(domain?: GoalDomain): Goal[] {
  return listGoals().filter(
    (g) => g.status === "active" && (domain ? g.domain === domain : true),
  );
}

/** יעד ראשי — is_primary → priority עולה → target_date קרוב → created_at ישן. */
export function getPrimaryGoal(domain: GoalDomain): Goal | null {
  const active = listActiveGoals(domain);
  if (active.length === 0) return null;
  const primaryFlagged = active.filter((g) => g.is_primary);
  const pool = primaryFlagged.length > 0 ? primaryFlagged : active;
  const sorted = [...pool].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const ad = a.target_date ?? "9999-12-31";
    const bd = b.target_date ?? "9999-12-31";
    if (ad !== bd) return ad < bd ? -1 : 1;
    return a.created_at < b.created_at ? -1 : 1;
  });
  return sorted[0] ?? null;
}

export function listSnapshots(goalId: string): GoalSnapshot[] {
  return readGoalsState()
    .snapshots.filter((s) => s.goal_id === goalId)
    .sort((a, b) => (a.snapshot_at < b.snapshot_at ? -1 : 1));
}

export function listVersions(goalId: string): GoalVersion[] {
  return readGoalsState()
    .versions.filter((v) => v.goal_id === goalId)
    .sort((a, b) => a.version - b.version);
}

export function listActivityLinks(goalId: string): GoalActivityLink[] {
  return readGoalsState().activityLinks.filter(
    (l) => l.goal_id === goalId && l.deleted_at == null,
  );
}

// ---------- Mutations ----------

export function createGoal(input: NewGoalInput): Goal {
  const spec = getGoalTypeSpec(input.goal_type);
  const id = newId("goal");
  const now = nowIso();
  const goal: Goal = {
    id,
    user_id: GOALS_OWNER_ID,
    domain: spec.domain,
    goal_type: input.goal_type,
    name: input.name?.trim() || spec.label_he,
    description: input.description ?? null,
    baseline_value: input.baseline_value ?? null,
    current_value: input.current_value ?? null,
    target_value: input.target_value ?? null,
    target_unit: input.target_unit ?? spec.default_unit,
    start_date: input.start_date ?? now.slice(0, 10),
    target_date: input.target_date ?? null,
    linked_exercise_id: input.linked_exercise_id ?? null,
    linked_route_id: input.linked_route_id ?? null,
    linked_treadmill_id: input.linked_treadmill_id ?? null,
    linked_template_id: input.linked_template_id ?? null,
    linked_metric: input.linked_metric ?? null,
    linked_period: input.linked_period ?? spec.suggested_period ?? null,
    linked_extra_number: input.linked_extra_number ?? null,
    calculation_method: input.calculation_method ?? spec.calculation_method,
    direction: input.direction ?? spec.direction,
    event_details: input.event_details ?? null,
    status: input.status ?? "active",
    priority: input.priority ?? 1,
    is_primary: input.is_primary ?? false,
    display_preference: input.display_preference ?? "tile",
    auto_mark_achieved: input.auto_mark_achieved ?? false,
    version: 1,
    last_snapshot_at: null,
    created_at: now,
    updated_at: now,
    achieved_at: null,
    deleted_at: null,
  };
  commit((s) => {
    let goals = [...s.goals, goal];
    if (goal.is_primary) goals = clearPrimaryOthers(goals, goal.domain, goal.id);
    return { ...s, goals };
  });
  return goal;
}

function clearPrimaryOthers(goals: Goal[], domain: GoalDomain, keepId: string): Goal[] {
  return goals.map((g) =>
    g.domain === domain && g.id !== keepId && g.is_primary
      ? { ...g, is_primary: false, updated_at: nowIso() }
      : g,
  );
}

/** עדכון גנרי — מזהה שינוי מהותי ומייצר version חדש אם צריך. */
export function updateGoal(id: string, patch: Partial<Goal>, reason: string | null = null): Goal | null {
  const before = getGoal(id);
  if (!before) return null;
  const merged: Goal = { ...before, ...patch, id: before.id, updated_at: nowIso() };
  const changed = diffFrozen(freeze(before), freeze(merged));
  const isMaterial = changed.length > 0;
  const nextVersion = isMaterial ? before.version + 1 : before.version;
  const nextGoal: Goal = { ...merged, version: nextVersion };
  const version: GoalVersion | null = isMaterial
    ? {
        id: newId("gver"),
        goal_id: id,
        version: before.version,
        snapshot: freeze(before),
        changed_fields: changed,
        reason,
        created_at: nowIso(),
      }
    : null;
  commit((s) => {
    let goals = s.goals.map((g) => (g.id === id ? nextGoal : g));
    if (nextGoal.is_primary) goals = clearPrimaryOthers(goals, nextGoal.domain, nextGoal.id);
    return {
      ...s,
      goals,
      versions: version ? [...s.versions, version] : s.versions,
    };
  });
  return nextGoal;
}

export function setGoalStatus(id: string, status: GoalStatus, reason: string | null = null): Goal | null {
  const g = getGoal(id);
  if (!g) return null;
  if (!canTransition(g.status, status)) return null;
  const patch: Partial<Goal> = { status };
  if (status === "achieved") patch.achieved_at = nowIso();
  if (status === "trashed") patch.deleted_at = nowIso();
  return updateGoal(id, patch, reason);
}

export function markAchieved(id: string): Goal | null {
  return setGoalStatus(id, "achieved", "המשתמש סימן כהושג");
}

export function markNotAchieved(id: string): Goal | null {
  return setGoalStatus(id, "not_achieved", "המשתמש סימן כלא הושג");
}

export function pauseGoal(id: string): Goal | null {
  return setGoalStatus(id, "paused", "יעד הושהה");
}

export function resumeGoal(id: string): Goal | null {
  return setGoalStatus(id, "active", "יעד חזר לפעיל");
}

export function cancelGoal(id: string): Goal | null {
  return setGoalStatus(id, "cancelled", "יעד בוטל");
}

export function archiveGoal(id: string): Goal | null {
  return setGoalStatus(id, "archived", "יעד עבר לארכיון");
}

export function trashGoal(id: string): Goal | null {
  return setGoalStatus(id, "trashed", "יעד עבר לסל מחזור");
}

export function restoreGoal(id: string, to: GoalStatus = "active"): Goal | null {
  const g = getGoal(id);
  if (!g) return null;
  const patch: Partial<Goal> = { status: to, deleted_at: null };
  return updateGoal(id, patch, "יעד שוחזר");
}

export function setPrimary(id: string): Goal | null {
  return updateGoal(id, { is_primary: true }, "סומן כיעד ראשי");
}

export function unsetPrimary(id: string): Goal | null {
  return updateGoal(id, { is_primary: false }, "בוטל סימון יעד ראשי");
}

export function setManualCurrent(id: string, value: number | null): Goal | null {
  return updateGoal(id, { current_value: value }, "עדכון ידני של ערך נוכחי");
}

// ---------- Snapshots ----------

export function recordSnapshot(goalId: string, progress: GoalProgress): GoalSnapshot | null {
  const g = getGoal(goalId);
  if (!g) return null;
  const now = nowIso();
  const snap: GoalSnapshot = {
    id: newId("gsnap"),
    goal_id: goalId,
    snapshot_at: now,
    current_value: progress.current_value,
    progress_percentage: progress.progress_percentage,
    remaining_value: progress.remaining_value,
    days_remaining: progress.days_remaining,
    projected_value: progress.projected_value,
    projection_method: progress.projection_method,
    source_activity_ids: progress.source_activity_ids,
    calculation_details: progress.calculation_details,
    calculation_method: progress.calculation_method,
    formula_version: progress.formula_version,
    confidence_label: progress.confidence_label,
    created_at: now,
  };
  commit((s) => ({
    ...s,
    snapshots: [...s.snapshots, snap],
    goals: s.goals.map((x) =>
      x.id === goalId
        ? { ...x, current_value: progress.current_value, last_snapshot_at: now, updated_at: now }
        : x,
    ),
  }));
  return snap;
}

export function linkActivity(
  goalId: string,
  kind: GoalActivityLink["activity_kind"],
  activityId: string,
  by: GoalActivityLink["linked_by"] = "system",
): GoalActivityLink {
  const link: GoalActivityLink = {
    id: newId("glnk"),
    goal_id: goalId,
    activity_kind: kind,
    activity_id: activityId,
    linked_at: nowIso(),
    linked_by: by,
    deleted_at: null,
  };
  commit((s) => ({ ...s, activityLinks: [...s.activityLinks, link] }));
  return link;
}

// ---------- Duplicate ----------

export function duplicateGoal(id: string): Goal | null {
  const g = getGoal(id);
  if (!g) return null;
  return createGoal({
    ...g,
    id: undefined as unknown as string,
    name: `${g.name} (עותק)`,
    status: "draft",
    is_primary: false,
    current_value: null,
    achieved_at: null,
  } as NewGoalInput);
}
