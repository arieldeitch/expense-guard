/**
 * Runs repository — CRUD, drafts, soft delete, restore.
 * חתימות זהות למה שיהיה ב-Supabase repo. Provenance נשמר לכל שדה.
 */
import type {
  Provenance,
  RunSession,
  RunSessionInput,
  RunSegment,
  RunNumericField,
  RunningRoute,
  NewRunningRoute,
} from "./types";
import { CURRENT_OWNER_ID, readRunsState, writeRunsState, type RunsState } from "./storage";
import { computeCompleteness, paceFromTimeDistance, speedFromTimeDistance } from "./calc";

function nowIso(): string {
  return new Date().toISOString();
}
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- Runs ----------

function completenessOf(r: RunSessionInput | RunSession): number {
  return computeCompleteness([
    r.duration_seconds,
    r.distance_meters,
    r.average_pace_s_per_km,
    r.average_speed_kmh,
    r.average_heart_rate,
    r.calories,
    r.perceived_effort,
    r.average_incline_pct,
  ]);
}

/** ממלא derived חסרים ומסמן provenance='derived' עבורם. אינו דורס ערכים manual. */
export function derive(r: RunSessionInput): RunSessionInput {
  const prov: Provenance = { ...r.provenance };
  let { average_pace_s_per_km, average_speed_kmh } = r;

  const isDerivable = (field: RunNumericField, current: number | null) => {
    if (current != null) return false;
    const src = prov[field];
    // don't overwrite manual/device/suunto values; but current==null so nothing to overwrite
    return src == null || src === "derived";
  };

  if (r.duration_seconds && r.distance_meters) {
    if (isDerivable("average_pace_s_per_km", average_pace_s_per_km)) {
      average_pace_s_per_km = paceFromTimeDistance(r.duration_seconds, r.distance_meters);
      if (average_pace_s_per_km != null) prov.average_pace_s_per_km = "derived";
    }
    if (isDerivable("average_speed_kmh", average_speed_kmh)) {
      average_speed_kmh = speedFromTimeDistance(r.duration_seconds, r.distance_meters);
      if (average_speed_kmh != null) prov.average_speed_kmh = "derived";
    }
  }

  return { ...r, average_pace_s_per_km, average_speed_kmh, provenance: prov };
}

export function listRuns(): RunSession[] {
  return readRunsState().runs;
}

export function getRun(id: string): RunSession | null {
  return readRunsState().runs.find((r) => r.id === id) ?? null;
}

