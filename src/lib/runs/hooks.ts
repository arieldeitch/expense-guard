/** Reactive hooks over run state via useSyncExternalStore. */
import { useSyncExternalStore } from "react";
import { readRunsState, readRunsServerSnapshot, subscribeRuns } from "./storage";
import * as repo from "./repo";
import type { RunSession, RunningRoute } from "./types";

function useState_() {
  return useSyncExternalStore(subscribeRuns, readRunsState, readRunsServerSnapshot);
}

export function useAllRuns(): RunSession[] {
  useState_();
  return repo.listRuns();
}

export function useRun(id: string | undefined): RunSession | null {
  useState_();
  if (!id) return null;
  return repo.getRun(id);
}

export function useActiveRuns(): RunSession[] {
  useState_();
  return repo.listRuns().filter((r) => r.deleted_at == null && r.status === "completed");
}

export function useDrafts(): RunSession[] {
  useState_();
  return repo.listDrafts();
}

export function useTrashedRuns(): RunSession[] {
  useState_();
  return repo.listRuns().filter((r) => r.deleted_at != null);
}

export function useAllRoutes(): RunningRoute[] {
  useState_();
  return repo.listRoutes();
}

export function useActiveRoutes(): RunningRoute[] {
  useState_();
  return repo.listRoutes().filter((r) => r.deleted_at == null && r.is_active);
}

export function useLastUsed() {
  useState_();
  return repo.getLastUsed();
}
