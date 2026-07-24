/**
 * Timer utilities — timestamp-based so pausing/backgrounding stays accurate.
 * All computations happen in the browser; no timers module state.
 */
import type { SessionTimerRecord } from "./types";
import { readSessionsState } from "./storage";

/** מחזיר timer של session (או null אם לא נוצר). */
export function getTimer(sessionId: string): SessionTimerRecord | null {
  return readSessionsState().timers.find((t) => t.session_id === sessionId) ?? null;
}

/** שניות בפועל של אימון פעיל, מבוסס timestamp. */
export function computeElapsedSeconds(t: SessionTimerRecord, now = Date.now()): number {
  const started = new Date(t.started_at).getTime();
  const pausedForCurrent = t.paused_at ? now - new Date(t.paused_at).getTime() : 0;
  const raw = (now - started - pausedForCurrent) / 1000 - t.paused_seconds;
  return Math.max(0, Math.floor(raw));
}

/** rest timer בזמן אמת — מבוסס timestamp שנתחיל ממנו. */
export interface RestTimerState {
  active: boolean;
  started_at: string | null;
  planned_seconds: number;
  elapsed_seconds: number;
  remaining_seconds: number;
  next_exercise_id: string | null;
  next_exercise_name: string | null;
}

export function computeRestRemaining(
  startedAt: string | null,
  plannedSeconds: number,
  now = Date.now(),
): number {
  if (!startedAt) return plannedSeconds;
  const elapsed = Math.floor((now - new Date(startedAt).getTime()) / 1000);
  return Math.max(0, plannedSeconds - elapsed);
}
