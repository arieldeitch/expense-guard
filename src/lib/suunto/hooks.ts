/**
 * Reactive hooks ל-Suunto state דרך useSyncExternalStore.
 */
import { useSyncExternalStore } from "react";
import { readSuuntoServerSnapshot, readSuuntoState, subscribeSuunto } from "./storage";
import { useHydrated } from "@/lib/storage/useHydrated";
import * as repo from "./repo";
import type { DeviceRunSnapshot, DeviceSourceType, TreadmillCalibrationProfile } from "./types";

function useState_() {
  return useSyncExternalStore(subscribeSuunto, readSuuntoState, readSuuntoServerSnapshot);
}

export function useSuuntoSnapshot(runId: string | undefined): DeviceRunSnapshot | null {
  useState_();
  const hydrated = useHydrated();
  if (!hydrated || !runId) return null;
  return repo.getSuuntoSnapshot(runId);
}

export function useHasSource(runId: string | undefined, source: DeviceSourceType): boolean {
  useState_();
  const hydrated = useHydrated();
  if (!hydrated || !runId) return false;
  return repo.hasSource(runId, source);
}
export function useHasTrashedSource(runId: string | undefined, source: DeviceSourceType): boolean {
  useState_();
  const hydrated = useHydrated();
  if (!hydrated || !runId) return false;
  return repo.hasTrashedSource(runId, source);
}

export function useCalibrationsForTreadmill(
  treadmillId: string | undefined,
): TreadmillCalibrationProfile[] {
  useState_();
  const hydrated = useHydrated();
  if (!hydrated || !treadmillId) return [];
  return repo.listCalibrations(treadmillId).filter((c) => c.deleted_at == null);
}
export function useActiveCalibration(
  treadmillId: string | undefined,
): TreadmillCalibrationProfile | null {
  useState_();
  const hydrated = useHydrated();
  if (!hydrated || !treadmillId) return null;
  return repo.getActiveCalibration(treadmillId);
}
export function useExclusions(treadmillId: string | undefined) {
  useState_();
  const hydrated = useHydrated();
  if (!hydrated || !treadmillId) return [];
  return repo.listExclusions(treadmillId);
}
