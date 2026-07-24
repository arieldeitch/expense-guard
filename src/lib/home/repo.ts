/**
 * Home repository — CRUD + business actions.
 * כל mutation שומרת מיידית ל־localStorage דרך commit(). Autosave מובנה.
 */
import { getExercise } from "@/lib/exercises";
import type { TrackingType } from "@/lib/exercises";
import type { WeightUnit } from "@/lib/templates";
import { commit, HOME_OWNER_ID, readHomeState } from "./storage";
import type {
  HomeExerciseEntry,
  HomeExerciseEntrySnapshot,
  HomeExerciseSet,
  HomeSession,
  HomeSessionStatus,
  HomeSetType,
  HomeTemplate,
  HomeTemplateEntry,
  HomeTemplateSnapshot,
  HomeTemplateStatus,
  HomeTemplateVersion,
  NewHomeSessionInput,
  QuickEntryInput,
} from "./types";

// ---------- helpers ----------
function nowIso() {
  return new Date().toISOString();
}
function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
function tz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function buildEntrySnapshot(
  exerciseId: string,
  overrides: Partial<HomeExerciseEntrySnapshot> = {},
): HomeExerciseEntrySnapshot {
  const ex = getExercise(exerciseId);
  const base: HomeExerciseEntrySnapshot = {
    exercise_id: exerciseId,
    exercise_name: ex?.name_he ?? "תרגיל",
    tracking_type: (ex?.tracking_type ?? "reps_only") as TrackingType,
    unilateral: ex?.unilateral ?? false,
    primary_muscle_group_id: ex?.primary_muscle_group_id ?? null,
    planned_sets: ex?.default_sets ?? 3,
    planned_reps: ex?.default_reps ?? null,
    planned_reps_min: ex?.default_rep_range_min ?? null,
    planned_reps_max: ex?.default_rep_range_max ?? null,
    planned_duration_seconds: null,
    planned_added_weight: null,
    weight_unit: "kg" as WeightUnit,
    rest_seconds: ex?.default_rest_seconds ?? null,
    notes: null,
  };
  return { ...base, ...overrides };
}

// ---------- Sessions ----------

export function listHomeSessions(): HomeSession[] {
  return readHomeState().sessions.filter((s) => !s.deleted_at);
}

export function listAllHomeSessions(): HomeSession[] {
  return readHomeState().sessions;
}

export function getHomeSession(id: string): HomeSession | null {
  return readHomeState().sessions.find((s) => s.id === id) ?? null;
}

export function listActiveHomeDrafts(): HomeSession[] {
  return listHomeSessions().filter(
    (s) => s.status === "draft" || s.status === "in_progress" || s.status === "paused",
  );
}

export function createHomeSession(input: NewHomeSessionInput = {}): HomeSession {
  const t = nowIso();
  const session: HomeSession = {
    id: newId(),
    owner_id: HOME_OWNER_ID,
    template_id: input.template_id ?? null,
    template_version: input.template_version ?? null,
    template_snapshot: input.template_snapshot ?? null,
    primary_exercise_id: input.primary_exercise_id ?? null,
    is_quick_entry: input.is_quick_entry ?? false,
    name: input.name ?? "אימון בית",
    started_at: t,
    ended_at: null,
    timezone: tz(),
    duration_seconds: null,
    status: "in_progress",
    notes: input.notes ?? null,
    perceived_effort: null,
    self_reported_quality: null,
    quality_score: null,
    quality_score_details: null,
    data_completeness: null,
    created_at: t,
    updated_at: t,
    deleted_at: null,
  };
  commit((s) => ({ ...s, sessions: [...s.sessions, session] }));
  return session;
}

export function updateHomeSession(
  id: string,
  patch: Partial<Omit<HomeSession, "id" | "created_at">>,
): HomeSession | null {
  let updated: HomeSession | null = null;
  commit((s) => ({
    ...s,
    sessions: s.sessions.map((sess) => {
      if (sess.id !== id) return sess;
      updated = { ...sess, ...patch, updated_at: nowIso() };
      return updated;
    }),
  }));
  return updated;
}

export function setHomeSessionStatus(id: string, status: HomeSessionStatus): void {
  updateHomeSession(id, { status });
}

