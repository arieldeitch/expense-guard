// @vitest-environment jsdom
/**
 * Workout Execution — עריכת סטים בזמן אימון (משקל, RPE, השלמה).
 * מאמת שכל שינוי נשמר ב-repository ולכן שורד refresh.
 *
 * מפוצל לפי flow (ADR-0026): קובץ זה = עריכת ערכי סט בלבד.
 * הוספת סט וסיום חלקי — `workoutExecutionFinish.test.tsx`.
 */
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";
import { seedActiveSession } from "./workoutFixtures";
import { getSet } from "@/lib/sessions";

describe("עריכת סט נשמרת ב-repository", () => {
  it("הגדלת משקל בלחיצה אחת נשמרת", async () => {
    const user = userEvent.setup();
    const { session, sets } = seedActiveSession();
    const open = sets[1]; // סט שטרם הושלם
    const before = getSet(open.id)?.actual_weight ?? 0;

    await renderRoute(`/sessions/${session.id}`);

    // פעולת מגע אחת: כפתור "+" של שדה המשקל
    await user.click(await screen.findByRole("button", { name: `הוסף משקל סט ${open.set_number}` }));

    await waitFor(() => {
      expect(getSet(open.id)?.actual_weight).toBeGreaterThan(before);
    });
  });

  it("עדכון RPE נשמר (השדה נתמך בחוזה)", async () => {
    const user = userEvent.setup();
    const { session, sets } = seedActiveSession();
    const open = sets[1];
    expect(getSet(open.id)?.rpe).toBeNull();

    await renderRoute(`/sessions/${session.id}`);

    await user.click(await screen.findByRole("button", { name: `הוסף RPE סט ${open.set_number}` }));

    await waitFor(() => {
      expect(getSet(open.id)?.rpe).not.toBeNull();
    });
  });

  it("סימון סט כהושלם נשמר", async () => {
    const user = userEvent.setup();
    const { session, sets } = seedActiveSession();
    const open = sets[1];
    expect(getSet(open.id)?.completed).toBe(false);

    await renderRoute(`/sessions/${session.id}`);

    const buttons = await screen.findAllByRole("button", { name: "סמן סט כהושלם" });
    await user.click(buttons[0]);

    await waitFor(() => {
      expect(getSet(open.id)?.completed).toBe(true);
    });
  });
});
