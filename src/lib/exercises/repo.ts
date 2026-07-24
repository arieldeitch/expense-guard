/**
 * Repository — CRUD ופעולות עסקיות על exercises / muscle groups / media.
 * מייצר id/timestamps, שומר על invariants: ווריאציה לא מפרקת היסטוריה,
 * seed נשמר לקריאה בלבד אלא אם המשתמש שיכפל אותו קודם.
 */
import type {
  Exercise,
  ExerciseMedia,
  MuscleGroup,
  NewExercise,
  NewExerciseMedia,
  NewMuscleGroup,
} from "./types";
import { normalizeExerciseName } from "./schemas";
import {
  CURRENT_OWNER_ID,
  readExercisesState,
  writeExercisesState,
  type ExercisesState,
} from "./storage";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^\w\u0590-\u05FF]+/g, "-")
      .replace(/^-+|-+$/g, "") || `ex-${Date.now()}`
  );
}

function ensureUniqueSlug(base: string, existing: Exercise[], excludeId?: string): string {
  let s = base;
  let i = 2;
  while (existing.some((e) => e.slug === s && e.id !== excludeId)) {
    s = `${base}-${i++}`;
  }
  return s;
}

// ---------- Muscle groups ----------

export function listMuscleGroups(): MuscleGroup[] {
  return readExercisesState()
    .muscle_groups.slice()
    .sort((a, b) => a.display_order - b.display_order || a.name_he.localeCompare(b.name_he, "he"));
}

export function getMuscleGroup(id: string): MuscleGroup | null {
  return readExercisesState().muscle_groups.find((m) => m.id === id) ?? null;
}

export function createMuscleGroup(input: NewMuscleGroup): MuscleGroup {
  const state = readExercisesState();
  const now = nowIso();
  const record: MuscleGroup = {
    id: newId(),
    owner_id: CURRENT_OWNER_ID,
    is_system: input.is_system ?? false,
    is_active: true,
    ...input,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  writeExercisesState({ ...state, muscle_groups: [...state.muscle_groups, record] });
  return record;
}

// ---------- Exercises ----------

export function listExercises(): Exercise[] {
  return sortExercises(readExercisesState().exercises);
}

export function getExercise(id: string): Exercise | null {
  return readExercisesState().exercises.find((e) => e.id === id) ?? null;
}

export function getExerciseBySlug(slug: string): Exercise | null {
  return readExercisesState().exercises.find((e) => e.slug === slug) ?? null;
}

export function createExercise(input: NewExercise): Exercise {
  const state = readExercisesState();
  const now = nowIso();
  const slug = ensureUniqueSlug(slugify(input.slug || input.name_he), state.exercises);
  const record: Exercise = {
    id: newId(),
    owner_id: CURRENT_OWNER_ID,
    is_system: input.is_system ?? false,
    is_favorite: input.is_favorite ?? false,
    is_active: true,
    ...input,
    slug,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  writeExercisesState({ ...state, exercises: [...state.exercises, record] });
  return record;
}

export function updateExercise(
  id: string,
  patch: Partial<Omit<Exercise, "id" | "owner_id" | "created_at" | "is_system">>,
): Exercise | null {
  const state = readExercisesState();
  const idx = state.exercises.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const existing = state.exercises[idx];
  const merged: Exercise = {
    ...existing,
    ...patch,
    updated_at: nowIso(),
  };
  const exercises = state.exercises.slice();
  exercises[idx] = merged;
  writeExercisesState({ ...state, exercises });
  return merged;
}

/** שכפול תרגיל — יוצר עותק ניתן לעריכה עם is_custom=true, is_system=false. */
export function duplicateExercise(id: string, overrideName?: string): Exercise | null {
  const state = readExercisesState();
  const src = state.exercises.find((e) => e.id === id);
  if (!src) return null;
  const newName = overrideName?.trim() || `${src.name_he} (עותק)`;
  const now = nowIso();
  const slug = ensureUniqueSlug(slugify(newName), state.exercises);
  const record: Exercise = {
    ...src,
    id: newId(),
    slug,
    name_he: newName,
    is_system: false,
    is_custom: true,
    is_favorite: false,
    parent_exercise_id: null,
    variation_type: null,
    variation_notes: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    is_active: true,
  };
  writeExercisesState({ ...state, exercises: [...state.exercises, record] });
  return record;
}

export function toggleFavoriteExercise(id: string): void {
  applyRecordChange<Exercise>("exercises", id, (r) => ({
    ...r,
    is_favorite: !r.is_favorite,
    updated_at: nowIso(),
  }));
}

export function archiveExercise(id: string): void {
  applyRecordChange<Exercise>("exercises", id, (r) => ({
    ...r,
    is_active: false,
    updated_at: nowIso(),
  }));
}

export function unarchiveExercise(id: string): void {
  applyRecordChange<Exercise>("exercises", id, (r) => ({
    ...r,
    is_active: true,
    updated_at: nowIso(),
  }));
}

/** העברה לסל מחזור — soft delete. שומר על is_active=false גם עבור שחזור מסודר. */
export function trashExercise(id: string): void {
  const state = readExercisesState();
  const existing = state.exercises.find((e) => e.id === id);
  if (!existing) return;
  if (existing.is_system) {
    // תרגיל מערכת → ארכב במקום מחיקה. אין דרך להגיע לסל.
    applyRecordChange<Exercise>("exercises", id, (r) => ({
      ...r,
      is_active: false,
      updated_at: nowIso(),
    }));
    return;
  }
  applyRecordChange<Exercise>("exercises", id, (r) => ({
    ...r,
    deleted_at: nowIso(),
    is_active: false,
    updated_at: nowIso(),
  }));
}

export function restoreExercise(id: string): void {
  applyRecordChange<Exercise>("exercises", id, (r) => ({
    ...r,
    deleted_at: null,
    is_active: true,
    updated_at: nowIso(),
  }));
}

function sortExercises(items: Exercise[]): Exercise[] {
  return items.slice().sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    if (a.is_custom !== b.is_custom) return a.is_custom ? -1 : 1;
    return a.name_he.localeCompare(b.name_he, "he");
  });
}

