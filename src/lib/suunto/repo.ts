/**
 * Repository — CRUD על readings, calibrations ו-exclusions.
 * שומר raw + normalized בנפרד. כל mutation מייצר timestamp חדש.
 *
 * מבנה עבודה מרכזי:
 *   `upsertSuuntoSnapshot(runId, snapshot, meta)` = החלפה אטומית של כל
 *   ה-rows של source_type='suunto' עבור הריצה. מבטיח עקביות ומונע כפילויות.
 */
import type {
  RunDeviceReading,
  DeviceRunSnapshot,
  DeviceSourceType,
  MetricKey,
  Unit,
  TreadmillCalibrationProfile,
  CalibrationExclusion,
  NewRunDeviceReading,
} from "./types";
import { CURRENT_OWNER_ID, readSuuntoState, writeSuuntoState } from "./storage";
import { CUSTOM_PREFIX, isCustomKey, metricDef } from "./metrics";
import { paceFromTimeDistance, speedFromTimeDistance } from "@/lib/runs/calc";

function nowIso(): string {
  return new Date().toISOString();
}
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- Readings ----------

export function listReadings(runId?: string, source?: DeviceSourceType): RunDeviceReading[] {
  const all = readSuuntoState().readings;
  return all.filter((r) => {
    if (runId && r.run_session_id !== runId) return false;
    if (source && r.source_type !== source) return false;
    return true;
  });
}

export function listActiveReadings(runId: string, source: DeviceSourceType) {
  return listReadings(runId, source).filter((r) => r.deleted_at == null);
}

