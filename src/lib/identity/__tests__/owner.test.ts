/**
 * ADR-0047 — multi-user readiness at the data layer, WITHOUT exposing a second user.
 * These are contract tests: they prove the model can hold more than one owner, that shared
 * catalogue data stays shared, and that everything already on Ariel's device stays readable.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  LOCAL_OWNER_ID,
  SYSTEM_OWNER_ID,
  currentOwnerId,
  isSystemOwned,
  ownedByCurrent,
  visibleToCurrentOwner,
  withOwner,
} from "@/lib/identity/owner";
import { HOME_OWNER_ID } from "@/lib/home";
import { CURRENT_OWNER_ID as RUNS_OWNER } from "@/lib/runs/storage";
import { CURRENT_OWNER_ID as SESSIONS_OWNER } from "@/lib/sessions/storage";
import { CURRENT_OWNER_ID as EXERCISES_OWNER } from "@/lib/exercises/storage";
import { GOALS_OWNER_ID } from "@/lib/goals";
import { createHomeSession, listHomeSessions } from "@/lib/home";
import { _resetHomeStateForTests } from "@/lib/home/storage";

describe("ownership contract", () => {
  beforeEach(() => _resetHomeStateForTests());

  it("keeps the historical owner id, so existing records stay readable", () => {
    expect(LOCAL_OWNER_ID).toBe("single-user");
    expect(currentOwnerId()).toBe("single-user");
  });

  it("is the single source of the owner id for every domain", () => {
    for (const domainOwner of [
      HOME_OWNER_ID,
      RUNS_OWNER,
      SESSIONS_OWNER,
      EXERCISES_OWNER,
      GOALS_OWNER_ID,
    ])
      expect(domainOwner).toBe(LOCAL_OWNER_ID);
  });

  it("can act as another owner without any UI — the model is not single-user", () => {
    const mine = createHomeSession({ name: "שלי" });
    const theirs = withOwner("user-2", () => {
      expect(currentOwnerId()).toBe("user-2");
      return { id: "x", owner_id: currentOwnerId() };
    });
    expect(currentOwnerId()).toBe(LOCAL_OWNER_ID);
    expect(mine.owner_id).toBe(LOCAL_OWNER_ID);
    expect(theirs.owner_id).toBe("user-2");
    expect(ownedByCurrent(mine)).toBe(true);
    expect(ownedByCurrent(theirs)).toBe(false);
  });

  it("never mixes two owners' records in one list", () => {
    const mine = createHomeSession({ name: "שלי" });
    const foreign = { ...mine, id: "other", owner_id: "user-2" };
    const visible = visibleToCurrentOwner([mine, foreign]);
    expect(visible.map((s) => s.id)).toEqual([mine.id]);
    expect(
      withOwner("user-2", () => visibleToCurrentOwner([mine, foreign])).map((s) => s.id),
    ).toEqual(["other"]);
  });

  it("keeps the system catalogue shared rather than copied per user", () => {
    const catalogueRow = { owner_id: SYSTEM_OWNER_ID };
    expect(isSystemOwned(catalogueRow)).toBe(true);
    expect(visibleToCurrentOwner([catalogueRow])).toHaveLength(1);
    expect(withOwner("user-2", () => visibleToCurrentOwner([catalogueRow]))).toHaveLength(1);
  });

  it("treats a legacy record with no owner as the local owner's, so nothing disappears", () => {
    const legacy = { id: "legacy" } as { id: string; owner_id?: string };
    expect(visibleToCurrentOwner([legacy])).toHaveLength(1);
  });

  it("stamps every new record with an owner", () => {
    createHomeSession({ name: "א" });
    createHomeSession({ name: "ב" });
    expect(listHomeSessions().every((s) => s.owner_id === LOCAL_OWNER_ID)).toBe(true);
    expect(listHomeSessions().every((s) => Boolean(s.owner_id))).toBe(true);
  });
});
