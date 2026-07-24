/**
 * Repository — פעולות CRUD על catalog state.
 * מייצר id/timestamps, מטפל ב־soft delete, archive, restore.
 * שומר invariants (ברירת מחדל אחת בלבד למקום ברירת מחדל).
 *
 * חוזה זה מיושר לחוזה שיהיה ל־Supabase repo בעתיד — פונקציות זהות בשם וב־signature.
 */
import type {
  CatalogRecordBase,
  EquipmentItem,
  NewEquipment,
  NewLocation,
  NewTreadmill,
  TrainingLocation,
  TreadmillProfile,
} from "./types";
import { normalizeName } from "./schemas";
import {
  CURRENT_OWNER_ID,
  readCatalogState,
  writeCatalogState,
  type CatalogState,
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

function baseFields(): Pick<
  CatalogRecordBase,
  "id" | "owner_id" | "is_favorite" | "is_active" | "created_at" | "updated_at" | "deleted_at"
> {
  const now = nowIso();
  return {
    id: newId(),
    owner_id: CURRENT_OWNER_ID,
    is_favorite: false,
    is_active: true,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}

// ---------- Locations ----------

export function listLocations(): TrainingLocation[] {
  return sortLocations(readCatalogState().locations);
}

export function getLocation(id: string): TrainingLocation | null {
  return readCatalogState().locations.find((l) => l.id === id) ?? null;
}

export function createLocation(input: NewLocation): TrainingLocation {
  const state = readCatalogState();
  const now = nowIso();
  const record: TrainingLocation = {
    ...baseFields(),
    ...input,
    is_favorite: input.is_favorite ?? false,
    is_default: input.is_default ?? false,
    created_at: now,
    updated_at: now,
  };
  const nextLocations = maybeApplyDefault(
    [...state.locations, record],
    record.is_default ? record.id : null,
  );
  writeCatalogState({ ...state, locations: nextLocations });
  return getLocation(record.id)!;
}

export function updateLocation(
  id: string,
  patch: Partial<Omit<TrainingLocation, "id" | "owner_id" | "created_at">>,
): TrainingLocation | null {
  const state = readCatalogState();
  const idx = state.locations.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  const merged: TrainingLocation = {
    ...state.locations[idx],
    ...patch,
    updated_at: nowIso(),
  };
  let locations = state.locations.slice();
  locations[idx] = merged;
  if (patch.is_default === true) {
    locations = maybeApplyDefault(locations, id);
  } else if (patch.is_default === false) {
    locations[idx] = { ...merged, is_default: false };
  }
  writeCatalogState({ ...state, locations });
  return locations[idx];
}

export function setDefaultLocation(id: string): void {
  const state = readCatalogState();
  const locations = maybeApplyDefault(state.locations, id);
  writeCatalogState({ ...state, locations });
}

export function toggleFavoriteLocation(id: string): void {
  const state = readCatalogState();
  const idx = state.locations.findIndex((l) => l.id === id);
  if (idx < 0) return;
  const locations = state.locations.slice();
  locations[idx] = {
    ...locations[idx],
    is_favorite: !locations[idx].is_favorite,
    updated_at: nowIso(),
  };
  writeCatalogState({ ...state, locations });
}

/** ארכוב = is_active=false, אין מגע ב־deleted_at. שומר קשרים היסטוריים. */
export function archiveLocation(id: string): void {
  const state = readCatalogState();
  const idx = state.locations.findIndex((l) => l.id === id);
  if (idx < 0) return;
  const locations = state.locations.slice();
  locations[idx] = {
    ...locations[idx],
    is_active: false,
    is_default: false,
    updated_at: nowIso(),
  };
  writeCatalogState({ ...state, locations });
}

export function unarchiveLocation(id: string): void {
  const state = readCatalogState();
  const idx = state.locations.findIndex((l) => l.id === id);
  if (idx < 0) return;
  const locations = state.locations.slice();
  locations[idx] = { ...locations[idx], is_active: true, updated_at: nowIso() };
  writeCatalogState({ ...state, locations });
}

/** העברה לסל מחזור — soft delete. */
export function trashLocation(id: string): void {
  const state = readCatalogState();
  const now = nowIso();
  const idx = state.locations.findIndex((l) => l.id === id);
  if (idx < 0) return;
  const locations = state.locations.slice();
  locations[idx] = {
    ...locations[idx],
    deleted_at: now,
    is_active: false,
    is_default: false,
    updated_at: now,
  };
  writeCatalogState({ ...state, locations });
}

export function restoreLocation(id: string): void {
  const state = readCatalogState();
  const idx = state.locations.findIndex((l) => l.id === id);
  if (idx < 0) return;
  const locations = state.locations.slice();
  locations[idx] = {
    ...locations[idx],
    deleted_at: null,
    is_active: true,
    updated_at: nowIso(),
  };
  writeCatalogState({ ...state, locations });
}

/** מבטיח יחיד: רק location אחד יכול להיות default (בין הפעילים). */
function maybeApplyDefault(
  locations: TrainingLocation[],
  newDefaultId: string | null,
): TrainingLocation[] {
  if (!newDefaultId) return locations;
  return locations.map((l) => ({
    ...l,
    is_default: l.id === newDefaultId ? true : false,
    updated_at: l.id === newDefaultId || l.is_default ? nowIso() : l.updated_at,
  }));
}

function sortLocations(items: TrainingLocation[]): TrainingLocation[] {
  return items.slice().sort((a, b) => {
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return a.name.localeCompare(b.name, "he");
  });
}

// ---------- Treadmills ----------

export function listTreadmills(): TreadmillProfile[] {
  return sortTreadmills(readCatalogState().treadmills);
}

export function listTreadmillsInLocation(locationId: string): TreadmillProfile[] {
  return sortTreadmills(
    readCatalogState().treadmills.filter((t) => t.location_id === locationId),
  );
}

export function getTreadmill(id: string): TreadmillProfile | null {
  return readCatalogState().treadmills.find((t) => t.id === id) ?? null;
}

export function createTreadmill(input: NewTreadmill): TreadmillProfile {
  const state = readCatalogState();
  const now = nowIso();
  const record: TreadmillProfile = {
    ...baseFields(),
    ...input,
    is_favorite: input.is_favorite ?? false,
    first_used_at: null,
    last_used_at: null,
    created_at: now,
    updated_at: now,
  };
  writeCatalogState({ ...state, treadmills: [...state.treadmills, record] });
  return record;
}

export function updateTreadmill(
  id: string,
  patch: Partial<Omit<TreadmillProfile, "id" | "owner_id" | "created_at">>,
): TreadmillProfile | null {
  const state = readCatalogState();
  const idx = state.treadmills.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const merged: TreadmillProfile = {
    ...state.treadmills[idx],
    ...patch,
    updated_at: nowIso(),
  };
  const treadmills = state.treadmills.slice();
  treadmills[idx] = merged;
  writeCatalogState({ ...state, treadmills });
  return merged;
}

export function toggleFavoriteTreadmill(id: string): void {
  const state = readCatalogState();
  const idx = state.treadmills.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const treadmills = state.treadmills.slice();
  treadmills[idx] = {
    ...treadmills[idx],
    is_favorite: !treadmills[idx].is_favorite,
    updated_at: nowIso(),
  };
  writeCatalogState({ ...state, treadmills });
}

export function archiveTreadmill(id: string): void {
  applyRecordChange<TreadmillProfile>("treadmills", id, (r) => ({
    ...r,
    is_active: false,
    updated_at: nowIso(),
  }));
}

export function unarchiveTreadmill(id: string): void {
  applyRecordChange<TreadmillProfile>("treadmills", id, (r) => ({
    ...r,
    is_active: true,
    updated_at: nowIso(),
  }));
}

export function trashTreadmill(id: string): void {
  applyRecordChange<TreadmillProfile>("treadmills", id, (r) => ({
    ...r,
    deleted_at: nowIso(),
    is_active: false,
    updated_at: nowIso(),
  }));
}

export function restoreTreadmill(id: string): void {
  applyRecordChange<TreadmillProfile>("treadmills", id, (r) => ({
    ...r,
    deleted_at: null,
    is_active: true,
    updated_at: nowIso(),
  }));
}

function sortTreadmills(items: TreadmillProfile[]): TreadmillProfile[] {
  return items.slice().sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return a.display_name.localeCompare(b.display_name, "he");
  });
}

