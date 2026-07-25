/**
 * Router test harness — בדיקות render/navigation אמיתיות מול route tree האמיתי.
 *
 * לא משכפל business logic, לא עוקף loaders, לא מבצע network. יוצר router עם
 * memory history, מרנדר `RouterProvider`, וממתין לסיום navigation/loaders.
 * מבודד state (repositories + localStorage) בין בדיקות.
 *
 * שימוש בקובץ בדיקה: הוסף בראש הקובץ `// @vitest-environment jsdom`.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect } from "vitest";
import { cleanup, render, waitFor, type RenderResult } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  type AnyRouter,
} from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { _resetGoalsStateForTests } from "@/lib/goals";
import { _resetSessionsStateForTests } from "@/lib/sessions";
import { _resetHomeStateForTests } from "@/lib/home/storage";

// ---- jsdom polyfills (APIs שדפדפן מספק ו-jsdom לא) — לא mocks שמסתירים תקלות ----
function installBrowserPolyfills() {
  if (typeof window === "undefined") return;
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
  if (!("ResizeObserver" in window)) {
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!window.scrollTo) {
    window.scrollTo = () => {};
  }
}
installBrowserPolyfills();

/** איפוס מלא של stores + localStorage — בידוד בין בדיקות (order-independent). */
export function resetAllStores() {
  try {
    window.localStorage.clear();
  } catch {
    /* no-op */
  }
  _resetGoalsStateForTests();
  _resetSessionsStateForTests();
  _resetHomeStateForTests();
}

beforeEach(() => {
  resetAllStores();
});

afterEach(() => {
  cleanup();
  resetAllStores();
});

export interface RenderRouteResult extends RenderResult {
  router: AnyRouter;
  /** ה-pathname הנוכחי לאחר navigation/redirects. */
  currentPath: () => string;
}

/**
 * מרנדר את ה-app ב-route נתון (deep link) וממתין לסיום ה-router.
 * @param initialPath נתיב התחלתי, לרבות search params (למשל "/goals/new?domain=gym").
 */
export async function renderRoute(initialPath: string): Promise<RenderRouteResult> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const history = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history,
    defaultPreloadStaleTime: 0,
  });

  // מרֵנדר את ההתאמה ההתחלתית + loaders לפני ה-render (memory history).
  await router.load();

  const utils = render(<RouterProvider router={router as AnyRouter} />);

  // ממתין להתייצבות ה-router (idle לניווט/redirect/notFound; error ל-validation errors) —
  // לא "pending". כך ניתן לבדוק גם מסכי שגיאה ולא רק זרימות מוצלחות.
  await waitFor(
    () => {
      expect(router.state.status).not.toBe("pending");
    },
    { timeout: 5000 },
  );

  return {
    ...utils,
    router: router as AnyRouter,
    currentPath: () => router.state.location.pathname,
  };
}
