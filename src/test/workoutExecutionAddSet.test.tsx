// @vitest-environment jsdom
/**
 * Workout Execution — הוספת סט בזמן אימון.
 * מפוצל לפי flow (ADR-0026).
 */
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";
import { seedActiveSession } from "./workoutFixtures";
import { listExerciseSets } from "@/lib/sessions";

describe("הוספת סט", () => {
  it("נשמרת ב-repository", async () => {
    const user = userEvent.setup();
    const { session, sessionExercise, sets } = seedActiveSession();

    await renderRoute(`/sessions/${session.id}`);

    const addButtons = await screen.findAllByRole("button", { name: /הוסף סט/ });
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(listExerciseSets(sessionExercise.id).length).toBe(sets.length + 1);
    });
  });
});
