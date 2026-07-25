// @vitest-environment jsdom
/**
 * loaders + not-found של routes הקטלוג שתוקנו במעבר ל-`useParams` (ADR-0022):
 * `exercises.$id` ו-`locations.$id`. שני אלה גם אימתו את שיטוח ה-route nesting
 * (ADR-0025) — לפני השיטוח הם נכשלו כי המסך האב עטף אותם כ-layout.
 *
 * פוצל מ-`systemErrors.test.tsx` — ראה docs/ai/decisions.md ADR-0026.
 */
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";

describe("corrected catalog routes — loaders + notFound run (useParams migration)", () => {
  it("/exercises/$id missing shows the Hebrew not-found state", async () => {
    await renderRoute("/exercises/ex_missing_id");
    expect(await screen.findByText("התרגיל לא נמצא")).toBeInTheDocument();
  });

  it("/locations/$id missing shows the Hebrew not-found state", async () => {
    await renderRoute("/locations/loc_missing_id");
    expect(await screen.findByText("המקום לא נמצא")).toBeInTheDocument();
  });
});
