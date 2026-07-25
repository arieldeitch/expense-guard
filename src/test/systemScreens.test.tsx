// @vitest-environment jsdom
/**
 * מסכי מערכת ברמת ה-root: not-found ו-error boundary.
 * עברית + RTL + accessibility, ללא טקסט framework באנגלית.
 *
 * פוצל מ-`systemErrors.test.tsx` — ראה docs/ai/decisions.md ADR-0026.
 */
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";

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