// ---------- Equipment ----------

export function listEquipment(): EquipmentItem[] {
  return sortEquipment(readCatalogState().equipment);
}

export function listEquipmentInLocation(locationId: string): EquipmentItem[] {
  return sortEquipment(
    readCatalogState().equipment.filter((e) => e.location_id === locationId),
  );
}

export function getEquipment(id: string): EquipmentItem | null {
  return readCatalogState().equipment.find((e) => e.id === id) ?? null;
}

export function createEquipment(input: NewEquipment): EquipmentItem {
  const state = readCatalogState();
  const now = nowIso();
  const record: EquipmentItem = {
    ...baseFields(),
    ...input,
    is_favorite: input.is_favorite ?? false,
    created_at: now,
    updated_at: now,
  };
  writeCatalogState({ ...state, equipment: [...state.equipment, record] });
  return record;
}

export function updateEquipment(
  id: string,
  patch: Partial<Omit<EquipmentItem, "id" | "owner_id" | "created_at">>,
): EquipmentItem | null {
  const state = readCatalogState();
  const idx = state.equipment.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const merged: EquipmentItem = { ...state.equipment[idx], ...patch, updated_at: nowIso() };
  const equipment = state.equipment.slice();
  equipment[idx] = merged;
  writeCatalogState({ ...state, equipment });
  return merged;
}