/** מסיים session ומחשב duration. אינו כותב quality_score — משאיר ל־consumer. */
export function completeHomeSession(
  id: string,
  opts: { status?: "completed" | "partial" | "abandoned" } = {},
): HomeSession | null {
  const s = getHomeSession(id);
  if (!s) return null;
  const ended = nowIso();
  const dur = Math.max(
    0,
    Math.round((new Date(ended).getTime() - new Date(s.started_at).getTime()) / 1000),
  );
  return updateHomeSession(id, {
    status: opts.status ?? "completed",
    ended_at: ended,
    duration_seconds: dur,
  });
}

export function trashHomeSession(id: string): void {
  updateHomeSession(id, { status: "trashed", deleted_at: nowIso() });
}
export function restoreHomeSession(id: string): void {
  updateHomeSession(id, { status: "completed", deleted_at: null });
}
export function archiveHomeSession(id: string): void {
  updateHomeSession(id, { status: "archived" });
}

// ---------- Entries ----------

export function listSessionEntries(sessionId: string): HomeExerciseEntry[] {
  return readHomeState()
    .entries.filter((e) => e.home_session_id === sessionId && !e.deleted_at)
    .sort((a, b) => a.sequence - b.sequence);
}
export function getEntry(id: string): HomeExerciseEntry | null {
  return readHomeState().entries.find((e) => e.id === id) ?? null;
}

export function addEntry(
  sessionId: string,
  exerciseId: string,
  overrides: Partial<HomeExerciseEntrySnapshot> = {},
): HomeExerciseEntry {
  const t = nowIso();
  const existing = listSessionEntries(sessionId);
  const entry: HomeExerciseEntry = {
    id: newId(),
    home_session_id: sessionId,
    exercise_id: exerciseId,
    sequence: existing.length,
    snapshot: buildEntrySnapshot(exerciseId, overrides),
    notes: null,
    completed: false,
    created_at: t,
    updated_at: t,
    deleted_at: null,
  };
  commit((s) => ({ ...s, entries: [...s.entries, entry] }));
  updateHomeSession(sessionId, {});
  return entry;
}

export function updateEntry(
  id: string,
  patch: Partial<Omit<HomeExerciseEntry, "id" | "created_at">>,
): void {
  commit((s) => ({
    ...s,
    entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch, updated_at: nowIso() } : e)),
  }));
}
export function trashEntry(id: string): void {
  updateEntry(id, { deleted_at: nowIso() });
}
export function restoreEntry(id: string): void {
  updateEntry(id, { deleted_at: null });
}
export function reorderEntries(sessionId: string, orderedIds: string[]): void {
  commit((s) => ({
    ...s,
    entries: s.entries.map((e) => {
      if (e.home_session_id !== sessionId) return e;
      const idx = orderedIds.indexOf(e.id);
      return idx < 0 ? e : { ...e, sequence: idx, updated_at: nowIso() };
    }),
  }));
}

/** החלפת התרגיל של entry (שומרת snapshot חדש). */
export function substituteEntryExercise(entryId: string, newExerciseId: string): void {
  const e = getEntry(entryId);
  if (!e) return;
  updateEntry(entryId, {
    exercise_id: newExerciseId,
    snapshot: buildEntrySnapshot(newExerciseId),
  });
}

// ---------- Sets ----------

export function listEntrySets(entryId: string): HomeExerciseSet[] {
  return readHomeState()
    .sets.filter((st) => st.entry_id === entryId && !st.deleted_at)
    .sort((a, b) => a.set_number - b.set_number);
}
export function getSet(id: string): HomeExerciseSet | null {
  return readHomeState().sets.find((st) => st.id === id) ?? null;
}

function nextSetNumber(entryId: string): number {
  const sets = listEntrySets(entryId);
  return sets.length ? Math.max(...sets.map((s) => s.set_number)) + 1 : 1;
}

