// @vitest-environment jsdom
/**
 * ADR-0042 — ניווט ראשי, מרכז היסטוריה, מסך דיווח, תוכניות, טיוטה עצלה ומניעת לחיצה כפולה.
 * רץ בבידוד (test:router:compact-ux) כמו שאר בדיקות המסכים.
 */
import { expect, it } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";
import { runInput } from "./fixtures";
import { createRun, listRuns } from "@/lib/runs/repo";
import {
  createHomeSession,
  addEntry,
  addSet,
  completeHomeSession,
  listEntrySets,
} from "@/lib/home";
import { listExercises } from "@/lib/exercises";
import { createTreadmill, createLocation } from "@/lib/catalog";

it("main navigation has five destinations and marks exactly one active", async () => {
  const r = await renderRoute("/history");
  const nav = screen.getAllByRole("navigation", { name: "ניווט ראשי" })[0];
  const links = within(nav).getAllByRole("link");
  expect(links.map((l) => l.textContent)).toEqual(["ראשי", "דיווח", "היסטוריה", "תוכניות", "עוד"]);
  const current = links.filter((l) => l.getAttribute("aria-current") === "page");
  expect(current).toHaveLength(1);
  expect(current[0]).toHaveTextContent("היסטוריה");
  expect(r.currentPath()).toBe("/history");
});

it("history lists compact rows grouped by week, filters by type and text, and opens the detail", async () => {
  const run = createRun(
    runInput({ run_type: "treadmill", duration_seconds: 2240, distance_meters: 6250 }),
  );
  const ex = listExercises().find((e) => e.slug === "crunches")!;
  const s = createHomeSession({ name: "פק״ל ערב" });
  const entry = addEntry(s.id, ex.id);
  for (const reps of [15, 20, 17]) addSet(entry.id, { reps, completed: true });
  completeHomeSession(s.id);

  const r = await renderRoute("/history");
  expect(await screen.findByTestId("history-count")).toHaveTextContent("2 אימונים");
  const rows = screen.getAllByRole("link", { name: /ריצה על הליכון|פק״ל ערב/ });
  expect(rows).toHaveLength(2);
  expect(rows.map((x) => x.textContent?.includes("6.25 ק״מ · 37:20"))).toContain(true);
  expect(screen.getByText(/3 סטים · 52 חזרות/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "פק״ל בבית" }));
  expect(screen.getByTestId("history-count")).toHaveTextContent("1 אימונים");
  expect(screen.queryByRole("link", { name: /ריצה על הליכון/ })).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "הכול" }));
  fireEvent.change(screen.getByLabelText("חיפוש בהיסטוריה"), { target: { value: "כפיפות" } });
  expect(screen.getByTestId("history-count")).toHaveTextContent("1 אימונים");
  fireEvent.click(screen.getByRole("button", { name: "איפוס" }));
  expect(screen.getByTestId("history-count")).toHaveTextContent("2 אימונים");

  fireEvent.click(screen.getByRole("link", { name: /ריצה על הליכון/ }));
  await waitFor(() => expect(r.currentPath()).toBe(`/running/${run.id}`));
});

it("history month stepper narrows to a month and shows a clear empty state with reset", async () => {
  createRun(runInput({ started_at: "2026-03-05T06:00:00.000Z" }));
  await renderRoute("/history");
  fireEvent.click(screen.getByRole("button", { name: "הצג את החודש הנוכחי" }));
  expect(await screen.findByText("אין אימונים שמתאימים לסינון")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "איפוס סינון" }));
  expect(screen.getByTestId("history-count")).toHaveTextContent("1 אימונים");
  expect(screen.queryByText("אין אימונים שמתאימים לסינון")).toBeNull();
});

it("report screen lists open drafts first and every way to report", async () => {
  createRun(runInput({ status: "draft", duration_seconds: 600 }));
  await renderRoute("/report");
  expect(await screen.findByRole("heading", { name: /להמשיך טיוטה · 1/ })).toBeInTheDocument();
  // ADR-0045: the home entry on this screen is now the two fixed routines + a single exercise.
  for (const name of [
    "ריצה על הליכון",
    "ריצה בחוץ",
    "פק״לים בוקר",
    "פק״לים ערב",
    "תרגיל יחיד",
    "אימון מכון",
  ])
    expect(screen.getAllByRole("link", { name: new RegExp(name) }).length).toBeGreaterThan(0);
});

