/**
 * InMemoryCloudRepository — התנהגות ה-repository עצמו, בלי pipeline.
 * ראה ADR-0034.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryCloudRepository } from "@/lib/migration";

let repo: InMemoryCloudRepository;

beforeEach(() => {
  repo = new InMemoryCloudRepository();
});

describe("מפתח יציב, לא index", () => {
  it("upsert ראשון מוסיף ומחזיר inserted", () => {
    const r = repo.upsert("goals", "goal_1", { id: "goal_1", name: "א" });
    expect(r.outcome).toBe("inserted");
    expect(repo.get("goals", "goal_1")).toEqual({ id: "goal_1", name: "א" });
    expect(repo.count("goals")).toBe(1);
  });

  it("שליפה היא לפי מזהה ולא לפי מיקום — סדר ההוספה אינו משנה", () => {
    repo.upsert("goals", "goal_b", { id: "goal_b" });
    repo.upsert("goals", "goal_a", { id: "goal_a" });
    expect(repo.get("goals", "goal_a")).toEqual({ id: "goal_a" });
    expect(repo.ids("goals")).toEqual(["goal_b", "goal_a"]);
  });

  it("count ו-list משקפים את מספר הרשומות בפועל", () => {
    repo.upsert("sets", "s1", { id: "s1" });
    repo.upsert("sets", "s2", { id: "s2" });
    expect(repo.count("sets")).toBe(2);
    expect(repo.list("sets")).toHaveLength(2);
    expect(repo.totalRows()).toBe(2);
  });
});

describe("idempotency וקונפליקטים", () => {
  it("אותו id + אותו תוכן → unchanged, ללא כפילות", () => {
    repo.upsert("goals", "goal_1", { id: "goal_1", name: "א" });
    const second = repo.upsert("goals", "goal_1", { id: "goal_1", name: "א" });
    expect(second.outcome).toBe("unchanged");
    expect(repo.count("goals")).toBe(1);
  });

  it("סדר מפתחות שונה באותו תוכן עדיין unchanged", () => {
    repo.upsert("goals", "goal_1", { id: "goal_1", a: 1, b: 2 });
    const second = repo.upsert("goals", "goal_1", { b: 2, id: "goal_1", a: 1 });
    expect(second.outcome).toBe("unchanged");
  });

  it("אותו id + תוכן שונה → conflict, והרשומה הקיימת אינה משתנה", () => {
    repo.upsert("goals", "goal_1", { id: "goal_1", name: "א", target: 20 });
    const second = repo.upsert("goals", "goal_1", { id: "goal_1", name: "ב", target: 20 });

    expect(second.outcome).toBe("conflict");
    expect(second.conflictFields).toEqual(["name"]);
    expect(repo.get("goals", "goal_1")).toEqual({ id: "goal_1", name: "א", target: 20 });
    expect(repo.count("goals")).toBe(1);
  });
});

describe("הורים", () => {
  it("הורה חסר → missing_parent, והרשומה אינה נכתבת", () => {
    const r = repo.upsert("sets", "s1", { id: "s1" }, [
      { field: "session_exercise_id", table: "strength_session_exercises", id: "se_1" },
    ]);
    expect(r.outcome).toBe("missing_parent");
    expect(r.missingParents).toEqual([
      {
        field: "session_exercise_id",
        table: "strength_session_exercises",
        id: "se_1",
        reason: "parent_row_not_found",
      },
    ]);
    expect(repo.count("sets")).toBe(0);
  });

  it("הורה קיים → נכתב", () => {
    repo.upsert("strength_session_exercises", "se_1", { id: "se_1" });
    const r = repo.upsert("sets", "s1", { id: "s1" }, [
      { field: "session_exercise_id", table: "strength_session_exercises", id: "se_1" },
    ]);
    expect(r.outcome).toBe("inserted");
    expect(repo.count("sets")).toBe(1);
  });
});

describe("inspection ו-reset", () => {
  it("operations מתעד כל פעולה לפי סדר", () => {
    repo.upsert("goals", "g1", { id: "g1" });
    repo.upsert("goals", "g1", { id: "g1" });
    repo.upsert("goals", "g1", { id: "g1", x: 1 });

    expect(repo.operations().map((o) => o.outcome)).toEqual([
      "inserted",
      "unchanged",
      "conflict",
    ]);
    expect(repo.operations().map((o) => o.index)).toEqual([0, 1, 2]);
  });

  it("tables מחזיר רק טבלאות עם רשומות, ממוין", () => {
    repo.upsert("zeta", "z", { id: "z" });
    repo.upsert("alpha", "a", { id: "a" });
    repo.upsert("orphan", "o", { id: "o" }, [{ field: "p", table: "missing", id: "x" }]);
    expect(repo.tables()).toEqual(["alpha", "zeta"]);
  });

  it("reset מנקה הכול", () => {
    repo.upsert("goals", "g1", { id: "g1" });
    repo.reset();
    expect(repo.totalRows()).toBe(0);
    expect(repo.operations()).toHaveLength(0);
  });
});