export function addSet(
  entryId: string,
  overrides: Partial<Omit<HomeExerciseSet, "id" | "entry_id" | "set_number">> = {},
): HomeExerciseSet {
  const entry = getEntry(entryId);
  const t = nowIso();
  const st: HomeExerciseSet = {
    id: newId(),
    entry_id: entryId,
    set_number: nextSetNumber(entryId),
    tracking_type: entry?.snapshot.tracking_type ?? "reps_only",
    reps: null,
    duration_seconds: null,
    side: null,
    added_weight: null,
    weight_unit: entry?.snapshot.weight_unit ?? "kg",
    assistance_value: null,
    round_number: null,
    rpe: null,
    rir: null,
    set_type: "regular" as HomeSetType,
    notes: null,
    completed: false,
    skipped: false,
    completed_at: null,
    created_at: t,
    updated_at: t,
    deleted_at: null,
    ...overrides,
  };
  commit((s) => ({ ...s, sets: [...s.sets, st] }));
  return st;
}

export function duplicateSet(setId: string): HomeExerciseSet | null {
  const s = getSet(setId);
  if (!s) return null;
  const t = nowIso();
  const clone: HomeExerciseSet = {
    ...s,
    id: newId(),
    set_number: nextSetNumber(s.entry_id),
    completed: false,
    completed_at: null,
    created_at: t,
    updated_at: t,
  };
  commit((state) => ({ ...state, sets: [...state.sets, clone] }));
  return clone;
}

export function updateSet(id: string, patch: Partial<Omit<HomeExerciseSet, "id">>): void {
  commit((s) => ({
    ...s,
    sets: s.sets.map((st) => (st.id === id ? { ...st, ...patch, updated_at: nowIso() } : st)),
  }));
}

export function markSetCompleted(id: string, completed = true): void {
  updateSet(id, {
    completed,
    completed_at: completed ? nowIso() : null,
    skipped: false,
  });
}
export function markSetSkipped(id: string, skipped = true): void {
  updateSet(id, { skipped, completed: false });
}
export function trashSet(id: string): void {
  updateSet(id, { deleted_at: nowIso() });
}
export function restoreSet(id: string): void {
  updateSet(id, { deleted_at: null });
}
export function renumberSets(entryId: string): void {
  const sets = readHomeState().sets.filter((st) => st.entry_id === entryId && !st.deleted_at);
  sets.sort((a, b) => a.set_number - b.set_number);
  commit((s) => ({
    ...s,
    sets: s.sets.map((st) => {
      if (st.entry_id !== entryId || st.deleted_at) return st;
      const idx = sets.findIndex((x) => x.id === st.id);
      return { ...st, set_number: idx + 1 };
    }),
  }));
}

// ---------- Quick entry ----------

/** יצירת session חדש עם תרגיל יחיד + סט ריק אחד מוכן להזנה. */
export function startQuickEntry(input: QuickEntryInput): {
  session: HomeSession;
  entry: HomeExerciseEntry;
  set: HomeExerciseSet;
} {
  const ex = getExercise(input.exercise_id);
  const session = createHomeSession({
    is_quick_entry: true,
    primary_exercise_id: input.exercise_id,
    name: input.name ?? ex?.name_he ?? "דיווח מהיר",
  });
  const entry = addEntry(session.id, input.exercise_id);
  const set = addSet(entry.id);
  return { session, entry, set };
}

// ---------- Templates ----------

export function listHomeTemplates(): HomeTemplate[] {
  return readHomeState().templates.filter((t) => !t.deleted_at);
}
export function getHomeTemplate(id: string): HomeTemplate | null {
  return readHomeState().templates.find((t) => t.id === id) ?? null;
}
export function listHomeTemplateEntries(templateId: string): HomeTemplateEntry[] {
  return readHomeState()
    .templateEntries.filter((e) => e.template_id === templateId && !e.deleted_at)
    .sort((a, b) => a.sequence - b.sequence);
}

export interface NewHomeTemplateInput {
  name: string;
  description?: string | null;
  rounds?: number;
  notes?: string | null;
}

export function createHomeTemplate(input: NewHomeTemplateInput): HomeTemplate {
  const t = nowIso();
  const tpl: HomeTemplate = {
    id: newId(),
    owner_id: HOME_OWNER_ID,
    parent_template_id: null,
    name: input.name.trim() || "תבנית בית",
    description: input.description ?? null,
    version: 1,
    rounds: Math.max(1, input.rounds ?? 1),
    status: "active",
    is_favorite: false,
    notes: input.notes ?? null,
    usage_count: 0,
    last_used_at: null,
    created_at: t,
    updated_at: t,
    deleted_at: null,
  };
  commit((s) => ({ ...s, templates: [...s.templates, tpl] }));
  return tpl;
}

