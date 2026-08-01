/**
 * Sync state — recorded SEPARATELY from all domain data.
 *
 * This module owns exactly one key, `fitlog:sync-state:v1`. That key is not a
 * `StorageModule`, so it is invisible to the backup/export format, to the local
 * schema version, to migration snapshots and to rollback. Nothing here ever
 * reads, rewrites, clears or removes a domain `fitlog:*` key.
 *
 * Uploading is additive and never destructive: after a successful upload the
 * local data stays exactly where it was. All that changes is a marker saying
 * "these ids were uploaded for this user".
 */
import { safeReadStorage, safeWriteStorage, reportWrite } from "@/lib/storage/safeStorage";

export const SYNC_STATE_KEY = "fitlog:sync-state:v1";
export const SYNC_STATE_VERSION = "1.0.0";

export type SyncStatus =
  /** Supabase not configured, or nobody signed in. Pure local mode. */
  | "local_only"
  /** Signed in, nothing uploaded yet. */
  | "not_synced"
  /** An upload ran and everything it attempted succeeded. */
  | "synced"
  /** An upload ran and some rows were skipped or conflicted. */
  | "partial"
  /** The last upload failed outright (network, auth, RLS). */
  | "failed";

export interface ModuleSyncRecord {
  /** Stable ids confirmed present in the cloud for this user. */
  uploadedIds: string[];
  lastUploadAt: string | null;
  lastResult: "ok" | "partial" | "failed" | null;
}

export interface SyncState {
  version: string;
  /** Which authenticated user this state belongs to. */
  userId: string | null;
  status: SyncStatus;
  modules: Record<string, ModuleSyncRecord>;
  lastError: string | null;
}

export const EMPTY_SYNC_STATE: SyncState = {
  version: SYNC_STATE_VERSION,
  userId: null,
  status: "local_only",
  modules: {},
  lastError: null,
};

function hydrate(raw: unknown): SyncState {
  const s = raw as Partial<SyncState> | null;
  if (!s || typeof s !== "object") return { ...EMPTY_SYNC_STATE };
  const modules: Record<string, ModuleSyncRecord> = {};
  const rawModules = (s.modules ?? {}) as Record<string, Partial<ModuleSyncRecord>>;
  for (const [name, rec] of Object.entries(rawModules)) {
    modules[name] = {
      uploadedIds: Array.isArray(rec?.uploadedIds) ? rec.uploadedIds.filter((v) => typeof v === "string") : [],
      lastUploadAt: typeof rec?.lastUploadAt === "string" ? rec.lastUploadAt : null,
      lastResult: rec?.lastResult ?? null,
    };
  }
  return {
    version: typeof s.version === "string" ? s.version : SYNC_STATE_VERSION,
    userId: typeof s.userId === "string" ? s.userId : null,
    status: (s.status as SyncStatus) ?? "local_only",
    modules,
    lastError: typeof s.lastError === "string" ? s.lastError : null,
  };
}

export function readSyncState(): SyncState {
  const raw = safeReadStorage(SYNC_STATE_KEY);
  if (raw === null) return { ...EMPTY_SYNC_STATE };
  try {
    return hydrate(JSON.parse(raw));
  } catch {
    return { ...EMPTY_SYNC_STATE };
  }
}

export function writeSyncState(next: SyncState): void {
  reportWrite("sync", safeWriteStorage(SYNC_STATE_KEY, next));
}

/**
 * Sync state is per-user. Reading it for a different user than the one it was
 * written for must not leak the previous user's uploaded ids, otherwise the
 * second user's first upload would be wrongly treated as already done.
 */
export function readSyncStateFor(userId: string): SyncState {
  const state = readSyncState();
  if (state.userId !== userId) {
    return { ...EMPTY_SYNC_STATE, userId, status: "not_synced" };
  }
  return state;
}

export function recordModuleUpload(
  userId: string,
  moduleName: string,
  uploadedIds: string[],
  result: "ok" | "partial" | "failed",
  at: string,
  error: string | null = null,
): SyncState {
  const current = readSyncStateFor(userId);
  const previous = current.modules[moduleName]?.uploadedIds ?? [];
  // Union, so a partial upload followed by a retry accumulates rather than
  // forgetting what already made it across.
  const merged = [...new Set([...previous, ...uploadedIds])].sort();

  const next: SyncState = {
    ...current,
    version: SYNC_STATE_VERSION,
    userId,
    modules: {
      ...current.modules,
      [moduleName]: { uploadedIds: merged, lastUploadAt: at, lastResult: result },
    },
    status: result === "ok" ? "synced" : result === "partial" ? "partial" : "failed",
    lastError: error,
  };
  writeSyncState(next);
  return next;
}

/** Ids already confirmed uploaded for this user — the duplicate-prevention set. */
export function uploadedIdsFor(userId: string, moduleName: string): Set<string> {
  return new Set(readSyncStateFor(userId).modules[moduleName]?.uploadedIds ?? []);
}

/** Test helper. Does not touch any domain key. */
export function _resetSyncStateForTests(): void {
  writeSyncState({ ...EMPTY_SYNC_STATE });
}
