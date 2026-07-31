/**
 * Home React hooks — useSyncExternalStore wrappers.
 */
import { useSyncExternalStore } from "react";
import { readHomeState, readHomeServerSnapshot, subscribeHome } from "./storage";
import { useHydrated } from "@/lib/storage/useHydrated";
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
  listTrashedHomeSessions,
} from "./repo";
import type { HomeTemplateEntry } from "./types";

function useHome<T>(selector: (s: HomeState) => T): T {
  return useSyncExternalStore(
    subscribeHome,
    () => selector(readHomeState()),
    () => selector(readHomeServerSnapshot()),
  );
}

export function useTrashedHomeSessions(): HomeSession[] {
  useHome((s) => s.sessions);
  const hydrated = useHydrated();
  return hydrated ? listTrashedHomeSessions() : [];
}

export function useHomeSessions(): HomeSession[] {
  useHome((s) => s.sessions);
  const hydrated = useHydrated();
  return hydrated ? listHomeSessions() : [];
}

export function useHomeSession(id: string | null | undefined): HomeSession | null {
  useHome((s) => s.sessions);
  const hydrated = useHydrated();
  return hydrated && id ? getHomeSession(id) : null;
}

export function useActiveHomeDrafts(): HomeSession[] {
  useHome((s) => s.sessions);
  const hydrated = useHydrated();
  return hydrated ? listActiveHomeDrafts() : [];
}

export function useHomeSessionEntries(sessionId: string | null | undefined): HomeExerciseEntry[] {
  useHome((s) => s.entries);
  const hydrated = useHydrated();
  return hydrated && sessionId ? listSessionEntries(sessionId) : [];
}

export function useEntrySets(entryId: string | null | undefined): HomeExerciseSet[] {
  useHome((s) => s.sets);
  const hydrated = useHydrated();
  return hydrated && entryId ? listEntrySets(entryId) : [];
}

/**
 * מזהי תרגילים שהופיעו לאחרונה בשימוש בית — החדש ביותר ראשון.
 * נגזר מהנתונים הקיימים (sessions + template entries); **אין storage חדש**.
 */
export function useRecentHomeExerciseIds(limit = 8): string[] {
  const state = useHome((s) => s);
  const seen: string[] = [];
  const push = (id: string) => {
    if (id && !seen.includes(id)) seen.push(id);
  };

  const entriesByRecency = [...state.entries]
    .filter((e) => !e.deleted_at)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  for (const e of entriesByRecency) push(e.exercise_id);

  const templateEntriesByRecency = [...state.templateEntries]
    .filter((e) => !e.deleted_at)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  for (const e of templateEntriesByRecency) push(e.exercise_id);

  return seen.slice(0, limit);
}

export function useHomeTemplates(): HomeTemplate[] {
  useHome((s) => s.templates);
  const hydrated = useHydrated();
  return hydrated ? listHomeTemplates() : [];
}

export function useHomeTemplate(id: string | null | undefined): HomeTemplate | null {
  useHome((s) => s.templates);
  const hydrated = useHydrated();
  return hydrated && id ? getHomeTemplate(id) : null;
}

export function useHomeTemplateEntries(
  templateId: string | null | undefined,
): HomeTemplateEntry[] {
  useHome((s) => s.templateEntries);
  const hydrated = useHydrated();
  return hydrated && templateId ? listHomeTemplateEntries(templateId) : [];
}
