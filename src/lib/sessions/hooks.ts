/**
 * Reactive hooks — subscribe to sessions state.
 * כל hook קורא state עדכני ומחזיר derived data.
 */
import { useSyncExternalStore, useEffect, useState } from "react";
import { readSessionsState, readSessionsServerSnapshot, subscribeSessions } from "./storage";
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

export function useAllSessions(): StrengthSession[] {
  useSessionsStore();
  return repo.listSessions();
}
export function useSession(id: string | undefined): StrengthSession | null {
  useSessionsStore();
  if (!id) return null;
  return repo.getSession(id);
}
export function useActiveSession(): StrengthSession | null {
  useSessionsStore();
  return repo.getActiveSession();
}
export function useSessionBlocks(sessionId: string): StrengthSessionBlock[] {
  useSessionsStore();
  return repo.listSessionBlocks(sessionId);
}
export function useSessionExercises(sessionId: string): StrengthSessionExercise[] {
  useSessionsStore();
  return repo.listSessionExercises(sessionId);
}
export function useBlockExercises(blockId: string): StrengthSessionExercise[] {
  useSessionsStore();
  return repo.listBlockExercises(blockId);
}
export function useExerciseSets(sessionExerciseId: string): StrengthSet[] {
  useSessionsStore();
  return repo.listExerciseSets(sessionExerciseId);
}

export function useSessionVolume(sessionId: string) {
  useSessionsStore();
  return computeSessionVolume(sessionId);
}
export function useDataCompleteness(sessionId: string) {
  useSessionsStore();
  return computeDataCompleteness(sessionId);
}
export function usePreviousPerformance(sessionId: string, exerciseId: string) {
  useSessionsStore();
  return findPreviousPerformance(sessionId, exerciseId);
}
export function usePersonalRecords(sessionId: string, exerciseId: string) {
  useSessionsStore();
  return detectPersonalRecords(sessionId, exerciseId);
}
export function useSessionPrefs() {
  useSessionsStore();
  return repo.getPrefs();
}

/** משך אימון פעיל — מרענן פעם בשנייה. */
export function useLiveSessionDuration(sessionId: string): number {
  const [tick, setTick] = useState(0);
  useSessionsStore();
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  void tick;
  return computeSessionDurationSeconds(sessionId);
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
