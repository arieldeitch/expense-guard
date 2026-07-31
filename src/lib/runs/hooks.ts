/** Reactive hooks over run state via useSyncExternalStore. */
import { useSyncExternalStore } from "react";
import { readRunsState, readRunsServerSnapshot, subscribeRuns } from "./storage";
import { useHydrated } from "@/lib/storage/useHydrated";
import * as repo from "./repo";
import type { RunSession, RunningRoute } from "./types";

function useState_() {
  return useSyncExternalStore(subscribeRuns, readRunsState, readRunsServerSnapshot);
}

export function useAllRuns(): RunSession[] {
  useState_();
  const hydrated = useHydrated();
  return hydrated ? repo.listRuns() : [];
}

export function useRun(id: string | undefined): RunSession | null {
  useState_();
  const hydrated = useHydrated();
  if (!hydrated || !id) return null;
  return repo.getRun(id);
}

export function useActiveRuns(): RunSession[] {
  useState_();
  const hydrated = useHydrated();
  if (!hydrated) return [];
  return repo.listRuns().filter((r) => r.deleted_at == null && r.status === "completed");
}

export function useDrafts(): RunSession[] {
  useState_();
  const hydrated = useHydrated();
  return hydrated ? repo.listDrafts() : [];
}

export function useTrashedRuns(): RunSession[] {
  useState_();
  const hydrated = useHydrated();
  if (!hydrated) return [];
  return repo.listRuns().filter((r) => r.deleted_at != null);
}

export function useAllRoutes(): RunningRoute[] {
  useState_();
  const hydrated = useHydrated();
  return hydrated ? repo.listRoutes() : [];
}

export function useActiveRoutes(): RunningRoute[] {
  useState_();
  const hydrated = useHydrated();
  if (!hydrated) return [];
  return repo.listRoutes().filter((r) => r.deleted_at == null && r.is_active);
}

export function useLastUsed() {
  useState_();
  const hydrated = useHydrated();
  // לפני hydration מחזירים בדיוק את מה שהשרת ראה — שומר על טיפוס זהה.
  return hydrated ? repo.getLastUsed() : readRunsServerSnapshot().lastUsed;
}
