// @vitest-environment jsdom
/**
 * loaders + `notFound()` של routes הריצה שתוקנו במעבר ל-`useParams` (ADR-0022):
 * `running.$id` ו-`running.new.$type`. סוגר את פער בדיקות ה-loader/notFound.
 *
 * פוצל מ-`systemErrors.test.tsx` — ראה docs/ai/decisions.md ADR-0026.
 */
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";
import { runInput } from "./fixtures";
import { createRun } from "@/lib/runs/repo";

describe("corrected running routes — loaders + notFound run (useParams migration)", () => {
  it("/running/$id with a missing id triggers the loader's notFound", async () => {
    await renderRoute("/running/run_missing_id");
    expect(await screen.findByText("העמוד לא נמצא")).toBeInTheDocument();
  });

  it("/running/$id renders the run when it exists (loader passes)", async () => {
    const run = createRun(runInput({ run_type: "treadmill" }));
    const r = await renderRoute(`/running/${run.id}`);
    expect(r.currentPath()).toContain("/running/");
    // מסך פרטי ריצה נטען (לא 404)
    expect(screen.queryByText("העמוד לא נמצא")).toBeNull();
  });

  it("/running/new/$type with an invalid type triggers the loader's notFound", async () => {
    await renderRoute("/running/new/bogus-type");
    expect(await screen.findByText("העמוד לא נמצא")).toBeInTheDocument();
  });

  it("/running/new/treadmill (valid type) renders the form, not 404", async () => {
    const r = await renderRoute("/running/new/treadmill");
    expect(r.currentPath()).toBe("/running/new/treadmill");
    expect(screen.queryByText("העמוד לא נמצא")).toBeNull();
  });
});
