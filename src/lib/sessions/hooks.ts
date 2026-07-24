import { useSyncExternalStore } from "react";
import { readSessionsState, readSessionsServerSnapshot, subscribeSessions } from "./storage";
import * as repo from "./repo";
import type { StrengthSession } from "./types";

function useSessionsState() {
  return useSyncExternalStore(subscribeSessions, readSessionsState, readSessionsServerSnapshot);
}

export function useAllSessions(): StrengthSession[] {
  useSessionsState();
  return repo.listSessions();
}

export function useSession(id: string | undefined): StrengthSession | null {
  useSessionsState();
  if (!id) return null;
  return repo.getSession(id);
}
