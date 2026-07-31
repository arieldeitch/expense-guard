/**
 * Reactive hooks — subscribe to sessions state.
 * כל hook קורא state עדכני ומחזיר derived data.
 */
import { useSyncExternalStore, useEffect, useState } from "react";
import {
  getPersistenceStatus,
  readSessionsState,
  readSessionsServerSnapshot,
  subscribePersistence,
  subscribeSessions,
  type PersistenceStatus,
} from "./storage";
import { useHydrated } from "@/lib/storage/useHydrated";
import * as repo from "./repo";
import {
  computeDataCompleteness,
  computeSessionDurationSeconds,
  computeSessionVolume,
  detectPersonalRecords,
  findPreviousPerformance,
} from "./calculations";
import { computeRestRemaining } from "./timer";
import type {
  StrengthSession,
  StrengthSessionBlock,
  StrengthSessionExercise,
  StrengthSet,
} from "./types";

function useSessionsStore() {
  return useSyncExternalStore(subscribeSessions, readSessionsState, readSessionsServerSnapshot);
}

/**
 * מזהה שלעולם אינו קיים. פונקציות החישוב נגזרות מרשימות לפי מזהה, ולכן קריאה
 * עם מזהה זה מחזירה **בדיוק** את מה שהשרת חישב מעל state ריק — בלי לשכפל את
 * לוגיקת החישוב ובלי לגעת ב-state עצמו. ראה ADR-0039.
 */
const NO_ID = "";

export function useAllSessions(): StrengthSession[] {
  useSessionsStore();
  const hydrated = useHydrated();
  return hydrated ? repo.listSessions() : [];
}

export function useTrashedSessions(): StrengthSession[] {
  useSessionsStore();
  const hydrated = useHydrated();
  return hydrated ? repo.listTrashedSessions() : [];
}
export function useSession(id: string | undefined): StrengthSession | null {
  useSessionsStore();
  const hydrated = useHydrated();
  if (!hydrated || !id) return null;
  return repo.getSession(id);
}
export function useActiveSession(): StrengthSession | null {
  useSessionsStore();
  const hydrated = useHydrated();
  return hydrated ? repo.getActiveSession() : null;
}
export function useSessionBlocks(sessionId: string): StrengthSessionBlock[] {
  useSessionsStore();
  const hydrated = useHydrated();
  return hydrated ? repo.listSessionBlocks(sessionId) : [];
}
export function useSessionExercises(sessionId: string): StrengthSessionExercise[] {
  useSessionsStore();
  const hydrated = useHydrated();
  return hydrated ? repo.listSessionExercises(sessionId) : [];
}
export function useBlockExercises(blockId: string): StrengthSessionExercise[] {
  useSessionsStore();
  const hydrated = useHydrated();
  return hydrated ? repo.listBlockExercises(blockId) : [];
}
export function useExerciseSets(sessionExerciseId: string): StrengthSet[] {
  useSessionsStore();
  const hydrated = useHydrated();
  return hydrated ? repo.listExerciseSets(sessionExerciseId) : [];
}

export function useSessionVolume(sessionId: string) {
  useSessionsStore();
  const hydrated = useHydrated();
  return computeSessionVolume(hydrated ? sessionId : NO_ID);
}
export function useDataCompleteness(sessionId: string) {
  useSessionsStore();
  const hydrated = useHydrated();
  return computeDataCompleteness(hydrated ? sessionId : NO_ID);
}
export function usePreviousPerformance(sessionId: string, exerciseId: string) {
  useSessionsStore();
  const hydrated = useHydrated();
  return findPreviousPerformance(hydrated ? sessionId : NO_ID, hydrated ? exerciseId : NO_ID);
}
export function usePersonalRecords(sessionId: string, exerciseId: string) {
  useSessionsStore();
  const hydrated = useHydrated();
  return detectPersonalRecords(hydrated ? sessionId : NO_ID, hydrated ? exerciseId : NO_ID);
}
/**
 * מצב ההתמדה של ה-store. משמש להצגת סטטוס שמירה אמיתי — ה-UI לא מכריז
 * "נשמר" אלא אחרי שה-repository אישר כתיבה. ראה ADR-0028.
 */
export function usePersistenceStatus(): PersistenceStatus {
  return useSyncExternalStore(
    subscribePersistence,
    getPersistenceStatus,
    () => "idle" as PersistenceStatus,
  );
}

export function useSessionPrefs() {
  useSessionsStore();
  const hydrated = useHydrated();
  return hydrated ? repo.getPrefs() : readSessionsServerSnapshot().prefs;
}

/** משך אימון פעיל — מרענן פעם בשנייה. */
export function useLiveSessionDuration(sessionId: string): number {
  const [tick, setTick] = useState(0);
  useSessionsStore();
  const hydrated = useHydrated();
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  void tick;
  return computeSessionDurationSeconds(hydrated ? sessionId : NO_ID);
}

export interface RestTimerHookState {
  active: boolean;
  startedAt: string | null;
  plannedSeconds: number;
  remainingSeconds: number;
  nextExerciseName: string | null;
}

/** In-memory rest timer state (לא נשמר ב־localStorage — זה עניין UI זמני). */
let restState: {
  sessionId: string | null;
  startedAt: string | null;
  plannedSeconds: number;
  nextExerciseName: string | null;
} = { sessionId: null, startedAt: null, plannedSeconds: 0, nextExerciseName: null };
const restListeners = new Set<() => void>();
function emitRest() {
  restListeners.forEach((l) => l());
}

export function startRestTimer(sessionId: string, seconds: number, nextName?: string | null) {
  restState = {
    sessionId,
    startedAt: new Date().toISOString(),
    plannedSeconds: seconds,
    nextExerciseName: nextName ?? null,
  };
  emitRest();
}
export function stopRestTimer() {
  restState = { sessionId: null, startedAt: null, plannedSeconds: 0, nextExerciseName: null };
  emitRest();
}
export function adjustRestTimer(deltaSeconds: number) {
  restState = {
    ...restState,
    plannedSeconds: Math.max(0, restState.plannedSeconds + deltaSeconds),
  };
  emitRest();
}

export function useRestTimer(sessionId: string): RestTimerHookState {
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const unsub = (() => {
      const l = () => setNow(Date.now());
      restListeners.add(l);
      return () => restListeners.delete(l);
    })();
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => {
      unsub();
      clearInterval(t);
    };
  }, []);
  if (restState.sessionId !== sessionId || !restState.startedAt) {
    return {
      active: false,
      startedAt: null,
      plannedSeconds: 0,
      remainingSeconds: 0,
      nextExerciseName: null,
    };
  }
  const remaining = computeRestRemaining(restState.startedAt, restState.plannedSeconds);
  return {
    active: true,
    startedAt: restState.startedAt,
    plannedSeconds: restState.plannedSeconds,
    remainingSeconds: remaining,
    nextExerciseName: restState.nextExerciseName,
  };
}
