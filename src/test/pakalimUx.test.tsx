// @vitest-environment jsdom
/**
 * ADR-0044/0045/0046 — the screens behind Ariel's feedback:
 * the fast pakal report, the exercise bank navigation, editing a saved report,
 * and the Suunto/running input contract in the actual form.
 */
import { expect, it } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";
import {
  PAKAL_DEFINITIONS,
  listHomeSessions,
  openPakalSession,
  pakalLines,
  pakalTotal,
  setPakalQuantity,
} from "@/lib/home";
import { listExercises } from "@/lib/exercises";

it("home screen offers the two fixed routines and says whether today is reported", async () => {
  await renderRoute("/home");
  expect(await screen.findByRole("link", { name: /פק״לים בוקר/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /פק״לים ערב/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /פק״לים בוקר/ })).toHaveTextContent("טרם דווח היום");
});

it("reports a morning pakal by quantity, with no timer anywhere on the screen", async () => {
  const r = await renderRoute("/home/pakal/morning");
  await screen.findByRole("heading", { name: "פק״לים בוקר" });
  expect(r.currentPath()).toBe("/home/pakal/morning");

  const session = listHomeSessions()[0];
  expect(session.name).toBe("פק״לים בוקר");
  const lines = pakalLines(session.id);
  expect(lines.length).toBeGreaterThan(0);

  const first = screen.getByLabelText(`כמות ${lines[0].name}`);
  fireEvent.change(first, { target: { value: "30" } });
  await waitFor(() => expect(pakalLines(session.id)[0].quantity).toBe(30));

  // ± nudges, still quantity
  fireEvent.click(screen.getByLabelText(`הוסף ${lines[0].name}`));
  await waitFor(() => expect(pakalLines(session.id)[0].quantity).toBe(31));

  // No duration field and no timer control on this screen.
  expect(screen.queryByLabelText(/זמן|טיימר/)).toBeNull();
  expect(pakalLines(session.id)[0].quantity).toBe(31);
});

it("re-opening the routine resumes the same report instead of creating a second", async () => {
  const session = openPakalSession("morning");
  setPakalQuantity(pakalLines(session.id)[0], 20);
  const before = listHomeSessions().length;

  await renderRoute("/home/pakal/morning");
  await screen.findByRole("heading", { name: "פק״לים בוקר" });
  expect(listHomeSessions()).toHaveLength(before);

  const lines = pakalLines(session.id);
  const field = screen.getByLabelText(`כמות ${lines[0].name}`) as HTMLInputElement;
  expect(field.value).toBe("20");
  fireEvent.change(field, { target: { value: "25" } });
  await waitFor(() => expect(pakalLines(session.id)[0].quantity).toBe(25));
  expect(listHomeSessions()).toHaveLength(before);
});

it("adds an exercise through equipment → muscle group → exercise, common first", async () => {
  await renderRoute("/home/pakal/evening");
  await screen.findByRole("heading", { name: "פק״לים ערב" });
  const session = listHomeSessions()[0];
  const before = pakalLines(session.id).length;

  fireEvent.click(screen.getByRole("button", { name: "הוסף תרגיל" }));
  const picker = screen.getByRole("region", { name: "בחירת תרגיל" });
  fireEvent.click(within(picker).getByRole("button", { name: /דאמבלים/ }));
  fireEvent.click(within(picker).getByRole("button", { name: "יד קדמית" }));

  const options = within(picker).getAllByRole("button");
  const firstExercise = options.find((b) => b.textContent?.includes("הנפוץ ביותר"));
  expect(firstExercise).toBeTruthy();
  expect(firstExercise!.textContent).toContain("כפיפות מרפקים עם משקולות");
  fireEvent.click(firstExercise!);

  await waitFor(() => expect(pakalLines(session.id)).toHaveLength(before + 1));
});

it("keeps a saved report editable from its summary — same record", async () => {
  const session = openPakalSession("morning");
  for (const line of pakalLines(session.id)) setPakalQuantity(line, 10);
  const total = pakalTotal(session.id);
  const count = listHomeSessions().length;

  const r = await renderRoute(`/home/sessions/${session.id}/summary`);
  const edit = await screen.findByRole("link", { name: /תיקון הדיווח/ });
  expect(edit).toHaveAttribute("href", "/home/pakal/morning");
  fireEvent.click(edit);
  await waitFor(() => expect(r.currentPath()).toBe("/home/pakal/morning"));
  expect(listHomeSessions()).toHaveLength(count);
  expect(pakalTotal(session.id)).toBe(total);
});

it("the session title never becomes an exercise name", async () => {
  const ex = listExercises().find((e) => e.slug === "push-ups")!;
  await renderRoute("/home/quick");
  fireEvent.click((await screen.findAllByRole("button", { name: ex.name_he }))[0]);
  await waitFor(() => expect(listHomeSessions()).toHaveLength(1));
  expect(listHomeSessions()[0].name).toBe("דיווח מהיר");
});

it("the report screen lists both routines as one-tap destinations", async () => {
  await renderRoute("/report");
  const morning = await screen.findByRole("link", { name: /פק״לים בוקר/ });
  expect(morning).toHaveAttribute("href", "/home/pakal/morning");
  expect(screen.getByRole("link", { name: /פק״לים ערב/ })).toHaveAttribute(
    "href",
    "/home/pakal/evening",
  );
});

it("an unknown routine slug is a real 404", async () => {
  await renderRoute("/home/pakal/afternoon");
  expect(await screen.findByText("העמוד לא נמצא")).toBeInTheDocument();
  expect(PAKAL_DEFINITIONS.morning.templateId).toBe("tpl_pakal_morning");
});
