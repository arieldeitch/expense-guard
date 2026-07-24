/**
 * Repository — פעולות CRUD ו־structural operations על WorkoutTemplates.
 * הכל immutable snapshots של state: כל mutation יוצר state חדש ומעדכן storage.
 */
import type {
  BlockType,
  NewBlock,
  NewTemplate,
  NewTemplateExercise,
  WorkoutTemplate,
  WorkoutTemplateBlock,
  WorkoutTemplateExercise,
  WorkoutTemplateVersion,
} from "./types";
import {
  CURRENT_OWNER_ID,
  readTemplatesState,
  writeTemplatesState,
  type TemplatesState,
} from "./storage";
import {
  DEFAULT_INTRA_SUPERSET_REST_SECONDS,
  DEFAULT_REPS,
  DEFAULT_REST_SECONDS,
  DEFAULT_SETS,
  DEFAULT_SUPERSET_ROUND_REST_SECONDS,
} from "./defaults";
import { buildTemplateSnapshot } from "./versions";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function base() {
  const now = nowIso();
  return {
    id: newId(),
    owner_id: CURRENT_OWNER_ID,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}

function commit(mut: (s: TemplatesState) => TemplatesState): TemplatesState {
  const next = mut(readTemplatesState());
  writeTemplatesState(next);
  return next;
}

// ---------- Templates ----------

export function listTemplates(opts?: {
  includeArchived?: boolean;
  includeTrashed?: boolean;
}): WorkoutTemplate[] {
  const { includeArchived = false, includeTrashed = false } = opts ?? {};
  return readTemplatesState()
    .templates.filter((t) => {
      if (t.deleted_at) return includeTrashed;
      if (t.status === "trashed") return includeTrashed;
      if (t.status === "archived") return includeArchived;
      return true;
    })
    .sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
      const at = a.last_used_at ?? a.updated_at;
      const bt = b.last_used_at ?? b.updated_at;
      return bt.localeCompare(at);
    });
}

export function listTrashedTemplates(): WorkoutTemplate[] {
  return readTemplatesState().templates.filter(
    (t) => t.deleted_at !== null || t.status === "trashed",
  );
}

export function getTemplate(id: string): WorkoutTemplate | null {
  return readTemplatesState().templates.find((t) => t.id === id) ?? null;
}

export function createTemplate(input: NewTemplate): WorkoutTemplate {
  const record: WorkoutTemplate = {
    ...base(),
    name: input.name.trim(),
    description: input.description ?? null,
    location_id: input.location_id ?? null,
    estimated_duration_seconds: input.estimated_duration_seconds ?? null,
    primary_muscle_group_ids: input.primary_muscle_group_ids ?? null,
    secondary_muscle_group_ids: input.secondary_muscle_group_ids ?? null,
    muscle_override: input.muscle_override ?? false,
    default_rest_seconds: input.default_rest_seconds ?? DEFAULT_REST_SECONDS,
    status: input.status ?? "draft",
    version: 1,
    parent_template_id: input.parent_template_id ?? null,
    is_favorite: input.is_favorite ?? false,
    last_used_at: null,
    usage_count: 0,
  };
  commit((s) => ({ ...s, templates: [...s.templates, record] }));
  return record;
}

export function updateTemplate(
  id: string,
  patch: Partial<WorkoutTemplate>,
): WorkoutTemplate | null {
  let updated: WorkoutTemplate | null = null;
  commit((s) => ({
    ...s,
    templates: s.templates.map((t) => {
      if (t.id !== id) return t;
      updated = { ...t, ...patch, id: t.id, updated_at: nowIso() };
      return updated;
    }),
  }));
  return updated;
}

export function toggleFavoriteTemplate(id: string): void {
  const t = getTemplate(id);
  if (!t) return;
  updateTemplate(id, { is_favorite: !t.is_favorite });
}

export function archiveTemplate(id: string): void {
  updateTemplate(id, { status: "archived" });
}

export function activateTemplate(id: string): void {
  updateTemplate(id, { status: "active" });
}

export function trashTemplate(id: string): void {
  updateTemplate(id, { status: "trashed", deleted_at: nowIso() });
}

export function restoreTemplate(id: string): void {
  updateTemplate(id, { status: "active", deleted_at: null });
}

