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
import { _resetCatalogStateForTests } from "@/lib/catalog/storage";
import { _resetExercisesStateForTests } from "@/lib/exercises/storage";
import { _resetTemplatesStateForTests } from "@/lib/templates/storage";
import { __resetRunsStateForTests } from "@/lib/runs/storage";
import { __resetSuuntoStateForTests } from "@/lib/suunto/storage";

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
  // jsdom *כן* מגדיר scrollTo/scrollBy אך הם זורקים "Not implemented" לקונסולה
  // הווירטואלית בכל ניווט. לכן דריסה ללא תנאי (`if (!window.scrollTo)` לעולם לא
  // היה נכנס לתוקף). זו התאמת סביבה, לא mock שמסתיר התנהגות מוצר — הגלילה עצמה
  // אינה חלק מה-contract שנבדק כאן.
  window.scrollTo = () => {};
  window.scrollBy = () => {};
  Element.prototype.scrollTo = () => {};
  Element.prototype.scrollIntoView = () => {};
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
  _resetCatalogStateForTests();
  _resetExercisesStateForTests();
  _resetTemplatesStateForTests();
  __resetRunsStateForTests();
  __resetSuuntoStateForTests();
}

/**
 * routers/queryClients שנוצרו בבדיקה הנוכחית. פירוק מפורש ב-afterEach מונע
 * subscriptions/timers פתוחים שמעכבים את סיום ה-worker של Vitest.
 */
const activeTeardowns: Array<() => void> = [];

beforeEach(() => {
  resetAllStores();
});

afterEach(() => {
  // סדר חשוב: קודם unmount (מפעיל את ה-cleanup של ה-effects ומנקה intervals),
  // ורק אז פירוק ה-router/queryClient.
  cleanup();
  while (activeTeardowns.length > 0) {
    const teardown = activeTeardowns.pop();
    try {
      teardown?.();
    } catch {
      /* teardown לא אמור להפיל בדיקה */
    }
  }
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
    // preload מייצר ניווטים/loaders ברקע שאינם חלק מהבדיקה ועלולים להישאר
    // תלויים אחרי ה-unmount. בבדיקות אנחנו מנווטים במפורש.
    defaultPreload: false,
  });

  activeTeardowns.push(() => {
    queryClient.cancelQueries();
    queryClient.clear();
    queryClient.unmount();
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