// ---------- Media ----------

export function listMediaForExercise(exerciseId: string): ExerciseMedia[] {
  return readExercisesState()
    .media.filter((m) => m.exercise_id === exerciseId && m.deleted_at === null)
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.display_order - b.display_order;
    });
}

export function createMedia(input: NewExerciseMedia): ExerciseMedia {
  const state = readExercisesState();
  const now = nowIso();
  const record: ExerciseMedia = {
    id: newId(),
    owner_id: CURRENT_OWNER_ID,
    ...input,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  writeExercisesState({ ...state, media: [...state.media, record] });
  return record;
}

export function trashMedia(id: string): void {
  applyRecordChange<ExerciseMedia>("media", id, (r) => ({
    ...r,
    deleted_at: nowIso(),
    updated_at: nowIso(),
  }));
}

// ---------- Duplicate detection ----------

/** מציאת תרגילים בעלי שם דומה (נורמליזציה זהה) — לצורך אזהרת יצירה. */
export function findSimilarExercises(name: string, excludeId?: string): Exercise[] {
  const target = normalizeExerciseName(name);
  if (!target) return [];
  return readExercisesState().exercises.filter(
    (e) =>
      e.id !== excludeId &&
      e.deleted_at === null &&
      (normalizeExerciseName(e.name_he) === target ||
        (e.name_en && normalizeExerciseName(e.name_en) === target) ||
        e.aliases.some((a) => normalizeExerciseName(a) === target)),
  );
}

// ---------- Variations ----------

export function listVariationsOf(parentId: string): Exercise[] {
  return sortExercises(
    readExercisesState().exercises.filter(
      (e) => e.parent_exercise_id === parentId && e.deleted_at === null,
    ),
  );
}

// ---------- Cross-entity helpers ----------

function applyRecordChange<T extends { id: string }>(
  bucket: "exercises" | "media" | "muscle_groups",
  id: string,
  mutate: (r: T) => T,
): void {
  const state = readExercisesState();
  const list = state[bucket] as unknown as T[];
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const next = list.slice();
  next[idx] = mutate(list[idx]);
  writeExercisesState({ ...state, [bucket]: next } as ExercisesState);
}