/** שכפול — מעתיק מבנה מלא, מאפס מטא־דאטה של שימוש. */
export function duplicateTemplate(id: string, overrideName?: string): WorkoutTemplate | null {
  const src = getTemplate(id);
  if (!src) return null;
  const state = readTemplatesState();
  const srcBlocks = state.blocks.filter((b) => b.template_id === id && !b.deleted_at);
  const srcExercises = state.exercises.filter(
    (e) => srcBlocks.some((b) => b.id === e.block_id) && !e.deleted_at,
  );

  const newTemplate: WorkoutTemplate = {
    ...src,
    ...base(),
    name: (overrideName ?? `${src.name} (עותק)`).trim(),
    parent_template_id: src.id,
    version: 1,
    status: "draft",
    is_favorite: false,
    last_used_at: null,
    usage_count: 0,
  };

  const blockIdMap = new Map<string, string>();
  const newBlocks: WorkoutTemplateBlock[] = srcBlocks.map((b) => {
    const nb = { ...b, ...base(), template_id: newTemplate.id };
    blockIdMap.set(b.id, nb.id);
    return nb;
  });
  const newExercises: WorkoutTemplateExercise[] = srcExercises.map((e) => ({
    ...e,
    ...base(),
    block_id: blockIdMap.get(e.block_id)!,
  }));

  commit((s) => ({
    ...s,
    templates: [...s.templates, newTemplate],
    blocks: [...s.blocks, ...newBlocks],
    exercises: [...s.exercises, ...newExercises],
  }));
  return newTemplate;
}

// ---------- Blocks ----------

export function listBlocks(templateId: string): WorkoutTemplateBlock[] {
  return readTemplatesState()
    .blocks.filter((b) => b.template_id === templateId && !b.deleted_at)
    .sort((a, b) => a.sequence - b.sequence);
}

export function getBlock(id: string): WorkoutTemplateBlock | null {
  return readTemplatesState().blocks.find((b) => b.id === id) ?? null;
}

function defaultsForBlockType(type: BlockType): Pick<
  WorkoutTemplateBlock,
  "rounds" | "rest_between_exercises_seconds" | "rest_between_rounds_seconds" | "color_token"
> {
  switch (type) {
    case "superset":
      return {
        rounds: 3,
        rest_between_exercises_seconds: DEFAULT_INTRA_SUPERSET_REST_SECONDS,
        rest_between_rounds_seconds: DEFAULT_SUPERSET_ROUND_REST_SECONDS,
        color_token: "gym",
      };
    case "triset":
      return {
        rounds: 3,
        rest_between_exercises_seconds: DEFAULT_INTRA_SUPERSET_REST_SECONDS,
        rest_between_rounds_seconds: DEFAULT_SUPERSET_ROUND_REST_SECONDS,
        color_token: "primary",
      };
    case "circuit":
      return {
        rounds: 4,
        rest_between_exercises_seconds: DEFAULT_INTRA_SUPERSET_REST_SECONDS,
        rest_between_rounds_seconds: DEFAULT_SUPERSET_ROUND_REST_SECONDS,
        color_token: "info",
      };
    case "warmup":
      return {
        rounds: 1,
        rest_between_exercises_seconds: null,
        rest_between_rounds_seconds: null,
        color_token: "warning",
      };
    case "cooldown":
      return {
        rounds: 1,
        rest_between_exercises_seconds: null,
        rest_between_rounds_seconds: null,
        color_token: "success",
      };
    default:
      return {
        rounds: 1,
        rest_between_exercises_seconds: null,
        rest_between_rounds_seconds: null,
        color_token: null,
      };
  }
}

export function createBlock(templateId: string, input: Partial<NewBlock> = {}): WorkoutTemplateBlock {
  const existing = listBlocks(templateId);
  const sequence = input.sequence ?? existing.length;
  const type: BlockType = input.block_type ?? "single";
  const def = defaultsForBlockType(type);
  const record: WorkoutTemplateBlock = {
    ...base(),
    template_id: templateId,
    sequence,
    block_type: type,
    display_label: input.display_label ?? null,
    color_token: input.color_token ?? def.color_token,
    rounds: input.rounds ?? def.rounds,
    rest_between_exercises_seconds:
      input.rest_between_exercises_seconds ?? def.rest_between_exercises_seconds,
    rest_between_rounds_seconds:
      input.rest_between_rounds_seconds ?? def.rest_between_rounds_seconds,
    notes: input.notes ?? null,
  };
  commit((s) => ({ ...s, blocks: [...s.blocks, record] }));
  touchTemplate(templateId);
  return record;
}