export function toggleFavoriteEquipment(id: string): void {
  applyRecordChange<EquipmentItem>("equipment", id, (r) => ({
    ...r,
    is_favorite: !r.is_favorite,
    updated_at: nowIso(),
  }));
}

export function archiveEquipment(id: string): void {
  applyRecordChange<EquipmentItem>("equipment", id, (r) => ({
    ...r,
    is_active: false,
    updated_at: nowIso(),
  }));
}

export function unarchiveEquipment(id: string): void {
  applyRecordChange<EquipmentItem>("equipment", id, (r) => ({
    ...r,
    is_active: true,
    updated_at: nowIso(),
  }));
}

export function trashEquipment(id: string): void {
  applyRecordChange<EquipmentItem>("equipment", id, (r) => ({
    ...r,
    deleted_at: nowIso(),
    is_active: false,
    updated_at: nowIso(),
  }));
}

export function restoreEquipment(id: string): void {
  applyRecordChange<EquipmentItem>("equipment", id, (r) => ({
    ...r,
    deleted_at: null,
    is_active: true,
    updated_at: nowIso(),
  }));
}

function sortEquipment(items: EquipmentItem[]): EquipmentItem[] {
  return items.slice().sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return a.name.localeCompare(b.name, "he");
  });
}

// ---------- Helpers ----------

function applyRecordChange<T extends CatalogRecordBase>(
  bucket: "treadmills" | "equipment" | "locations",
  id: string,
  mutate: (r: T) => T,
): void {
  const state = readCatalogState();
  const list = state[bucket] as unknown as T[];
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const next = list.slice();
  next[idx] = mutate(list[idx]);
  writeCatalogState({ ...state, [bucket]: next } as CatalogState);
}


// ---------- Cross-entity helpers ----------

/** בודק אם פריט ציוד או הליכון בעל שם מנורמל דומה כבר קיים באותו מקום. */
export function findSimilarEquipmentInLocation(
  name: string,
  locationId: string,
  excludeId?: string,
): EquipmentItem[] {
  const target = normalizeName(name);
  if (!target) return [];
  return readCatalogState()
    .equipment.filter(
      (e) =>
        e.location_id === locationId &&
        e.id !== excludeId &&
        e.deleted_at === null &&
        normalizeName(e.name) === target,
    );
}

export function findSimilarTreadmillInLocation(
  displayName: string,
  locationId: string,
  excludeId?: string,
): TreadmillProfile[] {
  const target = normalizeName(displayName);
  if (!target) return [];
  return readCatalogState()
    .treadmills.filter(
      (t) =>
        t.location_id === locationId &&
        t.id !== excludeId &&
        t.deleted_at === null &&
        normalizeName(t.display_name) === target,
    );
}

/** ספירה: כמה רשומות שאינן מחוקות משתמשות במקום. */
export function countLocationUsage(locationId: string): {
  treadmills: number;
  equipment: number;
} {
  const state = readCatalogState();
  return {
    treadmills: state.treadmills.filter(
      (t) => t.location_id === locationId && t.deleted_at === null,
    ).length,
    equipment: state.equipment.filter(
      (e) => e.location_id === locationId && e.deleted_at === null,
    ).length,
  };
}
