// @vitest-environment jsdom
/**
 * Compatibility routes (/goals, /goals/new, /goals/$id) — deprecated, לא בניווט.
 * מאמת: אין רשימה גלובלית, redirect לפי domain, בחירת תחום, 404 עברית, ללא redirect loop.
 */
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";
import { createGoal, type GoalDomain } from "@/lib/goals";

describe("/goals compatibility", () => {
  it("shows a compact domain chooser, not a global goals list", async () => {
    createGoal({ domain: "gym", goal_type: "gym_sessions_in_period", target_value: 10, name: "GLOBAL_LEAK" });
    const r = await renderRoute("/goals");
    expect(r.currentPath()).toBe("/goals");
    expect(await screen.findByText("יעדים לפי תחום")).toBeInTheDocument();
    // אין רשימה גלובלית: יעד קיים לא מוצג כאן, ואין כפתור יצירה גלובלי
    expect(screen.queryByText("GLOBAL_LEAK")).toBeNull();
    expect(screen.queryByText("יצירת יעד חדש")).toBeNull();
  });

  it("choosing a domain tile navigates to that domain's goals list", async () => {
    const user = userEvent.setup();
    await renderRoute("/goals");
    await user.click(await screen.findByRole("link", { name: "יעדי חדר כושר" }));
    expect((await screen.findAllByText("יעדי כוח")).length).toBeGreaterThan(0);
  });

  it("?domain= redirects to the domain list", async () => {
    const r = await renderRoute("/goals?domain=running");
    expect(r.currentPath()).toBe("/running/goals");
  });
});

describe("/goals/new compatibility", () => {
  it.each<[GoalDomain, string]>([
    ["running", "/running/goals/new"],
    ["gym", "/gym/goals/new"],
    ["home", "/home/goals/new"],
  ])("?domain=%s redirects to %s", async (domain, target) => {
    const r = await renderRoute(`/goals/new?domain=${domain}`);
    expect(r.currentPath()).toBe(target);
  });

  it("without domain shows the 3-tile chooser (no goal created)", async () => {
    const r = await renderRoute("/goals/new");
    expect(r.currentPath()).toBe("/goals/new");
    expect((await screen.findAllByText("יעד חדש")).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "יעד חדש — ריצה" })).toBeInTheDocument();
  });
});

describe("/goals/$id compatibility", () => {
  it.each<GoalDomain>(["running", "gym", "home"])(
    "redirects a %s goal to its domain detail (source of truth = goal.domain)",
    async (domain) => {
      const type =
        domain === "running"
          ? "run_monthly_distance"
          : domain === "gym"
            ? "gym_sessions_in_period"
            : "home_consecutive_reps";
      const g = createGoal({ domain, goal_type: type, target_value: 20 });
      const r = await renderRoute(`/goals/${g.id}`);
      expect(r.currentPath()).toBe(`/${domain}/goals/${g.id}`);
    },
  );

  it("missing goal shows Hebrew 404 (no redirect loop)", async () => {
    const r = await renderRoute("/goals/goal_does_not_exist");
    expect(r.currentPath()).toBe("/goals/goal_does_not_exist");
    expect(await screen.findByText("היעד לא נמצא")).toBeInTheDocument();
  });
});