it("plans screen shows the half-marathon project, goals and templates", async () => {
  await renderRoute("/plans");
  expect(await screen.findByRole("link", { name: /חצאי המרתון 2026/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /הגדרת יעד/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /תבניות פק״ל בבית/ })).toBeInTheDocument();
});

it("opening the run form creates no draft until the first edit (R-28)", async () => {
  await renderRoute("/running/new/treadmill");
  expect(listRuns()).toHaveLength(0);
  fireEvent.change(screen.getByLabelText("משך הריצה בדקות"), { target: { value: "37" } });
  await waitFor(() => expect(listRuns()).toHaveLength(1));
  expect(listRuns()[0].status).toBe("draft");
  expect(listRuns()[0].duration_seconds).toBe(2220);
});

it("a double tap on save-and-complete completes exactly one run", async () => {
  await renderRoute("/running/new/treadmill");
  fireEvent.change(screen.getByLabelText("משך הריצה בדקות"), { target: { value: "37" } });
  fireEvent.change(screen.getByLabelText("משך הריצה בשניות"), { target: { value: "20" } });
  fireEvent.change(screen.getByLabelText("מרחק בקילומטרים"), { target: { value: "6,25" } });
  const btn = screen.getByRole("button", { name: /שמור.*סיים/ });
  fireEvent.click(btn);
  fireEvent.click(btn);
  await waitFor(() => expect(listRuns().filter((r) => r.status === "completed")).toHaveLength(1));
  expect(listRuns()).toHaveLength(1);
  expect(listRuns()[0].distance_meters).toBe(6250);
});

it("the home screen snapshot is computed from the real local data", async () => {
  createRun(
    runInput({
      run_type: "treadmill",
      distance_meters: 5000,
      duration_seconds: 1800,
      started_at: new Date().toISOString(),
    }),
  );
  await renderRoute("/");
  expect(await screen.findByRole("link", { name: "השבוע — פתיחת ההיסטוריה" })).toHaveTextContent(
    "1 אימונים",
  );
  expect(screen.queryByText("עדיין אין ריצות שנרשמו.")).toBeNull();
});

it("catalog deep links render for a real id and 404 for a bogus one (R-43)", async () => {
  const loc = createLocation({
    name: "מכון בקיבוץ",
    location_type: "gym_kibbutz",
    country_code: "IL",
    city: null,
    area: null,
    address: null,
    description: null,
    notes: null,
    latitude: null,
    longitude: null,
  });
  const t = createTreadmill({
    location_id: loc.id,
    display_name: "הליכון 1",
    machine_number: null,
    manufacturer: null,
    model: null,
    serial_number: null,
    visual_description: null,
    image_url: null,
    notes: null,
  });
  const ok = await renderRoute(`/treadmills/${t.id}`);
  expect(ok.currentPath()).toBe(`/treadmills/${t.id}`);
  expect(screen.queryByText("העמוד לא נמצא")).toBeNull();
  await renderRoute("/treadmills/does-not-exist");
  expect(await screen.findByText("העמוד לא נמצא")).toBeInTheDocument();
});

it("home bulk sets still record 15, 20, 17 through the report → quick flow", async () => {
  const ex = listExercises().find((e) => e.slug === "crunches")!;
  const s = createHomeSession({ name: "פק״ל" });
  const entry = addEntry(s.id, ex.id);
  await renderRoute(`/home/sessions/${s.id}`);
  fireEvent.change(await screen.findByLabelText("חזרות לכל סט"), {
    target: { value: "15, 20, 17" },
  });
  fireEvent.click(screen.getByRole("button", { name: "הוסף סטים שבוצעו" }));
  expect(listEntrySets(entry.id).map((x) => x.reps)).toEqual([15, 20, 17]);
});
