import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { BottomNav, SideNav } from "./Nav";
import { cn } from "@/lib/utils";

/**
 * TopBar — top bar מינימלי. מציג back / title / context action.
 * ב־route ראשי (home) מסתירים back.
 */
export function TopBar({
  title,
  back,
  action,
  className,
}: {
  title?: ReactNode;
  back?: { to: string; label?: string } | boolean;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "safe-top sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto grid h-12 max-w-3xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 sm:px-4">
        <div className="min-w-9">
          {back ? (
            <Link
              to={typeof back === "object" ? back.to : "/"}
              aria-label={typeof back === "object" ? (back.label ?? "חזרה") : "חזרה"}
              className="inline-flex min-h-11 items-center justify-center gap-1 px-2 rounded-xl text-muted-foreground transition-colors hover:bg-tint hover:text-foreground"
            >
              {/* Chevron מתהפך אוטומטית ב־RTL דרך logical direction */}
              <ChevronRight aria-hidden className="size-5" />
              <span className="text-sm">חזרה</span>
            </Link>
          ) : null}
        </div>
        <div className="min-w-0 text-center">
          {title ? <div className="truncate text-sm font-bold text-foreground">{title}</div> : null}
        </div>
        <div className="min-w-9 text-end">{action}</div>
      </div>
    </div>
  );
}

/**
 * AppShell — מעטפת אפליקציה אחידה: TopBar אופציונלי + main + BottomNav (mobile) + SideNav (desktop).
 * כל route משתמש בזה — לא בונים layout ידני פר-עמוד.
 */
export function AppShell({
  children,
  topBar,
}: {
  children: ReactNode;
  topBar?: {
    title?: ReactNode;
    back?: { to: string; label?: string } | boolean;
    action?: ReactNode;
  };
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-dvh lg:pe-60">
      <SideNav pathname={pathname} />
      {topBar ? <TopBar {...topBar} /> : null}
      <main
        role="main"
        className={cn(
          "mx-auto w-full max-w-3xl pb-24 pt-3 sm:pt-4 lg:pb-8",
          // Without a TopBar the content itself must clear the status bar (edge-to-edge on Android).
          !topBar && "safe-top",
        )}
      >
        {children}
      </main>
      <BottomNav pathname={pathname} />
    </div>
  );
}
