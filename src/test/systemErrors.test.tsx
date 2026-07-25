// @vitest-environment jsdom
/**
 * מסכי מערכת: not-found, error boundary, loaders של ה-routes שתוקנו (useParams),
 * עברית + RTL + accessibility. סוגר את פער בדיקות ה-loader/notFound.
 */
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";
import { createRun } from "@/lib/runs/repo";

describe("not-found rendering (Hebrew, RTL, a11y)", () => {
  it("unknown route renders the Hebrew 404", async () => {
    await renderRoute("/no/such/path/here");
    expect(await screen.findByText("העמוד לא נמצא")).toBeInTheDocument();
    // קישור חזרה נגיש בעברית
    expect(screen.getByRole("link", { name: "חזרה למסך הראשי" })).toBeInTheDocument();
    // RTL קיים בעץ
    expect(document.querySelector('[dir="rtl"]')).not.toBeNull();
    // אין טקסט framework גנרי באנגלית
    expect(screen.queryByText(/Page not found|Not Found/i)).toBeNull();
  });
});

describe("corrected routes — loaders + notFound run (useParams migration)", () => {
  it("/running/$id with a missing id triggers the loader's notFound", async () => {
    await renderRoute("/running/run_missing_id");
    expect(await screen.findByText("העמוד לא נמצא")).toBeInTheDocument();
  });

  it("/running/$id renders the run when it exists (loader passes)", async () => {
    const run = createRun({ run_type: "treadmill" });
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

  it("/exercises/$id missing shows the Hebrew not-found state", async () => {
    await renderRoute("/exercises/ex_missing_id");
    expect(await screen.findByText("התרגיל לא נמצא")).toBeInTheDocument();
  });

  it("/locations/$id missing shows the Hebrew not-found state", async () => {
    await renderRoute("/locations/loc_missing_id");
    expect(await screen.findByText("המקום לא נמצא")).toBeInTheDocument();
  });
});

describe("error boundary (invalid search) renders Hebrew alert", () => {
  it("/goals/new with an invalid domain surfaces a Hebrew error, not English framework text", async () => {
    await renderRoute("/goals/new?domain=not-a-domain");
    // או error boundary עברי, או fallback ל-chooser — בכל מקרה עברית, ללא טקסט framework
    const hebrewError = screen.queryByText("לא ניתן לטעון את הנתונים");
    const chooser = screen.queryByText("יעד חדש");
    expect(hebrewError ?? chooser).not.toBeNull();
    expect(screen.queryByText(/Something went wrong|Invalid|Error:/i)).toBeNull();
  });
});
