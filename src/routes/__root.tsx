import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { GlobalStorageBanner } from "../components/storage/GlobalStorageBanner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <p className="ltr-nums text-7xl font-black text-foreground">404</p>
        <h1 className="mt-4 text-xl font-bold text-foreground">העמוד לא נמצא</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ייתכן שהעמוד הוסר או שהכתובת שגויה.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="tile-interactive inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            חזרה למסך הראשי
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4"
      dir="rtl"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          לא ניתן לטעון את הנתונים
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          אירעה שגיאה בטעינת העמוד. אפשר לנסות שוב או לחזור למסך הראשי.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="tile-interactive inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            ניסיון נוסף
          </button>
          <a
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-tint"
          >
            חזרה למסך הראשי
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { name: "theme-color", content: "#1a1d2b" },
      { title: "Fit Log · אימונים אישיים" },
      {
        name: "description",
        content: "אפליקציית אימונים אישית: ריצה, חדר כושר וכוח בבית. מבוססת נתונים ולא עידוד ריק.",
      },
      { property: "og:title", content: "Fit Log · אימונים אישיים" },
      {
        property: "og:description",
        content: "אפליקציית אימונים אישית: ריצה, חדר כושר וכוח בבית.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/*
        התראת אחסון גלובלית — מעל כל מסך, לא רק מסך האימון. אינה מרנדרת דבר
        כשכל הכתיבות הצליחו.
      */}
      <GlobalStorageBanner />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
