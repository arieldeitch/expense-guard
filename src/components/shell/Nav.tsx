import { Link } from "@tanstack/react-router";
import { Home, Footprints, Dumbbell, HeartPulse, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  activeClass: string;
};

const items: NavItem[] = [
  { to: "/", label: "ראשי", icon: <Home aria-hidden />, activeClass: "text-primary" },
  { to: "/running", label: "ריצה", icon: <Footprints aria-hidden />, activeClass: "text-run" },
  { to: "/gym", label: "חדר כושר", icon: <Dumbbell aria-hidden />, activeClass: "text-gym" },
  { to: "/home", label: "בית", icon: <HeartPulse aria-hidden />, activeClass: "text-home" },
  { to: "/more", label: "עוד", icon: <MoreHorizontal aria-hidden />, activeClass: "text-primary" },
];

/**
 * BottomNav — ניווט תחתון קבוע במובייל.
 * מוסתר ב־lg ומעלה כאשר ה־Sidebar תופס את התפקיד.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="ניווט ראשי"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border-strong bg-surface/95 backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {items.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold text-muted-foreground transition-colors data-[status=active]:text-foreground"
              activeProps={{
                className: cn(
                  "text-foreground [&_svg]:scale-110 [&_svg]:drop-shadow-[0_0_8px_currentColor]",
                  item.activeClass,
                ),
              }}
            >
              <span className="[&_svg]:size-6 [&_svg]:transition-transform">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * SideNav — ניווט צד ל־desktop / tablet רחב.
 * לא נטען במובייל.
 */
export function SideNav() {
  return (
    <aside
      aria-label="ניווט ראשי"
      className="fixed inset-y-0 end-0 z-30 hidden w-64 border-s border-border-strong bg-surface/60 backdrop-blur-xl lg:block"
    >
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="px-3 py-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            אימונים אישיים
          </div>
          <div className="mt-1 text-xl font-black">Fit Log</div>
        </div>
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-tint hover:text-foreground"
                activeProps={{
                  className: cn(
                    "bg-tint text-foreground border border-border-strong",
                    item.activeClass,
                  ),
                }}
              >
                <span className="[&_svg]:size-5">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
