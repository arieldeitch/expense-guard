// @vitest-environment jsdom
/**
 * Render/navigation tests ל-12 domain goal routes (running/gym/home × list/new/detail/edit).
 * מדמה deep-link אמיתי מול route tree האמיתי, כולל loaders ו-redirects.
 * מאמת domain isolation דרך routes אמיתיים (לא רק unit logic).
 */
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";
import { createGoal, getGoal, listGoalsByDomain, type GoalDomain, type GoalType } from "@/lib/goals";

interface DomainCase {
  d: GoalDomain;
  listTitle: string;
  newTitle: string;
  editTitle: string;
  type: GoalType;
  other: { d: GoalDomain; type: GoalType };
}

const CASES: DomainCase[] = [
  {
    d: "running",
    listTitle: "יעדי ריצה",
    newTitle: "יעד ריצה חדש",
    editTitle: "עריכת יעד ריצה",
    type: "run_monthly_distance",
    other: { d: "gym", type: "gym_sessions_in_period" },
  },
  {
    d: "gym",
    listTitle: "יעדי כוח",
    newTitle: "יעד כוח חדש",
    editTitle: "עריכת יעד כוח",
    type: "gym_sessions_in_period",
    other: { d: "running", type: "run_monthly_distance" },
  },
  {
    d: "home",
    listTitle: "יעדי בית",
    newTitle: "יעד בית חדש",
    editTitle: "עריכת יעד בית",
    type: "home_consecutive_reps",
    other: { d: "gym", type: "gym_sessions_in_period" },
  },
];

describe.each(CASES)("domain goal routes — $d", (c) => {
  it(`list (/${c.d}/goals) deep-links, shows only this domain's goals`, async () => {
    createGoal({ domain: c.d, goal_type: c.type, target_value: 100, name: "OWN_GOAL" });
    createGoal({ domain: c.other.d, goal_type: c.other.type, target_value: 50, name: "OTHER_GOAL" });
    const r = await renderRoute(`/${c.d}/goals`);
    expect(r.currentPath()).toBe(`/${c.d}/goals`);
    expect((await screen.findAllByText(c.listTitle)).length).toBeGreaterThan(0);
    expect(await screen.findByText("OWN_GOAL")).toBeInTheDocument();
    expect(screen.queryByText("OTHER_GOAL")).toBeNull();
  });

  it(`new (/${c.d}/goals/new) renders the domain form`, async () => {
    const r = await renderRoute(`/${c.d}/goals/new`);
    expect(r.currentPath()).toBe(`/${c.d}/goals/new`);
    expect((await screen.findAllByText(c.newTitle)).length).toBeGreaterThan(0);
  });

  it(`detail (/${c.d}/goals/$id) shows the goal from this domain`, async () => {
    const g = createGoal({ domain: c.d, goal_type: c.type, target_value: 100, name: "DETAIL_GOAL" });
    const r = await renderRoute(`/${c.d}/goals/${g.id}`);
    expect(r.currentPath()).toContain(`/${c.d}/goals/`);
    expect((await screen.findAllByText("DETAIL_GOAL")).length).toBeGreaterThan(0);
  });

  it(`edit (/${c.d}/goals/$id/edit) renders the edit form`, async () => {
    const g = createGoal({ domain: c.d, goal_type: c.type, target_value: 100 });
    await renderRoute(`/${c.d}/goals/${g.id}/edit`);
    expect((await screen.findAllByText(c.editTitle)).length).toBeGreaterThan(0);
  });

  it(`detail refuses a goal from another domain (isolation)`, async () => {
    const other = createGoal({ domain: c.other.d, goal_type: c.other.type, target_value: 50 });
    await renderRoute(`/${c.d}/goals/${other.id}`);
    expect(await screen.findByText("היעד אינו בתחום זה")).toBeInTheDocument();
  });

  it(`edit refuses a goal from another domain (no silent domain switch)`, async () => {
    const other = createGoal({ domain: c.other.d, goal_type: c.other.type, target_value: 50 });
    await renderRoute(`/${c.d}/goals/${other.id}/edit`);
    expect(await screen.findByText(/לא ניתן לערוך יעד זה כאן/)).toBeInTheDocument();
  });
});

describe("domain goal create flow saves the correct domain", () => {
  it("creating via /gym/goals/new persists a gym goal and navigates to its detail", async () => {
    const user = userEvent.setup();
    const r = await renderRoute("/gym/goals/new");
    const target = await screen.findByLabelText("ערך יעד");
    await user.clear(target);
    await user.type(target, "12");
    await user.click(screen.getByRole("button", { name: "יצירת יעד" }));

    // ניווט לפרטי היעד שנוצר (בתוך תחום gym)
    await waitFor(() => expect(r.currentPath()).toMatch(/^\/gym\/goals\/goal_/));
    const gymGoals = listGoalsByDomain("gym");
    expect(gymGoals.length).toBe(1);
    expect(gymGoals[0].domain).toBe("gym");
    expect(getGoal(gymGoals[0].id)?.domain).toBe("gym");
  });
});
