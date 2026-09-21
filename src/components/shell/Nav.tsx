import { Link } from "@tanstack/react-router";
import { Home, PlusCircle, History, CalendarRange, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeNavTarget } from "@/lib/nav";
import type { ReactNode } from "react";

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  activeClass: string;
};

/**
 * חמישה יעדים (ADR-0042): ראשי · דיווח · היסטוריה · תוכניות · עוד.
 * דיווח והיסטוריה הם יעדים ראשיים — לחיצה אחת מכל מסך. התחומים (ריצה/מכון/בית)
 * נגישים מהראשי ומ"דיווח" ונחשבים חלק מ"ראשי" לצורך מצב פעיל.
 */
const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "ראשי", icon: <Home aria-hidden />, activeClass: "text-primary" },
  { to: "/report", label: "דיווח", icon: <PlusCircle aria-hidden />, activeClass: "text-primary" },
  { to: "/history", label: "היסטוריה", icon: <History aria-hidden />, activeClass: "text-primary" },
  { to: "/plans", label: "תוכניות", icon: <CalendarRange aria-hidden />, activeClass: "text-goal" },
  { to: "/more", label: "עוד", icon: <MoreHorizontal aria-hidden />, activeClass: "text-primary" },
];

function isActive(pathname: string, item: NavItem) {
  return activeNavTarget(pathname) === item.to;
}

/**
 * BottomNav — ניווט תחתון קבוע במובייל.
 * מוסתר ב־lg ומעלה כאשר ה־Sidebar תופס את התפקיד.
 */
export function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="ניווט ראשי"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border-strong bg-surface/95 backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors",
                  active && cn("text-foreground", item.activeClass),
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-7 w-12 items-center justify-center rounded-full transition-colors [&_svg]:size-5",
                    active && "bg-tint",
                  )}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * SideNav — ניווט צד ל־desktop / tablet רחב.
 * לא נטען במובייל.
 */
export function SideNav({ pathname }: { pathname: string }) {
  return (
    <aside
      aria-label="ניווט ראשי"
      className="fixed inset-y-0 end-0 z-30 hidden w-60 border-s border-border-strong bg-surface/60 backdrop-blur-xl lg:block"
    >
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="px-3 py-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            אימונים אישיים
          </div>
          <div className="mt-0.5 text-lg font-black">Fit Log</div>
        </div>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-tint hover:text-foreground",
                    active &&
                      cn("border border-border-strong bg-tint text-foreground", item.activeClass),
                  )}
                >
                  <span className="[&_svg]:size-5">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