export function updateHomeTemplate(
  id: string,
  patch: Partial<Omit<HomeTemplate, "id" | "created_at">>,
): void {
  commit((s) => ({
    ...s,
    templates: s.templates.map((t) =>
      t.id === id ? { ...t, ...patch, updated_at: nowIso() } : t,
    ),
  }));
}

export function toggleFavoriteTemplate(id: string): void {
  const t = getHomeTemplate(id);
  if (!t) return;
  updateHomeTemplate(id, { is_favorite: !t.is_favorite });
}
export function setHomeTemplateStatus(id: string, status: HomeTemplateStatus): void {
  updateHomeTemplate(id, { status, deleted_at: status === "trashed" ? nowIso() : null });
}
export function trashHomeTemplate(id: string): void {
  setHomeTemplateStatus(id, "trashed");
}
export function restoreHomeTemplate(id: string): void {
  updateHomeTemplate(id, { status: "active", deleted_at: null });
}
export function archiveHomeTemplate(id: string): void {
  setHomeTemplateStatus(id, "archived");
}

export function duplicateHomeTemplate(id: string, newName?: string): HomeTemplate | null {
  const src = getHomeTemplate(id);
  if (!src) return null;
  const entries = listHomeTemplateEntries(id);
  const dup = createHomeTemplate({
    name: newName ?? `${src.name} (עותק)`,
    description: src.description,
    rounds: src.rounds,
    notes: src.notes,
  });
  updateHomeTemplate(dup.id, { parent_template_id: src.id });
  entries.forEach((e) => {
    addHomeTemplateEntry(dup.id, e.exercise_id, {
      planned_sets: e.planned_sets,
      planned_reps: e.planned_reps,
      planned_reps_min: e.planned_reps_min,
      planned_reps_max: e.planned_reps_max,
      planned_duration_seconds: e.planned_duration_seconds,
      planned_added_weight: e.planned_added_weight,
      weight_unit: e.weight_unit,
      rest_seconds: e.rest_seconds,
      notes: e.notes,
    });
  });
  return dup;
}

export interface NewHomeTemplateEntryInput {
  planned_sets?: number;
  planned_reps?: number | null;
  planned_reps_min?: number | null;
  planned_reps_max?: number | null;
  planned_duration_seconds?: number | null;
  planned_added_weight?: number | null;
  weight_unit?: WeightUnit;
  rest_seconds?: number | null;
  notes?: string | null;
}

export function addHomeTemplateEntry(
  templateId: string,
  exerciseId: string,
  overrides: NewHomeTemplateEntryInput = {},
): HomeTemplateEntry {
  const t = nowIso();
  const existing = listHomeTemplateEntries(templateId);
  const ex = getExercise(exerciseId);
  const entry: HomeTemplateEntry = {
    id: newId(),
    template_id: templateId,
    exercise_id: exerciseId,
    sequence: existing.length,
    planned_sets: overrides.planned_sets ?? ex?.default_sets ?? 3,
    planned_reps: overrides.planned_reps ?? ex?.default_reps ?? 12,
    planned_reps_min: overrides.planned_reps_min ?? ex?.default_rep_range_min ?? null,
    planned_reps_max: overrides.planned_reps_max ?? ex?.default_rep_range_max ?? null,
    planned_duration_seconds: overrides.planned_duration_seconds ?? null,
    planned_added_weight: overrides.planned_added_weight ?? null,
    weight_unit: overrides.weight_unit ?? "kg",
    rest_seconds: overrides.rest_seconds ?? ex?.default_rest_seconds ?? 60,
    notes: overrides.notes ?? null,
    created_at: t,
    updated_at: t,
    deleted_at: null,
  };
  commit((s) => ({ ...s, templateEntries: [...s.templateEntries, entry] }));
  return entry;
}

