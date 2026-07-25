// @vitest-environment jsdom
/**
 * Home plan — בחירת תרגילים (picker) ובניית תוכנית.
 * מפוצל לפי flow (ADR-0026): קובץ זה = ה-picker ומסך עריכת התוכנית.
 */
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";
import { createHomeTemplate, listHomeTemplateEntries } from "@/lib/home";

describe("Home plan — בחירת תרגילים", () => {
  it("מציג קבוצות בשפת משתמש ומאפשר בחירה מרובה בפחות משלוש פעולות לתרגיל", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const tpl = createHomeTemplate({ name: "תוכנית בדיקה" });

    await renderRoute(`/home/templates/${tpl.id}/edit`);

    // פעולה 1: פתיחת ה-picker
    await user.click(await screen.findByRole("button", { name: /תרגיל/ }));

    // קבוצות בשפת משתמש, לא קטגוריות טכניות
    expect(await screen.findByText("חזה ודחיפה")).toBeInTheDocument();
    expect(screen.getByText("רגליים וישבן")).toBeInTheDocument();
    expect(screen.getByText("ליבה")).toBeInTheDocument();

    // פעולה 2: בחירת שני תרגילים (בחירה מרובה — ה-picker לא נסגר)
    await user.click(screen.getByRole("button", { name: "הוסף שכיבות סמיכה" }));
    await user.click(screen.getByRole("button", { name: "הוסף סקוואט משקל גוף" }));

    // פעולה 3: אישור אחד לשניהם
    await user.click(screen.getByRole("button", { name: "הוסף 2 תרגילים" }));

    await waitFor(() => {
      expect(listHomeTemplateEntries(tpl.id).length).toBe(2);
    });
  });

  it("חיפוש עובד בעברית ובאנגלית", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const tpl = createHomeTemplate({ name: "תוכנית חיפוש" });

    await renderRoute(`/home/templates/${tpl.id}/edit`);
    await user.click(await screen.findByRole("button", { name: /תרגיל/ }));

    const search = await screen.findByRole("textbox", { name: "חיפוש תרגיל" });

    await user.type(search, "פלאנק");
    expect(await screen.findByRole("button", { name: "הוסף פלאנק" })).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "squat");
    expect(await screen.findByRole("button", { name: "הוסף סקוואט משקל גוף" })).toBeInTheDocument();
  });
});
