/**
 * Home React hooks — useSyncExternalStore wrappers.
 */
import { useSyncExternalStore } from "react";
import { readHomeState, readHomeServerSnapshot, subscribeHome } from "./storage";
import type { HomeState } from "./storage";
import type { HomeExerciseEntry, HomeExerciseSet, HomeSession, HomeTemplate } from "./types";
import {
  getHomeSession,
  getHomeTemplate,
  listEntrySets,
  listHomeSessions,
  listHomeTemplates,
  listHomeTemplateEntries,
  listSessionEntries,
  listActiveHomeDrafts,
} from "./repo";
import type { HomeTemplateEntry } from "./types";

function useHome<T>(selector: (s: HomeState) => T): T {
  return useSyncExternalStore(
    subscribeHome,
    () => selector(readHomeState()),
    () => selector(readHomeServerSnapshot()),
  );
}

export function useHomeSessions(): HomeSession[] {
  useHome((s) => s.sessions);
  return listHomeSessions();
}

export function useHomeSession(id: string | null | undefined): HomeSession | null {
  useHome((s) => s.sessions);
  return id ? getHomeSession(id) : null;
}

export function useActiveHomeDrafts(): HomeSession[] {
  useHome((s) => s.sessions);
  return listActiveHomeDrafts();
}

export function useHomeSessionEntries(sessionId: string | null | undefined): HomeExerciseEntry[] {
  useHome((s) => s.entries);
  return sessionId ? listSessionEntries(sessionId) : [];
}

export function useEntrySets(entryId: string | null | undefined): HomeExerciseSet[] {
  useHome((s) => s.sets);
  return entryId ? listEntrySets(entryId) : [];
}

export function useHomeTemplates(): HomeTemplate[] {
  useHome((s) => s.templates);
  return listHomeTemplates();
}

export function useHomeTemplate(id: string | null | undefined): HomeTemplate | null {
  useHome((s) => s.templates);
  return id ? getHomeTemplate(id) : null;
}

export function useHomeTemplateEntries(
  templateId: string | null | undefined,
): HomeTemplateEntry[] {
  useHome((s) => s.templateEntries);
  return templateId ? listHomeTemplateEntries(templateId) : [];
}