export function updateBlock(id: string, patch: Partial<WorkoutTemplateBlock>): void {
  let templateId: string | null = null;
  commit((s) => ({
    ...s,
    blocks: s.blocks.map((b) => {
      if (b.id !== id) return b;
      templateId = b.template_id;
      return { ...b, ...patch, id: b.id, template_id: b.template_id, updated_at: nowIso() };
    }),
  }));
  if (templateId) touchTemplate(templateId);
}

export function removeBlock(id: string): void {
  const block = getBlock(id);
  if (!block) return;
  const now = nowIso();
  commit((s) => ({
    ...s,
    blocks: s.blocks
      .map((b) => (b.id === id ? { ...b, deleted_at: now, updated_at: now } : b))
      // רצף sequence מחדש
      .map((b) => {
        if (b.template_id !== block.template_id || b.deleted_at) return b;
        return b;
      }),
    exercises: s.exercises.map((e) =>
      e.block_id === id ? { ...e, deleted_at: now, updated_at: now } : e,
    ),
  }));
  reindexBlocks(block.template_id);
  touchTemplate(block.template_id);
}

/** מעביר בלוק למעלה או למטה. */
export function moveBlock(id: string, direction: "up" | "down"): void {
  const block = getBlock(id);
  if (!block) return;
  const siblings = listBlocks(block.template_id);
  const idx = siblings.findIndex((b) => b.id === id);
  if (idx < 0) return;
  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= siblings.length) return;
  const swap = siblings[targetIdx];
  updateBlock(block.id, { sequence: swap.sequence });
  updateBlock(swap.id, { sequence: block.sequence });
}

function reindexBlocks(templateId: string): void {
  const blocks = listBlocks(templateId);
  commit((s) => ({
    ...s,
    blocks: s.blocks.map((b) => {
      if (b.deleted_at || b.template_id !== templateId) return b;
      const target = blocks.findIndex((x) => x.id === b.id);
      if (target < 0 || target === b.sequence) return b;
      return { ...b, sequence: target };
    }),
  }));
}

// ---------- Template exercises ----------

export function listBlockExercises(blockId: string): WorkoutTemplateExercise[] {
  return readTemplatesState()
    .exercises.filter((e) => e.block_id === blockId && !e.deleted_at)
    .sort((a, b) => a.sequence - b.sequence);
}

export function listTemplateExercises(templateId: string): WorkoutTemplateExercise[] {
  const blockIds = new Set(listBlocks(templateId).map((b) => b.id));
  return readTemplatesState()
    .exercises.filter((e) => blockIds.has(e.block_id) && !e.deleted_at)
    .sort((a, b) => a.sequence - b.sequence);
}

export function addExerciseToBlock(
  blockId: string,
  input: Partial<NewTemplateExercise> & { exercise_id: string },
): WorkoutTemplateExercise {
  const siblings = listBlockExercises(blockId);
  const sequence = input.sequence ?? siblings.length;
  const record: WorkoutTemplateExercise = {
    ...base(),
    block_id: blockId,
    exercise_id: input.exercise_id,
    sequence,
    planned_sets: input.planned_sets ?? DEFAULT_SETS,
    planned_reps: input.planned_reps ?? DEFAULT_REPS,
    rep_range_min: input.rep_range_min ?? null,
    rep_range_max: input.rep_range_max ?? null,
    planned_weight: input.planned_weight ?? null,
    weight_unit: input.weight_unit ?? "kg",
    rest_seconds: input.rest_seconds ?? null,
    default_rpe: input.default_rpe ?? null,
    default_rir: input.default_rir ?? null,
    set_type: input.set_type ?? "regular",
    tempo: input.tempo ?? null,
    notes: input.notes ?? null,
    alternate_exercise_ids: input.alternate_exercise_ids ?? [],
  };
  commit((s) => ({ ...s, exercises: [...s.exercises, record] }));
  const block = getBlock(blockId);
  if (block) touchTemplate(block.template_id);
  return record;
}

export function updateTemplateExercise(
  id: string,
  patch: Partial<WorkoutTemplateExercise>,
): void {
  let blockId: string | null = null;
  commit((s) => ({
    ...s,
    exercises: s.exercises.map((e) => {
      if (e.id !== id) return e;
      blockId = e.block_id;
      return { ...e, ...patch, id: e.id, block_id: e.block_id, updated_at: nowIso() };
    }),
  }));
  if (blockId) {
    const b = getBlock(blockId);
    if (b) touchTemplate(b.template_id);
  }
}

