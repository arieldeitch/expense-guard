// @vitest-environment jsdom
/**
 * התראת אחסון גלובלית — render אמיתי מול route tree, לא בדיקת יחידה של רכיב.
 *
 * מוודא שכשל כתיבה **בכל אחד** מתשעת מודולי האחסון גלוי למשתמש בכל מסך, ולא רק
 * במסך האימון (ADR-0032/0033).
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import { renderRoute } from "./routerTestHarness";
import { writeCatalogState, type CatalogState } from "@/lib/catalog/storage";
import { writeHomeState, readHomeState } from "@/lib/home/storage";
import { writeTemplatesState, readTemplatesState } from "@/lib/templates/storage";
import { writeGoalsState, readGoalsState } from "@/lib/goals/storage";
import { writeRunsState, readRunsState } from "@/lib/runs/storage";
import { writePreferences } from "@/lib/preferences";
import { FAILED_MESSAGE, MEMORY_ONLY_MESSAGE } from "@/components/storage/storageNotice";

const EMPTY_CATALOG: CatalogState = { locations: [], treadmills: [], equipment: [] };

/** מכריח את localStorage להיכשל כמו מכסה מלאה, בלי לגעת בקוד המוצר. */
function breakStorage() {
  const err = new Error("full");
  err.name = "QuotaExceededError";
  return vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw err;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

async function writeThrough(fn: () => void) {
  await act(async () => {
    fn();
  });
}

describe("אין banner כשהכול נשמר", () => {
  it("מסך רגיל ללא כשל כתיבה אינו מציג התראה", async () => {
    await renderRoute("/");
    expect(screen.queryByText(MEMORY_ONLY_MESSAGE)).toBeNull();
    expect(screen.queryByText(FAILED_MESSAGE)).toBeNull();
  });

  it("כתיבה מוצלחת אינה מייצרת התראה (אין toast בכל שינוי)", async () => {
    await renderRoute("/");
    await writeThrough(() => writeCatalogState(EMPTY_CATALOG));
    expect(screen.queryByText(MEMORY_ONLY_MESSAGE)).toBeNull();
    expect(screen.queryByText(FAILED_MESSAGE)).toBeNull();
  });
});

describe("memory_only — כשל כתיבה בכל מודול גלוי למשתמש", () => {
  it("כשל ב-catalog מוצג עם role=status", async () => {
    await renderRoute("/");
    breakStorage();
    await writeThrough(() => writeCatalogState(EMPTY_CATALOG));

    const message = await screen.findByText(MEMORY_ONLY_MESSAGE);
    expect(message).toBeInTheDocument();
    expect(message.closest('[role="status"]')).not.toBeNull();
  });

  it("כשל ב-home מוצג", async () => {
    await renderRoute("/");
    const state = readHomeState();
    breakStorage();
    await writeThrough(() => writeHomeState({ ...state }));

    expect(await screen.findByText(MEMORY_ONLY_MESSAGE)).toBeInTheDocument();
  });

  it("כשל ב-templates מוצג", async () => {
    await renderRoute("/");
    const state = readTemplatesState();
    breakStorage();
    await writeThrough(() => writeTemplatesState({ ...state }));

    expect(await screen.findByText(MEMORY_ONLY_MESSAGE)).toBeInTheDocument();
  });

  it("כשל ב-goals מוצג", async () => {
    await renderRoute("/");
    const state = readGoalsState();
    breakStorage();
    await writeThrough(() => writeGoalsState({ ...state }));

    expect(await screen.findByText(MEMORY_ONLY_MESSAGE)).toBeInTheDocument();
  });

  it("כשל ב-runs מוצג", async () => {
    await renderRoute("/");
    const state = readRunsState();
    breakStorage();
    await writeThrough(() => writeRunsState({ ...state }));

    expect(await screen.findByText(MEMORY_ONLY_MESSAGE)).toBeInTheDocument();
  });

  it("כשל ב-preferences מוצג", async () => {
    await renderRoute("/");
    breakStorage();
    await writeThrough(() => writePreferences({ landingModule: "running" }));

    expect(await screen.findByText(MEMORY_ONLY_MESSAGE)).toBeInTheDocument();
  });

  it("ההתראה מוצגת גם במסך שאינו מסך האימון", async () => {
    await renderRoute("/more");
    breakStorage();
    await writeThrough(() => writeCatalogState(EMPTY_CATALOG));

    expect(await screen.findByText(MEMORY_ONLY_MESSAGE)).toBeInTheDocument();
  });
});

describe("failed — כשל סריאליזציה", () => {
  it("מוצג עם role=alert והודעת הורדת גיבוי", async () => {
    await renderRoute("/");
    const circular: Record<string, unknown> = { ...EMPTY_CATALOG };
    circular.self = circular;
    await writeThrough(() => writeCatalogState(circular as unknown as CatalogState));

    const message = await screen.findByText(FAILED_MESSAGE);
    expect(message.closest('[role="alert"]')).not.toBeNull();
    expect(screen.queryByText(MEMORY_ONLY_MESSAGE)).toBeNull();
  });
});

describe("התאוששות", () => {
  it("כתיבה מוצלחת אחרי כשל מסירה את ההתראה", async () => {
    await renderRoute("/");
    const spy = breakStorage();
    await writeThrough(() => writeCatalogState(EMPTY_CATALOG));
    expect(await screen.findByText(MEMORY_ONLY_MESSAGE)).toBeInTheDocument();

    spy.mockRestore();
    await writeThrough(() => writeCatalogState({ ...EMPTY_CATALOG }));

    expect(screen.queryByText(MEMORY_ONLY_MESSAGE)).toBeNull();
    expect(screen.queryByText(FAILED_MESSAGE)).toBeNull();
  });
});

describe("נגישות", () => {
  it("ההתראה כוללת קישור נגיש למסך הגיבוי והשחזור", async () => {
    await renderRoute("/");
    breakStorage();
    await writeThrough(() => writeCatalogState(EMPTY_CATALOG));

    const banner = (await screen.findByText(MEMORY_ONLY_MESSAGE)).closest(
      '[role="status"]',
    ) as HTMLElement;
    const link = within(banner).getByRole("link", { name: "גיבוי ושחזור" });
    expect(link).toHaveAttribute("href", "/backup");
  });

  it("צבע אינו הסמן היחיד — יש כותרת מילולית להתראה", async () => {
    await renderRoute("/");
    breakStorage();
    await writeThrough(() => writeCatalogState(EMPTY_CATALOG));

    const banner = (await screen.findByText(MEMORY_ONLY_MESSAGE)).closest(
      '[role="status"]',
    ) as HTMLElement;
    expect(banner.textContent).toContain("אזהרת שמירה");
  });
});
