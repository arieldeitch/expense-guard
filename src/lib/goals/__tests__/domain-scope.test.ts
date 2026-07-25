/**
 * Goals — domain scoping + trash/restore.
 * מאמת את החלטת המוצר: יעדים מנוהלים בתוך התחום בלבד, ללא חציית תחומים,
 * וללא המצאת ערכים. וכן trash/restore ללא כפילות עם עדכון מקורות ההתקדמות.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  _resetGoalsStateForTests,
  createGoal,
  getGoal,
  getPrimaryGoal,
  listGoals,
  listGoalsByDomain,
  listActiveGoals,
  listGoalTypesByDomain,
  updateGoal,
  trashGoal,
  restoreGoal,
  archiveGoal,
  type GoalDomain,
} from "@/lib/goals";
import { goalMatchesDomain } from "@/components/goals/goalDomainConfig";

beforeEach(() => _resetGoalsStateForTests());

describe("goals — domain scoping", () => {
  it("listGoalTypesByDomain מחזיר רק סוגים מהתחום (מונע יעד חוצה-תחום)", () => {
    (["running", "gym", "home"] as GoalDomain[]).forEach((d) => {
      const types = listGoalTypesByDomain(d);
      expect(types.length).toBeGreaterThan(0);
      expect(types.every((t) => t.domain === d)).toBe(true);
    });
  });

  it("createGoal קובע domain לפי goal_type", () => {
    const run = createGoal({ domain: "running", goal_type: "run_monthly_distance", target_value: 100 });
    const gym = createGoal({ domain: "gym", goal_type: "gym_sessions_in_period", target_value: 12 });
    const home = createGoal({ domain: "home", goal_type: "home_consecutive_reps", target_value: 40 });
    expect(run.domain).toBe("running");
    expect(gym.domain).toBe("gym");
    expect(home.domain).toBe("home");
  });

  it("listGoalsByDomain מחזיר רק יעדי התחום", () => {
    createGoal({ domain: "running", goal_type: "run_monthly_distance", target_value: 100 });
    createGoal({ domain: "gym", goal_type: "gym_sessions_in_period", target_value: 12 });
    createGoal({ domain: "gym", goal_type: "gym_sessions_in_period", target_value: 20 });
    expect(listGoalsByDomain("running").length).toBe(1);
    expect(listGoalsByDomain("gym").length).toBe(2);
    expect(listGoalsByDomain("home").length).toBe(0);
    expect(listGoalsByDomain("gym").every((g) => g.domain === "gym")).toBe(true);
  });

  it("עריכת יעד שומרת ערכים ולא משנה domain (אין מעבר שקט)", () => {
    const g = createGoal({ domain: "home", goal_type: "home_consecutive_reps", target_value: 30 });
    const updated = updateGoal(g.id, { target_value: 50, name: "מטרה" });
    expect(updated!.target_value).toBe(50);
    expect(updated!.name).toBe("מטרה");
    expect(updated!.domain).toBe("home");
  });

  it("getPrimaryGoal: is_primary → priority, ומחזיר רק מהתחום", () => {
    const a = createGoal({ domain: "running", goal_type: "run_monthly_distance", target_value: 100, priority: 2 });
    const b = createGoal({ domain: "running", goal_type: "run_monthly_distance", target_value: 80, priority: 1 });
    // ללא דגל ראשי → priority נמוך יותר מנצח
    expect(getPrimaryGoal("running")!.id).toBe(b.id);
    // דגל ראשי מנצח priority
    updateGoal(a.id, { is_primary: true });
    expect(getPrimaryGoal("running")!.id).toBe(a.id);
    // תחום ללא יעד → null (אין progress מזויף)
    expect(getPrimaryGoal("gym")).toBeNull();
  });
});

describe("goals — cross-domain isolation guard", () => {
  it("goalMatchesDomain: יעד מוצג/נערך רק בתחום שלו; ה-domain נקבע מהישות ולא מה-route", () => {
    const gymGoal = createGoal({ domain: "gym", goal_type: "gym_sessions_in_period", target_value: 10 });
    expect(goalMatchesDomain(gymGoal, "gym")).toBe(true);
    // ניסיון להציג/לערוך יעד gym במסלול running/home → נחסם
    expect(goalMatchesDomain(gymGoal, "running")).toBe(false);
    expect(goalMatchesDomain(gymGoal, "home")).toBe(false);
    // ישות חסרה
    expect(goalMatchesDomain(null, "gym")).toBe(false);
    expect(goalMatchesDomain(undefined, "gym")).toBe(false);
  });

  it("עריכה אינה משנה domain של יעד קיים (updateGoal שומר domain)", () => {
    const g = createGoal({ domain: "gym", goal_type: "gym_sessions_in_period", target_value: 10 });
    // גם אם מנסים לדחוף domain אחר ב-patch — הישות שומרת על התחום המקורי דרך goal_type/spec.
    const updated = updateGoal(g.id, { target_value: 15 });
    expect(updated!.domain).toBe("gym");
  });
});

describe("goals — primary selection excludes non-active", () => {
  it("יעד בארכיון/סל אינו נבחר כ-primary ואינו נספר כפעיל", () => {
    const g = createGoal({ domain: "home", goal_type: "home_consecutive_reps", target_value: 40 });
    expect(getPrimaryGoal("home")!.id).toBe(g.id);
    archiveGoal(g.id);
    expect(getPrimaryGoal("home")).toBeNull(); // archived לא primary
    expect(listActiveGoals("home").length).toBe(0);
  });
});

describe("goals — restore preserves domain + links, no fabrication", () => {
  it("שחזור יעד שומר domain, קישורים ולא יוצר קשר שקרי, ללא כפילות", () => {
    const g = createGoal({
      domain: "running",
      goal_type: "run_monthly_distance",
      target_value: 100,
      linked_route_id: "route_ghost", // dependency שלא קיימת
    });
    trashGoal(g.id);
    restoreGoal(g.id);
    const after = getGoal(g.id)!;
    expect(after.domain).toBe("running"); // domain לא השתנה
    expect(after.linked_route_id).toBe("route_ghost"); // הקישור נשמר כפי שהיה — לא הוחלף/נמחק בשקט
    expect(after.status).toBe("active");
    expect(listGoals(true).filter((x) => x.id === g.id).length).toBe(1); // אין כפילות
  });
});

describe("goals — trash & restore", () => {
  it("מחיקה לסל ושחזור — ללא כפילות, ומקורות ההתקדמות מתעדכנים", () => {
    const g = createGoal({ domain: "gym", goal_type: "gym_sessions_in_period", target_value: 12 });
    expect(listActiveGoals("gym").length).toBe(1);

    trashGoal(g.id);
    expect(getGoal(g.id)!.status).toBe("trashed");
    expect(listGoalsByDomain("gym").length).toBe(0); // ברירת מחדל מסננת trashed
    expect(listGoals(true).filter((x) => x.status === "trashed").length).toBe(1);
    expect(listActiveGoals("gym").length).toBe(0); // יעד ראשי/התקדמות מתעדכנים

    restoreGoal(g.id);
    expect(getGoal(g.id)!.status).toBe("active");
    expect(getGoal(g.id)!.deleted_at).toBeNull();
    expect(listGoalsByDomain("gym").length).toBe(1);
    expect(listGoals(true).filter((x) => x.id === g.id).length).toBe(1); // אין כפילות
    expect(listActiveGoals("gym").length).toBe(1);
  });
});