export function removeTemplateExercise(id: string): void {
  const now = nowIso();
  let blockId: string | null = null;
  commit((s) => ({
    ...s,
    exercises: s.exercises.map((e) => {
      if (e.id !== id) return e;
      blockId = e.block_id;
      return { ...e, deleted_at: now, updated_at: now };
    }),
  }));
  if (blockId) {
    reindexBlockExercises(blockId);
    const b = getBlock(blockId);
    if (b) touchTemplate(b.template_id);
  }
}

export function moveTemplateExercise(id: string, direction: "up" | "down"): void {
  const state = readTemplatesState();
  const target = state.exercises.find((e) => e.id === id);
  if (!target) return;
  const siblings = listBlockExercises(target.block_id);
  const idx = siblings.findIndex((e) => e.id === id);
  if (idx < 0) return;
  const nextIdx = direction === "up" ? idx - 1 : idx + 1;
  if (nextIdx < 0 || nextIdx >= siblings.length) return;
  const swap = siblings[nextIdx];
  updateTemplateExercise(id, { sequence: swap.sequence });
  updateTemplateExercise(swap.id, { sequence: target.sequence });
}

/** מעביר תרגיל לבלוק אחר (שימוש בהוצאה מסופרסט או העברה בין בלוקים). */
export function moveExerciseToBlock(exerciseId: string, targetBlockId: string): void {
  const state = readTemplatesState();
  const ex = state.exercises.find((e) => e.id === exerciseId);
  if (!ex || ex.block_id === targetBlockId) return;
  const oldBlockId = ex.block_id;
  const targetSiblings = listBlockExercises(targetBlockId);
  updateTemplateExercise(exerciseId, {
    block_id: targetBlockId,
    sequence: targetSiblings.length,
  });
  reindexBlockExercises(oldBlockId);
}

function reindexBlockExercises(blockId: string): void {
  const list = listBlockExercises(blockId);
  commit((s) => ({
    ...s,
    exercises: s.exercises.map((e) => {
      if (e.deleted_at || e.block_id !== blockId) return e;
      const target = list.findIndex((x) => x.id === e.id);
      if (target < 0 || target === e.sequence) return e;
      return { ...e, sequence: target };
    }),
  }));
}

// ---------- Superset composition ----------

/**
 * יוצר בלוק סופרסט חדש בסוף התבנית ומעביר את התרגילים הנתונים לתוכו.
 * שימושי כשהמשתמש בוחר "צור סופרסט מתרגילים אלו".
 */
export function createSupersetFromExercises(
  templateId: string,
  exerciseIds: string[],
  label?: string,
): WorkoutTemplateBlock | null {
  if (exerciseIds.length < 2) return null;
  const block = createBlock(templateId, {
    block_type: "superset",
    display_label: label ?? null,
  });
  exerciseIds.forEach((exId, i) => {
    updateTemplateExercise(exId, { block_id: block.id, sequence: i });
  });
  // reindex old blocks
  const oldBlocks = new Set(
    readTemplatesState()
      .exercises.filter((e) => exerciseIds.includes(e.id))
      .map((e) => e.block_id),
  );
  oldBlocks.forEach((bId) => reindexBlockExercises(bId));
  return block;
}

// ---------- Version helpers ----------

export function listVersions(templateId: string): WorkoutTemplateVersion[] {
  return readTemplatesState()
    .versions.filter((v) => v.template_id === templateId)
    .sort((a, b) => b.version - a.version);
}

export function saveVersion(templateId: string, reason?: string): WorkoutTemplateVersion | null {
  const snapshot = buildTemplateSnapshot(templateId);
  if (!snapshot) return null;
  const template = getTemplate(templateId);
  if (!template) return null;
  const record: WorkoutTemplateVersion = {
    id: newId(),
    template_id: templateId,
    owner_id: CURRENT_OWNER_ID,
    version: template.version,
    reason: reason ?? null,
    created_at: nowIso(),
    snapshot,
  };
  commit((s) => ({ ...s, versions: [...s.versions, record] }));
  updateTemplate(templateId, { version: template.version + 1 });
  return record;
}

// ---------- Internal helpers ----------

function touchTemplate(templateId: string): void {
  commit((s) => ({
    ...s,
    templates: s.templates.map((t) =>
      t.id === templateId ? { ...t, updated_at: nowIso() } : t,
    ),
  }));
}

export function markTemplateUsed(templateId: string): void {
  const t = getTemplate(templateId);
  if (!t) return;
  updateTemplate(templateId, {
    last_used_at: nowIso(),
    usage_count: t.usage_count + 1,
  });
}
