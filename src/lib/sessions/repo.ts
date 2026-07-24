/**
 * Sessions repo — יצירה מ־template, שאילתות פשוטות.
 * מסך הביצוע יורחב בשלב הבא.
 */
import { buildTemplateSnapshot, getTemplate, markTemplateUsed } from "@/lib/templates";
import { readSessionsState, writeSessionsState } from "./storage";
import type { SessionStatus, StrengthSession } from "./types";

const OWNER_ID = "single-user";

function nowIso() {
  return new Date().toISOString();
}
function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function listSessions(): StrengthSession[] {
  return readSessionsState()
    .sessions.filter((s) => !s.deleted_at)
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
}

export function getSession(id: string): StrengthSession | null {
  return readSessionsState().sessions.find((s) => s.id === id) ?? null;
}

export function startSessionFromTemplate(templateId: string): StrengthSession | null {
  const template = getTemplate(templateId);
  if (!template) return null;
  const snapshot = buildTemplateSnapshot(templateId);
  const now = nowIso();
  const record: StrengthSession = {
    id: newId(),
    owner_id: OWNER_ID,
    template_id: template.id,
    template_version: template.version,
    snapshot,
    location_id: template.location_id,
    started_at: now,
    ended_at: null,
    status: "in_progress",
    notes: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  const state = readSessionsState();
  writeSessionsState({ ...state, sessions: [...state.sessions, record] });
  markTemplateUsed(templateId);
  return record;
}

export function updateSession(id: string, patch: Partial<StrengthSession>): void {
  const state = readSessionsState();
  writeSessionsState({
    ...state,
    sessions: state.sessions.map((s) =>
      s.id === id ? { ...s, ...patch, id: s.id, updated_at: nowIso() } : s,
    ),
  });
}

export function setSessionStatus(id: string, status: SessionStatus): void {
  const patch: Partial<StrengthSession> = { status };
  if (status === "completed" || status === "cancelled") patch.ended_at = nowIso();
  updateSession(id, patch);
}

export function cancelSession(id: string): void {
  setSessionStatus(id, "cancelled");
}