export function createRun(input: RunSessionInput): RunSession {
  const state = readRunsState();
  const enriched = derive(input);
  const now = nowIso();
  const record: RunSession = {
    ...enriched,
    id: newId(),
    owner_id: CURRENT_OWNER_ID,
    data_completeness: completenessOf(enriched),
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  writeRunsState({
    ...state,
    runs: [...state.runs, record],
    lastUsed: {
      run_type: record.run_type,
      location_id: record.location_id ?? state.lastUsed.location_id,
      treadmill_id: record.treadmill_id ?? state.lastUsed.treadmill_id,
      route_id: record.route_id ?? state.lastUsed.route_id,
      country_code: record.country_code ?? state.lastUsed.country_code,
      city_or_area: record.city_or_area ?? state.lastUsed.city_or_area,
    },
  });
  return record;
}

export function updateRun(
  id: string,
  patch: Partial<Omit<RunSession, "id" | "owner_id" | "created_at">>,
): RunSession | null {
  const state = readRunsState();
  const idx = state.runs.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const prev = state.runs[idx];
  const mergedInput = { ...prev, ...patch } as RunSession;
  const derived = derive(mergedInput);
  const merged: RunSession = {
    ...derived,
    id: prev.id,
    owner_id: prev.owner_id,
    created_at: prev.created_at,
    deleted_at: patch.deleted_at !== undefined ? patch.deleted_at : prev.deleted_at,
    data_completeness: completenessOf(derived),
    updated_at: nowIso(),
  };
  const next = state.runs.slice();
  next[idx] = merged;
  writeRunsState({ ...state, runs: next });
  return merged;
}

/** Soft delete → מעביר לסל מחזור. */
export function softDeleteRun(id: string): boolean {
  const state = readRunsState();
  const idx = state.runs.findIndex((r) => r.id === id);
  if (idx < 0) return false;
  const next = state.runs.slice();
  next[idx] = { ...next[idx], deleted_at: nowIso(), updated_at: nowIso() };
  writeRunsState({ ...state, runs: next });
  return true;
}

export function restoreRun(id: string): boolean {
  const state = readRunsState();
  const idx = state.runs.findIndex((r) => r.id === id);
  if (idx < 0) return false;
  const next = state.runs.slice();
  next[idx] = { ...next[idx], deleted_at: null, updated_at: nowIso() };
  writeRunsState({ ...state, runs: next });
  return true;
}

export function archiveRun(id: string): boolean {
  return !!updateRun(id, { status: "archived" });
}
export function unarchiveRun(id: string): boolean {
  return !!updateRun(id, { status: "completed" });
}

export function purgeRun(id: string): boolean {
  const state = readRunsState();
  const target = state.runs.find((r) => r.id === id);
  if (!target || target.deleted_at == null) return false;
  writeRunsState({ ...state, runs: state.runs.filter((r) => r.id !== id) });
  return true;
}

/** שכפול — לא מעתיק תאריך, שעה, ולא ערכי ביצוע. */
export function duplicateRun(id: string): RunSession | null {
  const src = getRun(id);
  if (!src) return null;
  const now = new Date();
  const input: RunSessionInput = {
    run_type: src.run_type,
    status: "draft",
    started_at: now.toISOString(),
    ended_at: null,
    timezone: src.timezone,
    duration_seconds: null,
    distance_meters: null,
    average_speed_kmh: null,
    max_speed_kmh: null,
    average_pace_s_per_km: null,
    average_incline_pct: null,
    max_incline_pct: null,
    calories: null,
    average_heart_rate: null,
    max_heart_rate: null,
    average_cadence_spm: null,
    elevation_gain_m: null,
    elevation_loss_m: null,
    location_id: src.location_id,
    treadmill_id: src.treadmill_id,
    route_id: src.route_id,
    country_code: src.country_code,
    city_or_area: src.city_or_area,
    free_text_location: src.free_text_location,
    perceived_effort: null,
    notes: null,
    segments: src.segments.map((s, i) => ({
      ...s,
      id: newId(),
      sequence: i,
      duration_seconds: null,
      distance_meters: null,
      average_speed_kmh: null,
      average_pace_s_per_km: null,
    })),
    provenance: {},
    outlier_overrides: [],
    data_completeness: 0,
    primary_source: "manual",
  };
  return createRun(input);
}

// ---------- Segments ----------
export function newSegment(seq: number, type: RunSegment["segment_type"] = "work"): RunSegment {
  return {
    id: newId(),
    sequence: seq,
    segment_type: type,
    duration_seconds: null,
    distance_meters: null,
    average_speed_kmh: null,
    average_pace_s_per_km: null,
    incline_pct: null,
    notes: null,
  };
}

/** מחשב סכומי מקטעים. */
export function sumSegments(segments: RunSegment[]) {
  let d = 0;
  let m = 0;
  let hasDuration = false;
  let hasDistance = false;
  for (const s of segments) {
    if (s.duration_seconds != null) {
      d += s.duration_seconds;
      hasDuration = true;
    }
    if (s.distance_meters != null) {
      m += s.distance_meters;
      hasDistance = true;
    }
  }
  return {
    duration_seconds: hasDuration ? d : null,
    distance_meters: hasDistance ? m : null,
    average_pace_s_per_km: hasDuration && hasDistance && m > 0 ? paceFromTimeDistance(d, m) : null,
  };
}

// ---------- Running Routes ----------

export function listRoutes(): RunningRoute[] {
  return readRunsState().routes;
}
export function getRoute(id: string): RunningRoute | null {
  return readRunsState().routes.find((r) => r.id === id) ?? null;
}
export function createRoute(input: NewRunningRoute): RunningRoute {
  const state = readRunsState();
  const now = nowIso();
  const record: RunningRoute = {
    ...input,
    id: newId(),
    owner_id: CURRENT_OWNER_ID,
    is_favorite: input.is_favorite ?? false,
    is_active: input.is_active ?? true,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  writeRunsState({ ...state, routes: [...state.routes, record] });
  return record;
}
export function updateRoute(
  id: string,
  patch: Partial<Omit<RunningRoute, "id" | "owner_id" | "created_at">>,
): RunningRoute | null {
  const state = readRunsState();
  const idx = state.routes.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const merged: RunningRoute = { ...state.routes[idx], ...patch, updated_at: nowIso() };
  const next = state.routes.slice();
  next[idx] = merged;
  writeRunsState({ ...state, routes: next });
  return merged;
}
export function softDeleteRoute(id: string): boolean {
  return !!updateRoute(id, { deleted_at: nowIso() });
}
export function restoreRoute(id: string): boolean {
  return !!updateRoute(id, { deleted_at: null });
}
export function archiveRoute(id: string): boolean {
  return !!updateRoute(id, { is_active: false });
}

// ---------- Drafts ----------
export function listDrafts(): RunSession[] {
  return readRunsState().runs.filter((r) => r.status === "draft" && r.deleted_at == null);
}

// ---------- Last-used ----------
export function getLastUsed(): RunsState["lastUsed"] {
  return readRunsState().lastUsed;
}