export function createReading(input: NewRunDeviceReading): RunDeviceReading {
  const state = readSuuntoState();
  const now = nowIso();
  const record: RunDeviceReading = {
    ...input,
    id: newId(),
    owner_id: CURRENT_OWNER_ID,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  writeSuuntoState({ ...state, readings: [...state.readings, record] });
  return record;
}

export function updateReading(
  id: string,
  patch: Partial<Omit<RunDeviceReading, "id" | "owner_id" | "created_at">>,
): RunDeviceReading | null {
  const state = readSuuntoState();
  const idx = state.readings.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const next = state.readings.slice();
  next[idx] = { ...next[idx], ...patch, updated_at: nowIso() };
  writeSuuntoState({ ...state, readings: next });
  return next[idx];
}

/** מחיקה רכה של רשומה בודדת. */
export function softDeleteReading(id: string): boolean {
  return !!updateReading(id, { deleted_at: nowIso() });
}
export function restoreReading(id: string): boolean {
  return !!updateReading(id, { deleted_at: null });
}
export function purgeReading(id: string): boolean {
  const state = readSuuntoState();
  const r = state.readings.find((x) => x.id === id);
  if (!r || r.deleted_at == null) return false;
  writeSuuntoState({ ...state, readings: state.readings.filter((x) => x.id !== id) });
  return true;
}

// ---------- Snapshot helpers ----------

/**
 * מנרמל snapshot ל-rows. משלים pace/speed נגזרים רק כאשר יש מרחק+זמן ואין ערך מקורי.
 * ערך מקורי (למשל אם המשתמש הזין קצב ישירות) לעולם לא נדרס.
 */
function snapshotToRows(
  runId: string,
  source: DeviceSourceType,
  snap: DeviceRunSnapshot,
  meta: { input_method?: NewRunDeviceReading["input_method"]; confidence?: number },
): NewRunDeviceReading[] {
  const rows: NewRunDeviceReading[] = [];
  const base = {
    run_session_id: runId,
    source_type: source,
    device_name: snap.device_name,
    device_model: snap.device_model,
    captured_at: snap.entered_at,
    entered_at: nowIso(),
    input_method: meta.input_method ?? "manual",
    confidence: meta.confidence ?? 1,
    metadata: {},
  } as const;

  const push = (
    key: MetricKey,
    normalized: number | null,
    raw: number | string | null,
    unit: Unit,
    rawUnit: string | null,
    metadata: Record<string, unknown> = {},
  ) => {
    if (normalized == null && raw == null) return;
    rows.push({
      ...base,
      metric_key: key,
      raw_value: raw,
      normalized_value: normalized,
      unit,
      raw_unit: rawUnit,
      metadata,
    });
  };

  // core
  push("distance_meters", snap.distance_meters, snap.distance_meters, "m", "m");
  push("duration_seconds", snap.duration_seconds, snap.duration_seconds, "s", "s");
  // pace + speed: אם המשתמש לא הזין ידנית, נגזר ממרחק+זמן. שני הערכים "מנורמלים"; ה-raw זהה.
  let pace = snap.average_pace_s_per_km;
  let speed = snap.average_speed_kmh;
  if (pace == null && snap.duration_seconds != null && snap.distance_meters != null) {
    pace = paceFromTimeDistance(snap.duration_seconds, snap.distance_meters);
  }
  if (speed == null && snap.duration_seconds != null && snap.distance_meters != null) {
    speed = speedFromTimeDistance(snap.duration_seconds, snap.distance_meters);
  }
  push("average_pace_s_per_km", pace, snap.average_pace_s_per_km, "s_per_km", "s/km", {
    derived: snap.average_pace_s_per_km == null && pace != null,
  });
  push("average_speed_kmh", speed, snap.average_speed_kmh, "kmh", "km/h", {
    derived: snap.average_speed_kmh == null && speed != null,
  });
  push("max_speed_kmh", snap.max_speed_kmh, snap.max_speed_kmh, "kmh", "km/h");

  push("average_heart_rate", snap.average_heart_rate, snap.average_heart_rate, "bpm", "bpm");
  push("max_heart_rate", snap.max_heart_rate, snap.max_heart_rate, "bpm", "bpm");
  push("average_cadence_spm", snap.average_cadence_spm, snap.average_cadence_spm, "spm", "spm");
  push("calories", snap.calories, snap.calories, "kcal", "kcal");

  push("training_effect", snap.training_effect, snap.training_effect, "index", "/5");
  push("peak_training_effect", snap.peak_training_effect, snap.peak_training_effect, "index", "/5");
  push("epoc_ml_kg", snap.epoc_ml_kg, snap.epoc_ml_kg, "ml_kg", "ml/kg");
  push("recovery_time_hours", snap.recovery_time_hours, snap.recovery_time_hours, "hours", "h");

  push("ascent_m", snap.ascent_m, snap.ascent_m, "m", "m");
  push("descent_m", snap.descent_m, snap.descent_m, "m", "m");

  if (snap.notes && snap.notes.trim() !== "") {
    rows.push({
      ...base,
      metric_key: "notes",
      raw_value: snap.notes,
      normalized_value: null,
      unit: "text",
      raw_unit: null,
      metadata: {},
    });
  }

  for (const c of snap.custom) {
    rows.push({
      ...base,
      metric_key: c.key,
      raw_value: c.value,
      normalized_value: typeof c.value === "number" && Number.isFinite(c.value) ? c.value : null,
      unit: "custom",
      raw_unit: c.unit,
      metadata: { label: c.label },
    });
  }
  return rows;
}

/**
 * החלפה אטומית של snapshot למקור נתון. משמר rows מ-source_type אחרים.
 * rows קיימים מ-source הנוכחי נמחקים מלוגית (deleted_at) ולא ב-hard delete.
 * אם הקורא מבקש "החלפה מלאה", ה-rows הישנים מסומנים deleted_at.
 */
export function upsertSuuntoSnapshot(
  runId: string,
  snap: DeviceRunSnapshot,
  meta: { input_method?: NewRunDeviceReading["input_method"]; confidence?: number } = {},
): RunDeviceReading[] {
  const state = readSuuntoState();
  const now = nowIso();
  const kept = state.readings.map((r) =>
    r.run_session_id === runId && r.source_type === snap.source_type && r.deleted_at == null
      ? { ...r, deleted_at: now, updated_at: now }
      : r,
  );
  const newRows = snapshotToRows(runId, snap.source_type, snap, meta).map<RunDeviceReading>(
    (row) => ({
      ...row,
      id: newId(),
      owner_id: CURRENT_OWNER_ID,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    }),
  );
  writeSuuntoState({ ...state, readings: [...kept, ...newRows] });
  return newRows;
}

/** מוחק soft את כל ה-rows של source עבור הריצה. */
export function softDeleteSuuntoForRun(runId: string, source: DeviceSourceType): number {
  const state = readSuuntoState();
  const now = nowIso();
  let count = 0;
  const next = state.readings.map((r) => {
    if (r.run_session_id === runId && r.source_type === source && r.deleted_at == null) {
      count++;
      return { ...r, deleted_at: now, updated_at: now };
    }
    return r;
  });
  if (count > 0) writeSuuntoState({ ...state, readings: next });
  return count;
}

/** משחזר את הגרסה האחרונה שנמחקה עבור source (לפי updated_at חדש ביותר). */
export function restoreSuuntoForRun(runId: string, source: DeviceSourceType): number {
  const state = readSuuntoState();
  const trashed = state.readings.filter(
    (r) => r.run_session_id === runId && r.source_type === source && r.deleted_at != null,
  );
  if (trashed.length === 0) return 0;
  const latest = trashed.reduce((a, b) => (a.updated_at > b.updated_at ? a : b));
  const cohortDeletedAt = latest.deleted_at!;
  const now = nowIso();
  let count = 0;
  const next = state.readings.map((r) => {
    if (
      r.run_session_id === runId &&
      r.source_type === source &&
      r.deleted_at === cohortDeletedAt
    ) {
      count++;
      return { ...r, deleted_at: null, updated_at: now };
    }
    return r;
  });
  if (count > 0) writeSuuntoState({ ...state, readings: next });
  return count;
}

/** בונה snapshot מ-rows. rows של notes ו-custom נטמעים ב-snapshot. */
export function buildSnapshot(runId: string, source: DeviceSourceType): DeviceRunSnapshot | null {
  const rows = listActiveReadings(runId, source);
  if (rows.length === 0) return null;
  const num = (key: string) => rows.find((r) => r.metric_key === key)?.normalized_value ?? null;
  const notesRow = rows.find((r) => r.metric_key === "notes");
  const custom = rows
    .filter((r) => isCustomKey(r.metric_key))
    .map((r) => ({
      key: r.metric_key,
      label: (r.metadata?.label as string) ?? r.metric_key.slice(CUSTOM_PREFIX.length),
      value:
        r.normalized_value ??
        (typeof r.raw_value === "number" || typeof r.raw_value === "string" ? r.raw_value : ""),
      unit: r.raw_unit,
    }));
  const head = rows[0];
  return {
    source_type: source,
    device_name: head.device_name,
    device_model: head.device_model,
    entered_at: rows.map((r) => r.entered_at).sort()[rows.length - 1] ?? null,
    distance_meters: num("distance_meters"),
    duration_seconds: num("duration_seconds"),
    average_pace_s_per_km: num("average_pace_s_per_km"),
    average_speed_kmh: num("average_speed_kmh"),
    max_speed_kmh: num("max_speed_kmh"),
    average_heart_rate: num("average_heart_rate"),
    max_heart_rate: num("max_heart_rate"),
    average_cadence_spm: num("average_cadence_spm"),
    calories: num("calories"),
    training_effect: num("training_effect"),
    peak_training_effect: num("peak_training_effect"),
    epoc_ml_kg: num("epoc_ml_kg"),
    recovery_time_hours: num("recovery_time_hours"),
    ascent_m: num("ascent_m"),
    descent_m: num("descent_m"),
    notes: typeof notesRow?.raw_value === "string" ? notesRow.raw_value : null,
    custom,
  };
}

/** קיצור: מחזיר snapshot של Suunto לריצה, או null. */
export function getSuuntoSnapshot(runId: string): DeviceRunSnapshot | null {
  return buildSnapshot(runId, "suunto");
}

/** האם קיים snapshot של source לריצה (פעיל, לא בסל). */
export function hasSource(runId: string, source: DeviceSourceType): boolean {
  return listActiveReadings(runId, source).length > 0;
}

/** האם יש rows מחוקים של source לריצה — לצורך אפשרות שחזור. */
export function hasTrashedSource(runId: string, source: DeviceSourceType): boolean {
  return listReadings(runId, source).some((r) => r.deleted_at != null);
}

// ---------- Calibrations ----------

export function listCalibrations(treadmillId?: string): TreadmillCalibrationProfile[] {
  const all = readSuuntoState().calibrations;
  return treadmillId ? all.filter((c) => c.treadmill_id === treadmillId) : all;
}
export function getCalibration(id: string): TreadmillCalibrationProfile | null {
  return readSuuntoState().calibrations.find((c) => c.id === id) ?? null;
}
export function getActiveCalibration(treadmillId: string): TreadmillCalibrationProfile | null {
  return (
    readSuuntoState().calibrations.find(
      (c) => c.treadmill_id === treadmillId && c.status === "approved" && c.deleted_at == null,
    ) ?? null
  );
}
export function createCalibration(
  input: Omit<
    TreadmillCalibrationProfile,
    "id" | "owner_id" | "created_at" | "updated_at" | "deleted_at"
  >,
): TreadmillCalibrationProfile {
  const state = readSuuntoState();
  const now = nowIso();
  const record: TreadmillCalibrationProfile = {
    ...input,
    id: newId(),
    owner_id: CURRENT_OWNER_ID,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  writeSuuntoState({ ...state, calibrations: [...state.calibrations, record] });
  return record;
}
export function updateCalibration(
  id: string,
  patch: Partial<Omit<TreadmillCalibrationProfile, "id" | "owner_id" | "created_at">>,
): TreadmillCalibrationProfile | null {
  const state = readSuuntoState();
  const idx = state.calibrations.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const next = state.calibrations.slice();
  next[idx] = { ...next[idx], ...patch, updated_at: nowIso() };
  writeSuuntoState({ ...state, calibrations: next });
  return next[idx];
}

/**
 * אישור פרופיל: מעביר את הפרופיל ל-approved, ואת הפרופיל הפעיל הקודם
 * (אם קיים) ל-superseded. אינו נוגע ב-raw data או בריצות עצמן.
 */
export function approveCalibration(id: string): TreadmillCalibrationProfile | null {
  const target = getCalibration(id);
  if (!target) return null;
  const state = readSuuntoState();
  const now = nowIso();
  const next = state.calibrations.map((c) => {
    if (c.id === id)
      return { ...c, status: "approved" as const, approved_at: now, updated_at: now };
    if (c.treadmill_id === target.treadmill_id && c.status === "approved" && c.id !== id) {
      return { ...c, status: "superseded" as const, updated_at: now };
    }
    return c;
  });
  writeSuuntoState({ ...state, calibrations: next });
  return next.find((c) => c.id === id) ?? null;
}

/** rollback: מבטל את האישור. ניתן לאשר שוב או ליצור חדש. */
export function revokeCalibration(id: string): TreadmillCalibrationProfile | null {
  return updateCalibration(id, { status: "revoked", revoked_at: nowIso() });
}
export function archiveCalibration(id: string): boolean {
  return !!updateCalibration(id, { status: "archived" });
}
export function softDeleteCalibration(id: string): boolean {
  return !!updateCalibration(id, { deleted_at: nowIso() });
}

// ---------- Exclusions ----------

export function listExclusions(treadmillId: string): CalibrationExclusion[] {
  return readSuuntoState().exclusions.filter((e) => e.treadmill_id === treadmillId);
}
export function isExcluded(treadmillId: string, runId: string): boolean {
  return listExclusions(treadmillId).some((e) => e.run_session_id === runId);
}
export function excludeRun(
  treadmillId: string,
  runId: string,
  reason: string | null,
): CalibrationExclusion {
  const state = readSuuntoState();
  const record: CalibrationExclusion = {
    id: newId(),
    owner_id: CURRENT_OWNER_ID,
    treadmill_id: treadmillId,
    run_session_id: runId,
    reason,
    created_at: nowIso(),
  };
  writeSuuntoState({ ...state, exclusions: [...state.exclusions, record] });
  return record;
}
export function includeRun(treadmillId: string, runId: string): number {
  const state = readSuuntoState();
  const before = state.exclusions.length;
  const next = state.exclusions.filter(
    (e) => !(e.treadmill_id === treadmillId && e.run_session_id === runId),
  );
  writeSuuntoState({ ...state, exclusions: next });
  return before - next.length;
}

/** נקודת עזר: מוחק soft כל calibrations של הליכון (למשל מחיקת ההליכון). */
export function softDeleteAllCalibrationsForTreadmill(treadmillId: string): number {
  const state = readSuuntoState();
  const now = nowIso();
  let n = 0;
  const next = state.calibrations.map((c) => {
    if (c.treadmill_id === treadmillId && c.deleted_at == null) {
      n++;
      return { ...c, deleted_at: now, updated_at: now };
    }
    return c;
  });
  if (n > 0) writeSuuntoState({ ...state, calibrations: next });
  return n;
}

export const CUSTOM_METRIC_PREFIX = CUSTOM_PREFIX;
export { metricDef };
