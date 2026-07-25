/**
 * Trash & restore — gym sessions + home sessions.
 * מאמת: soft delete → סל, שחזור → חזרה למקור, ללא כפילות, והמקורות שממנו
 * analytics/records/summaries נגזרים מתעדכנים (listSessions / listTrashed*).
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  _resetSessionsStateForTests,
  startEmptySession,
  trashSession,
  restoreSession,
  listSessions,
  listTrashedSessions,
} from "@/lib/sessions";
import {
  createHomeSession,
  trashHomeSession,
  restoreHomeSession,
  listTrashedHomeSessions,
  listHomeSessions,
} from "@/lib/home";
import { _resetHomeStateForTests } from "@/lib/home/storage";

beforeEach(() => {
  _resetSessionsStateForTests();
  _resetHomeStateForTests();
});

describe("trash & restore — gym sessions", () => {
  it("מחיקה → סל, שחזור → מקור, ללא כפילות, מקור-אמת מתעדכן", () => {
    const s = startEmptySession("אימון בדיקה");
    expect(listSessions().length).toBe(1);
    expect(listTrashedSessions().length).toBe(0);

    trashSession(s.id);
    expect(listSessions().length).toBe(0); // recompute source (history/analytics)
    expect(listTrashedSessions().length).toBe(1);

    restoreSession(s.id);
    expect(listSessions().length).toBe(1);
    expect(listTrashedSessions().length).toBe(0);
    expect(listSessions(true).filter((x) => x.id === s.id).length).toBe(1); // אין כפילות
  });
});

describe("trash & restore — home sessions", () => {
  it("מחיקה → סל, שחזור → מקור, ללא כפילות", () => {
    const s = createHomeSession({ name: "בית בדיקה" });
    const before = listHomeSessions().length;
    expect(listTrashedHomeSessions().length).toBe(0);

    trashHomeSession(s.id);
    expect(listTrashedHomeSessions().length).toBe(1);
    expect(listHomeSessions().length).toBe(before - 1);

    restoreHomeSession(s.id);
    expect(listTrashedHomeSessions().length).toBe(0);
    expect(listHomeSessions().length).toBe(before);
  });
});