export function updateHomeTemplateEntry(
  id: string,
  patch: Partial<Omit<HomeTemplateEntry, "id" | "created_at">>,
): void {
  commit((s) => ({
    ...s,
    templateEntries: s.templateEntries.map((e) =>
      e.id === id ? { ...e, ...patch, updated_at: nowIso() } : e,
    ),
  }));
}
export function removeHomeTemplateEntry(id: string): void {
  updateHomeTemplateEntry(id, { deleted_at: nowIso() });
}
export function reorderHomeTemplateEntries(templateId: string, orderedIds: string[]): void {
  commit((s) => ({
    ...s,
    templateEntries: s.templateEntries.map((e) => {
      if (e.template_id !== templateId) return e;
      const idx = orderedIds.indexOf(e.id);
      return idx < 0 ? e : { ...e, sequence: idx, updated_at: nowIso() };
    }),
  }));
}

export function buildHomeTemplateSnapshot(templateId: string): HomeTemplateSnapshot | null {
  const t = getHomeTemplate(templateId);
  if (!t) return null;
  const entries = listHomeTemplateEntries(templateId);
  return {
    template_id: t.id,
    template_version: t.version,
    name: t.name,
    rounds: t.rounds,
    planned_duration_seconds: null,
    entries: entries.map((e) => {
      const ex = getExercise(e.exercise_id);
      return {
        exercise_id: e.exercise_id,
        exercise_name: ex?.name_he ?? "תרגיל",
        tracking_type: (ex?.tracking_type ?? "reps_only") as TrackingType,
        unilateral: ex?.unilateral ?? false,
        default_sets: e.planned_sets,
        planned_reps: e.planned_reps,
        planned_reps_min: e.planned_reps_min,
        planned_reps_max: e.planned_reps_max,
        planned_duration_seconds: e.planned_duration_seconds,
        planned_added_weight: e.planned_added_weight,
        weight_unit: e.weight_unit,
        rest_seconds: e.rest_seconds,
        notes: e.notes,
      };
    }),
  };
}

/** יצירת snapshot גרסה — משמש לפני שינוי מבני משמעותי. */
export function saveHomeTemplateVersion(templateId: string): HomeTemplateVersion | null {
  const snap = buildHomeTemplateSnapshot(templateId);
  if (!snap) return null;
  const t = getHomeTemplate(templateId);
  if (!t) return null;
  const record: HomeTemplateVersion = {
    id: newId(),
    template_id: templateId,
    version: t.version,
    snapshot: snap,
    created_at: nowIso(),
  };
  commit((s) => ({ ...s, templateVersions: [...s.templateVersions, record] }));
  updateHomeTemplate(templateId, { version: t.version + 1 });
  return record;
}

/** התחלת session מתבנית: יוצרת snapshot ומחדירה entries+sets מתוכננים. */
export function startSessionFromTemplate(templateId: string): HomeSession | null {
  const snap = buildHomeTemplateSnapshot(templateId);
  const t = getHomeTemplate(templateId);
  if (!snap || !t) return null;
  const session = createHomeSession({
    template_id: templateId,
    template_version: t.version,
    template_snapshot: snap,
    name: t.name,
    is_quick_entry: false,
  });
  snap.entries.forEach((se) => {
    const entry = addEntry(session.id, se.exercise_id, {
      planned_sets: se.default_sets,
      planned_reps: se.planned_reps,
      planned_reps_min: se.planned_reps_min,
      planned_reps_max: se.planned_reps_max,
      planned_duration_seconds: se.planned_duration_seconds,
      planned_added_weight: se.planned_added_weight,
      weight_unit: se.weight_unit,
      rest_seconds: se.rest_seconds,
      notes: se.notes,
    });
    const setsCount = Math.max(1, se.default_sets ?? 1);
    for (let i = 0; i < setsCount; i++) {
      addSet(entry.id, {
        tracking_type: se.tracking_type,
        reps: null,
        duration_seconds: null,
        added_weight: se.planned_added_weight,
        weight_unit: se.weight_unit,
      });
    }
  });
  updateHomeTemplate(templateId, {
    usage_count: t.usage_count + 1,
    last_used_at: nowIso(),
  });
  return session;
}

// ---------- Bulk cleanup helpers ----------

export function listTrashedHomeSessions(): HomeSession[] {
  return readHomeState().sessions.filter(
    (s) => s.status === "trashed" || s.deleted_at != null,
  );
}
