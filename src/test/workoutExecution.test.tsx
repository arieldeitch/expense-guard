// @vitest-environment jsdom
/**
 * Workout Execution — טעינה, שרידות אחרי refresh, ומצב שגיאה.
 * מרונדר דרך ה-route האמיתי `/sessions/$id`.
 */
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";
import { seedActiveSession, SESSIONS_STORAGE_KEY } from "./workoutFixtures";

describe("Workout Execution — טעינה מאימון קיים", () => {
  it("מציג את שם האימון, התרגיל והסטים שלו", async () => {
    const { session, exerciseName, sets } = seedActiveSession();

    await renderRoute(`/sessions/${session.id}`);

    expect((await screen.findAllByText(session.name)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(exerciseName)).length).toBeGreaterThan(0);
    // כל הסטים מוצגים. הסט שכבר הושלם מציג פעולת ביטול; השאר — פעולת השלמה.
    const completed = screen.getAllByRole("button", { name: "בטל השלמת סט" });
    const open = screen.getAllByRole("button", { name: "סמן סט כהושלם" });
    expect(completed.length).toBe(1);
    expect(completed.length + open.length).toBe(sets.length);
  });

  it("מציג סטטוס שמירה אמיתי אחרי שה-repository אישר כתיבה", async () => {
    const { session } = seedActiveSession();
    await renderRoute(`/sessions/${session.id}`);
    // localStorage זמין ב-jsdom → הכתיבה הצליחה → "נשמר במכשיר"
    expect(await screen.findByText(/נשמר במכשיר/)).toBeInTheDocument();
    expect(screen.queryByText(/לא ישרוד רענון/)).toBeNull();
  });
});

describe("Workout Execution — שרידות אחרי refresh", () => {
  it("האימון והערכים שהוזנו נשמרים ב-localStorage ונטענים מחדש", async () => {
    const { session, sets } = seedActiveSession();

    // מה שנמצא ב-localStorage הוא מה ששורד refresh
    const raw = window.localStorage.getItem(SESSIONS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw as string) as {
      sessions: Array<{ id: string; name: string }>;
      sets: Array<{ id: string; actual_weight: number | null }>;
    };
    expect(persisted.sessions.some((s) => s.id === session.id)).toBe(true);
    expect(persisted.sets.find((s) => s.id === sets[0].id)?.actual_weight).toBe(60);

    // רינדור חוזר (router חדש) קורא את אותו state ומציג את האימון
    await renderRoute(`/sessions/${session.id}`);
    expect((await screen.findAllByText(session.name)).length).toBeGreaterThan(0);
  });
});

describe("Workout Execution — מצב שגיאה והתאוששות", () => {
  it("מזהה אימון חסר מציג הסבר ומסלול יציאה, לא 404 גנרי", async () => {
    await renderRoute("/sessions/session_does_not_exist");

    expect(await screen.findByText("האימון לא נמצא")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "חזרה לחדר כושר" })).toBeInTheDocument();
    // מבהיר שנתונים אחרים לא נפגעו
    expect(screen.getByText(/אימונים אחרים לא הושפעו/)).toBeInTheDocument();
  });
});
