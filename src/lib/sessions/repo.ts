/**
 * Sessions repository — CRUD + business actions.
 * כל פעולה שומרת מיידית ל־localStorage דרך commit().
 * מקור אמת: state → derived read functions.
 */
import { buildTemplateSnapshot, getTemplate, markTemplateUsed } from "@/lib/templates";
import { getExercise } from "@/lib/exercises";
import { CURRENT_OWNER_ID, commit, readSessionsState } from "./storage";
import type {
  NewSessionInput,
  SessionStatus,
  StrengthSession,
  StrengthSessionBlock,
  StrengthSessionExercise,
  StrengthSessionExerciseSnapshot,
  StrengthSet,
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

function base() {
  const t = nowIso();
  return {
    id: newId(),
    created_at: t,
    updated_at: t,
    deleted_at: null as string | null,
  };
}

function tz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function makeSnapshotFromExercise(exerciseId: string): StrengthSessionExerciseSnapshot {
  const ex = getExercise(exerciseId);
  return {
    exercise_id: exerciseId,
    exercise_name: ex?.name_he ?? "תרגיל",
    tracking_type: ex?.tracking_type ?? "weight_reps",
    unilateral: ex?.unilateral ?? false,
    primary_muscle_group_id: ex?.primary_muscle_group_id ?? null,
    planned_sets: ex?.default_sets ?? 3,
    planned_reps: ex?.default_reps ?? 12,
    rep_range_min: null,
    rep_range_max: null,
    planned_weight: null,
    weight_unit: "kg",
    rest_seconds: ex?.default_rest_seconds ?? 90,
    default_rpe: null,
    default_rir: null,
    set_type: "regular",
    tempo: null,
    notes: null,
    alternate_exercise_ids: [],
  };
}

// ---------- Session queries ----------

export function listSessions(includeTrash = false): StrengthSession[] {
  return readSessionsState()
    .sessions.filter((s) => includeTrash || !s.deleted_at)
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
}

export function getSession(id: string): StrengthSession | null {
  return readSessionsState().sessions.find((s) => s.id === id) ?? null;
}

/** אימונים שנשלחו לסל (deleted_at) — לשחזור מ-/trash. */
export function listTrashedSessions(): StrengthSession[] {
  return readSessionsState()
    .sessions.filter((s) => s.deleted_at != null)
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
}

export function getActiveSession(): StrengthSession | null {
  return (
    readSessionsState()
      .sessions.filter((s) => !s.deleted_at)
      .find((s) => s.status === "in_progress" || s.status === "paused" || s.status === "draft") ??
    null
  );
}

export function listSessionBlocks(sessionId: string): StrengthSessionBlock[] {
  return readSessionsState()
    .blocks.filter((b) => b.session_id === sessionId && !b.deleted_at)
    .sort((a, b) => a.sequence - b.sequence);
}

export function listSessionExercises(sessionId: string): StrengthSessionExercise[] {
  const blockIds = new Set(listSessionBlocks(sessionId).map((b) => b.id));
  return readSessionsState()
    .exercises.filter((e) => blockIds.has(e.block_id) && !e.deleted_at)
    .sort((a, b) => a.sequence - b.sequence);
}

export function listBlockExercises(blockId: string): StrengthSessionExercise[] {
  return readSessionsState()
    .exercises.filter((e) => e.block_id === blockId && !e.deleted_at)
    .sort((a, b) => a.sequence - b.sequence);
}

export function getSessionExercise(id: string): StrengthSessionExercise | null {
  return readSessionsState().exercises.find((e) => e.id === id) ?? null;
}

export function listExerciseSets(sessionExerciseId: string): StrengthSet[] {
  return readSessionsState()
    .sets.filter((s) => s.session_exercise_id === sessionExerciseId && !s.deleted_at)
    .sort((a, b) => a.set_number - b.set_number);
}

export function getSet(id: string): StrengthSet | null {
  return readSessionsState().sets.find((s) => s.id === id) ?? null;
}

// ---------- Session creation ----------

function createBareSession(input: NewSessionInput & { name: string }): StrengthSession {
  const b = base();
  const record: StrengthSession = {
    ...b,
    owner_id: CURRENT_OWNER_ID,
    template_id: input.template_id ?? null,
    template_version: input.template_version ?? null,
    template_snapshot: input.template_snapshot ?? null,
    location_id: input.location_id ?? null,
    name: input.name,
    started_at: nowIso(),
    ended_at: null,
    timezone: tz(),
    duration_seconds: null,
    status: "in_progress",
    perceived_quality: null,
    perceived_effort: null,
    notes: input.notes ?? null,
    quality_score: null,
    quality_score_details: null,
    data_completeness: null,
  };
  commit((s) => ({
    ...s,
    sessions: [...s.sessions, record],
    timers: [
      ...s.timers.filter((t) => t.session_id !== record.id),
      { session_id: record.id, started_at: record.started_at, paused_at: null, paused_seconds: 0 },
    ],
  }));
  return record;
}

/** יצירת סטים מ־snapshot של תרגיל. */
function seedSetsForExercise(sessionExerciseId: string, snap: StrengthSessionExerciseSnapshot) {
  const now = nowIso();
  const sets: StrengthSet[] = [];
  for (let i = 1; i <= snap.planned_sets; i++) {
    sets.push({
      id: newId(),
      session_exercise_id: sessionExerciseId,
      set_number: i,
      set_type: snap.set_type,
      planned_reps: snap.planned_reps,
      actual_reps: null,
      planned_weight: snap.planned_weight,
      actual_weight: null,
      weight_unit: snap.weight_unit,
      duration_seconds: null,
      distance_meters: null,
      rpe: null,
      rir: null,
      rest_seconds: snap.rest_seconds,
      side: null,
      assistance_value: null,
      completed: false,
      skipped: false,
      notes: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
  }
  commit((s) => ({ ...s, sets: [...s.sets, ...sets] }));
}

export function startSessionFromTemplate(templateId: string): StrengthSession | null {
  const template = getTemplate(templateId);
  if (!template) return null;
  const snapshot = buildTemplateSnapshot(templateId);
  const session = createBareSession({
    template_id: template.id,
    template_version: template.version,
    template_snapshot: snapshot,
    location_id: template.location_id,
    name: template.name,
  });
  // materialize blocks + exercises + sets
  const now = nowIso();
  const blocks: StrengthSessionBlock[] = [];
  const exercises: StrengthSessionExercise[] = [];
  const sets: StrengthSet[] = [];
  snapshot?.blocks.forEach((b, bi) => {
    const blockId = newId();
    blocks.push({
      id: blockId,
      session_id: session.id,
      sequence: bi,
      block_type:
        b.block_type === "superset" || b.block_type === "circuit" ? b.block_type : "single",
      display_label: b.display_label,
      rounds: b.rounds,
      rest_between_exercises_seconds: b.rest_between_exercises_seconds,
      rest_between_rounds_seconds: b.rest_between_rounds_seconds,
      notes: b.notes,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
    b.exercises.forEach((te, ei) => {
      const ex = getExercise(te.exercise_id);
      const snap: StrengthSessionExerciseSnapshot = {
        exercise_id: te.exercise_id,
        exercise_name: ex?.name_he ?? "תרגיל",
        tracking_type: ex?.tracking_type ?? "weight_reps",
        unilateral: ex?.unilateral ?? false,
        primary_muscle_group_id: ex?.primary_muscle_group_id ?? null,
        planned_sets: te.planned_sets,
        planned_reps: te.planned_reps,
        rep_range_min: te.rep_range_min,
        rep_range_max: te.rep_range_max,
        planned_weight: te.planned_weight,
        weight_unit: te.weight_unit,
        rest_seconds: te.rest_seconds ?? b.rest_between_exercises_seconds,
        default_rpe: te.default_rpe,
        default_rir: te.default_rir,
        set_type: te.set_type,
        tempo: te.tempo,
        notes: te.notes,
        alternate_exercise_ids: te.alternate_exercise_ids,
      };
      const seId = newId();
      exercises.push({
        id: seId,
        session_id: session.id,
        block_id: blockId,
        exercise_id: te.exercise_id,
        sequence: ei,
        snapshot: snap,
        substituted_from_exercise_id: null,
        substitution_reason: null,
        substituted_at: null,
        notes: null,
        completed: false,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
      for (let i = 1; i <= snap.planned_sets; i++) {
        sets.push({
          id: newId(),
          session_exercise_id: seId,
          set_number: i,
          set_type: snap.set_type,
          planned_reps: snap.planned_reps,
          actual_reps: null,
          planned_weight: snap.planned_weight,
          actual_weight: null,
          weight_unit: snap.weight_unit,
          duration_seconds: null,
          distance_meters: null,
          rpe: null,
          rir: null,
          rest_seconds: snap.rest_seconds,
          side: null,
          assistance_value: null,
          completed: false,
          skipped: false,
          notes: null,
          completed_at: null,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        });
      }
    });
  });
  commit((s) => ({
    ...s,
    blocks: [...s.blocks, ...blocks],
    exercises: [...s.exercises, ...exercises],
    sets: [...s.sets, ...sets],
  }));
  markTemplateUsed(templateId);
  return session;
}

export function startEmptySession(name?: string): StrengthSession {
  return createBareSession({ name: name?.trim() || "אימון חופשי" });
}

export function startSessionFromExercise(exerciseId: string): StrengthSession {
  const ex = getExercise(exerciseId);
  const session = createBareSession({ name: ex?.name_he ?? "אימון תרגיל בודד" });
  addExerciseToSession(session.id, exerciseId, { asNewBlock: true });
  return session;
}

export function duplicateSessionAsNew(sourceId: string): StrengthSession | null {
  const source = getSession(sourceId);
  if (!source) return null;
  const newSession = createBareSession({
    name: source.name,
    location_id: source.location_id,
    template_id: source.template_id,
    template_version: source.template_version,
    template_snapshot: source.template_snapshot,
    notes: null,
  });
  const now = nowIso();
  const srcBlocks = listSessionBlocks(sourceId);
  const blockMap = new Map<string, string>();
  const blocks: StrengthSessionBlock[] = srcBlocks.map((b) => {
    const id = newId();
    blockMap.set(b.id, id);
    return { ...b, id, session_id: newSession.id, created_at: now, updated_at: now };
  });
  const exercises: StrengthSessionExercise[] = [];
  const sets: StrengthSet[] = [];
  for (const b of srcBlocks) {
    const newBlockId = blockMap.get(b.id)!;
    const srcExs = listBlockExercises(b.id);
    srcExs.forEach((e, i) => {
      const seId = newId();
      exercises.push({
        ...e,
        id: seId,
        block_id: newBlockId,
        session_id: newSession.id,
        sequence: i,
        substituted_from_exercise_id: null,
        substitution_reason: null,
        substituted_at: null,
        notes: null,
        completed: false,
        created_at: now,
        updated_at: now,
      });
      for (let n = 1; n <= e.snapshot.planned_sets; n++) {
        sets.push({
          id: newId(),
          session_exercise_id: seId,
          set_number: n,
          set_type: e.snapshot.set_type,
          planned_reps: e.snapshot.planned_reps,
          actual_reps: null,
          planned_weight: e.snapshot.planned_weight,
          actual_weight: null,
          weight_unit: e.snapshot.weight_unit,
          duration_seconds: null,
          distance_meters: null,
          rpe: null,
          rir: null,
          rest_seconds: e.snapshot.rest_seconds,
          side: null,
          assistance_value: null,
          completed: false,
          skipped: false,
          notes: null,
          completed_at: null,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        });
      }
    });
  }
  commit((s) => ({
    ...s,
    blocks: [...s.blocks, ...blocks],
    exercises: [...s.exercises, ...exercises],
    sets: [...s.sets, ...sets],
  }));
  return newSession;
}

// ---------- Session updates ----------

export function updateSession(id: string, patch: Partial<StrengthSession>): void {
  commit((s) => ({
    ...s,
    sessions: s.sessions.map((x) =>
      x.id === id ? { ...x, ...patch, id: x.id, updated_at: nowIso() } : x,
    ),
  }));
}

export function setSessionStatus(id: string, status: SessionStatus): void {
  const patch: Partial<StrengthSession> = { status };
  if (status === "completed" || status === "abandoned") patch.ended_at = nowIso();
  updateSession(id, patch);
}

export function pauseSession(id: string): void {
  const now = nowIso();
  commit((s) => ({
    ...s,
    timers: s.timers.map((t) => (t.session_id === id ? { ...t, paused_at: now } : t)),
  }));
  updateSession(id, { status: "paused" });
}

export function resumeSession(id: string): void {
  const now = new Date();
  commit((s) => ({
    ...s,
    timers: s.timers.map((t) => {
      if (t.session_id !== id || !t.paused_at) return t;
      const pausedFor = Math.max(0, (now.getTime() - new Date(t.paused_at).getTime()) / 1000);
      return { ...t, paused_at: null, paused_seconds: t.paused_seconds + pausedFor };
    }),
  }));
  updateSession(id, { status: "in_progress" });
}

export function finishSession(
  id: string,
  extras?: {
    perceived_effort?: number | null;
    perceived_quality?: number | null;
    notes?: string | null;
  },
): StrengthSession | null {
  const session = getSession(id);
  if (!session) return null;
  const now = nowIso();
  // finalize timer
  commit((s) => ({
    ...s,
    timers: s.timers.map((t) => {
      if (t.session_id !== id) return t;
      if (t.paused_at) {
        const pausedFor = (new Date(now).getTime() - new Date(t.paused_at).getTime()) / 1000;
        return { ...t, paused_at: null, paused_seconds: t.paused_seconds + pausedFor };
      }
      return t;
    }),
  }));
  const timer = readSessionsState().timers.find((t) => t.session_id === id);
  const elapsed = timer
    ? Math.max(
        0,
        Math.floor(
          (new Date(now).getTime() - new Date(timer.started_at).getTime()) / 1000 -
            timer.paused_seconds,
        ),
      )
    : null;
  updateSession(id, {
    status: "completed",
    ended_at: now,
    duration_seconds: elapsed,
    perceived_effort: extras?.perceived_effort ?? session.perceived_effort,
    perceived_quality: extras?.perceived_quality ?? session.perceived_quality,
    notes: extras?.notes ?? session.notes,
  });
  return getSession(id);
}

export function abandonSession(id: string, saveAsDraft: boolean): void {
  if (saveAsDraft) {
    updateSession(id, { status: "draft" });
  } else {
    setSessionStatus(id, "abandoned");
  }
}

export function trashSession(id: string): void {
  updateSession(id, { deleted_at: nowIso() });
}
export function restoreSession(id: string): void {
  updateSession(id, { deleted_at: null });
}

// ---------- Exercises ----------

export function addExerciseToSession(
  sessionId: string,
  exerciseId: string,
  opts?: { asNewBlock?: boolean; targetBlockId?: string; asSuperset?: boolean },
): StrengthSessionExercise | null {
  const session = getSession(sessionId);
  if (!session) return null;
  const snap = makeSnapshotFromExercise(exerciseId);
  const now = nowIso();
  let blockId = opts?.targetBlockId ?? null;
  const state = readSessionsState();
  if (!blockId || opts?.asNewBlock) {
    const nextSeq = listSessionBlocks(sessionId).length;
    const block: StrengthSessionBlock = {
      id: newId(),
      session_id: sessionId,
      sequence: nextSeq,
      block_type: opts?.asSuperset ? "superset" : "single",
      display_label: null,
      rounds: 1,
      rest_between_exercises_seconds: null,
      rest_between_rounds_seconds: null,
      notes: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    commit((s) => ({ ...s, blocks: [...s.blocks, block] }));
    blockId = block.id;
  } else {
    // מפעילים סופרסט אם הבלוק היה single ומוסיפים אליו שני
    const targetBlock = state.blocks.find((b) => b.id === blockId);
    if (targetBlock && targetBlock.block_type === "single" && opts?.asSuperset) {
      commit((s) => ({
        ...s,
        blocks: s.blocks.map((b) =>
          b.id === targetBlock.id ? { ...b, block_type: "superset", updated_at: now } : b,
        ),
      }));
    }
  }
  const siblings = listBlockExercises(blockId!);
  const record: StrengthSessionExercise = {
    id: newId(),
    session_id: sessionId,
    block_id: blockId!,
    exercise_id: exerciseId,
    sequence: siblings.length,
    snapshot: snap,
    substituted_from_exercise_id: null,
    substitution_reason: null,
    substituted_at: null,
    notes: null,
    completed: false,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  commit((s) => ({ ...s, exercises: [...s.exercises, record] }));
  seedSetsForExercise(record.id, snap);
  return record;
}

export function substituteExercise(
  sessionExerciseId: string,
  newExerciseId: string,
  reason?: string,
): void {
  const se = getSessionExercise(sessionExerciseId);
  if (!se) return;
  const ex = getExercise(newExerciseId);
  const nowT = nowIso();
  const nextSnap: StrengthSessionExerciseSnapshot = {
    ...se.snapshot,
    exercise_id: newExerciseId,
    exercise_name: ex?.name_he ?? se.snapshot.exercise_name,
    tracking_type: ex?.tracking_type ?? se.snapshot.tracking_type,
    unilateral: ex?.unilateral ?? se.snapshot.unilateral,
    primary_muscle_group_id: ex?.primary_muscle_group_id ?? se.snapshot.primary_muscle_group_id,
  };
  commit((s) => ({
    ...s,
    exercises: s.exercises.map((x) =>
      x.id === sessionExerciseId
        ? {
            ...x,
            exercise_id: newExerciseId,
            snapshot: nextSnap,
            substituted_from_exercise_id: x.exercise_id,
            substitution_reason: reason?.trim() || null,
            substituted_at: nowT,
            updated_at: nowT,
          }
        : x,
    ),
  }));
}

export function updateSessionExercise(
  id: string,
  patch: Partial<Omit<StrengthSessionExercise, "id" | "session_id" | "block_id">>,
): void {
  commit((s) => ({
    ...s,
    exercises: s.exercises.map((x) => (x.id === id ? { ...x, ...patch, updated_at: nowIso() } : x)),
  }));
}

export function removeExerciseFromSession(id: string): void {
  const now = nowIso();
  commit((s) => ({
    ...s,
    exercises: s.exercises.map((x) =>
      x.id === id ? { ...x, deleted_at: now, updated_at: now } : x,
    ),
    sets: s.sets.map((st) =>
      st.session_exercise_id === id ? { ...st, deleted_at: now, updated_at: now } : st,
    ),
  }));
}

export function restoreExerciseInSession(id: string): void {
  commit((s) => ({
    ...s,
    exercises: s.exercises.map((x) =>
      x.id === id ? { ...x, deleted_at: null, updated_at: nowIso() } : x,
    ),
    sets: s.sets.map((st) => (st.session_exercise_id === id ? { ...st, deleted_at: null } : st)),
  }));
}

function reindexBlockExercises(blockId: string, nextIds: string[]): void {
  commit((s) => ({
    ...s,
    exercises: s.exercises.map((x) => {
      if (x.block_id !== blockId) return x;
      const i = nextIds.indexOf(x.id);
      return i >= 0 ? { ...x, sequence: i, updated_at: nowIso() } : x;
    }),
  }));
}

export function moveExercise(id: string, dir: "up" | "down"): void {
  const se = getSessionExercise(id);
  if (!se) return;
  const siblings = listBlockExercises(se.block_id);
  const idx = siblings.findIndex((x) => x.id === id);
  const target = dir === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= siblings.length) return;
  const next = [...siblings];
  [next[idx], next[target]] = [next[target], next[idx]];
  reindexBlockExercises(
    se.block_id,
    next.map((x) => x.id),
  );
}

export function moveExerciseToBlock(id: string, targetBlockId: string): void {
  const se = getSessionExercise(id);
  if (!se) return;
  const sib = listBlockExercises(targetBlockId);
  commit((s) => ({
    ...s,
    exercises: s.exercises.map((x) =>
      x.id === id
        ? { ...x, block_id: targetBlockId, sequence: sib.length, updated_at: nowIso() }
        : x,
    ),
  }));
}

// ---------- Sets ----------

export function updateSet(id: string, patch: Partial<StrengthSet>): void {
  commit((s) => ({
    ...s,
    sets: s.sets.map((x) => (x.id === id ? { ...x, ...patch, id: x.id, updated_at: nowIso() } : x)),
  }));
  // maybe mark exercise completed
  const set = getSet(id);
  if (set) recomputeExerciseCompletion(set.session_exercise_id);
}

export function completeSet(
  id: string,
  values?: {
    actual_reps?: number | null;
    actual_weight?: number | null;
    duration_seconds?: number | null;
  },
): void {
  const set = getSet(id);
  if (!set) return;
  const now = nowIso();
  updateSet(id, {
    ...values,
    completed: true,
    skipped: false,
    completed_at: now,
  });
}

export function undoCompleteSet(id: string): void {
  updateSet(id, { completed: false, skipped: false, completed_at: null });
}

export function skipSet(id: string): void {
  updateSet(id, { skipped: true, completed: false, completed_at: nowIso() });
}

export function addSet(sessionExerciseId: string, copyFromPrev = true): StrengthSet | null {
  const se = getSessionExercise(sessionExerciseId);
  if (!se) return null;
  const existing = listExerciseSets(sessionExerciseId);
  const prev = existing[existing.length - 1];
  const now = nowIso();
  const record: StrengthSet = {
    id: newId(),
    session_exercise_id: sessionExerciseId,
    set_number: existing.length + 1,
    set_type: "regular",
    planned_reps: se.snapshot.planned_reps,
    actual_reps: null,
    planned_weight:
      copyFromPrev && prev?.actual_weight != null ? prev.actual_weight : se.snapshot.planned_weight,
    actual_weight: null,
    weight_unit: se.snapshot.weight_unit,
    duration_seconds: null,
    distance_meters: null,
    rpe: null,
    rir: null,
    rest_seconds: se.snapshot.rest_seconds,
    side: null,
    assistance_value: null,
    completed: false,
    skipped: false,
    notes: null,
    completed_at: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  commit((s) => ({ ...s, sets: [...s.sets, record] }));
  return record;
}

export function duplicateSet(id: string): StrengthSet | null {
  const src = getSet(id);
  if (!src) return null;
  const siblings = listExerciseSets(src.session_exercise_id);
  const now = nowIso();
  const copy: StrengthSet = {
    ...src,
    id: newId(),
    set_number: siblings.length + 1,
    completed: false,
    skipped: false,
    completed_at: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  commit((s) => ({ ...s, sets: [...s.sets, copy] }));
  return copy;
}

export function removeSet(id: string): void {
  const src = getSet(id);
  if (!src) return;
  const now = nowIso();
  commit((s) => ({
    ...s,
    sets: s.sets.map((x) => (x.id === id ? { ...x, deleted_at: now } : x)),
  }));
  // renumber remaining sets
  const remaining = listExerciseSets(src.session_exercise_id);
  commit((s) => ({
    ...s,
    sets: s.sets.map((x) => {
      const i = remaining.findIndex((r) => r.id === x.id);
      return i >= 0 ? { ...x, set_number: i + 1 } : x;
    }),
  }));
  recomputeExerciseCompletion(src.session_exercise_id);
}

export function restoreSet(id: string): void {
  commit((s) => ({
    ...s,
    sets: s.sets.map((x) => (x.id === id ? { ...x, deleted_at: null } : x)),
  }));
}

function recomputeExerciseCompletion(sessionExerciseId: string): void {
  const sets = listExerciseSets(sessionExerciseId);
  const done = sets.length > 0 && sets.every((s) => s.completed || s.skipped);
  commit((s) => ({
    ...s,
    exercises: s.exercises.map((x) =>
      x.id === sessionExerciseId ? { ...x, completed: done, updated_at: nowIso() } : x,
    ),
  }));
}

// ---------- Prefs ----------

export function updatePrefs(patch: Partial<ReturnType<typeof getPrefs>>): void {
  commit((s) => ({ ...s, prefs: { ...s.prefs, ...patch } }));
}
export function getPrefs() {
  return readSessionsState().prefs;
}
