/**
 * Catalog hooks — reactive access ל־catalog state דרך useSyncExternalStore.
 * מעדכן את כל הצרכנים לאחר write, ומחזיר snapshots יציבים.
 *
 * שימוש ב־useSyncExternalStore מבטיח לא לדלוף state לאורך re-renders,
 * וישלב חלק ל־TanStack Query בעתיד (כאשר יחליף repo ל־Supabase).
 */
import { useSyncExternalStore } from "react";
import { readCatalogState, readCatalogServerSnapshot, subscribeCatalog } from "./storage";
import * as repo from "./repo";
import type { EquipmentItem, TrainingLocation, TreadmillProfile } from "./types";

function useCatalogState() {
  return useSyncExternalStore(subscribeCatalog, readCatalogState, readCatalogServerSnapshot);
}

export function useAllLocations(): TrainingLocation[] {
  useCatalogState(); // subscribe
  return repo.listLocations();
}

export function useLocation(id: string | undefined): TrainingLocation | null {
  useCatalogState();
  if (!id) return null;
  return repo.getLocation(id);
}

export function useTreadmillsInLocation(locationId: string): TreadmillProfile[] {
  useCatalogState();
  return repo.listTreadmillsInLocation(locationId);
}

export function useTreadmill(id: string | undefined): TreadmillProfile | null {
  useCatalogState();
  if (!id) return null;
  return repo.getTreadmill(id);
}

export function useEquipmentInLocation(locationId: string): EquipmentItem[] {
  useCatalogState();
  return repo.listEquipmentInLocation(locationId);
}

export function useEquipment(id: string | undefined): EquipmentItem | null {
  useCatalogState();
  if (!id) return null;
  return repo.getEquipment(id);
}

export function useLocationUsage(id: string): { treadmills: number; equipment: number } {
  useCatalogState();
  return repo.countLocationUsage(id);
}

export function useTrashItems() {
  useCatalogState();
  return {
    locations: repo.listLocations().filter((l) => l.deleted_at !== null),
    treadmills: repo.listTreadmills().filter((t) => t.deleted_at !== null),
    equipment: repo.listEquipment().filter((e) => e.deleted_at !== null),
  };
}
