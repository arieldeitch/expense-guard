/**
 * /history — מרכז ההיסטוריה (ADR-0042).
 * ברירת מחדל: רשימה כרונולוגית קומפקטית של כל האימונים, מקובצת לפי שבוע עם סיכום קצר.
 * שורה = יום ותאריך · סוג · מדד ראשי · מצב · chevron. לחיצה פותחת את מסך הפרטים הקיים.
 * פילטרים: סוג אימון (chips), חיפוש, חודש (קודם/הבא) ואיפוס. ללא גרפים.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Footprints,
  Dumbbell,
  HeartPulse,
  Search,
  X,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Input } from "@/components/ui/input";
import { useAllRuns } from "@/lib/runs";
import { useAllSessions } from "@/lib/sessions";
import { useHomeSessions } from "@/lib/home";
import {
  buildHistoryItems,
  currentMonth,
  DOMAIN_LABELS,
  filterHistory,
  formatDayLabel,
  formatMonthLabel,
  groupByWeek,
  historyHref,
  shiftMonth,
  STATUS_LABELS,
  type HistoryDomain,
  type HistoryItem,
} from "@/lib/history/items";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  component: History,
  validateSearch: (search: Record<string, unknown>): { type?: HistoryDomain } => ({
    type:
      search.type === "run" || search.type === "home" || search.type === "gym"
        ? search.type
        : undefined,
  }),
  head: () => ({ meta: [{ title: "היסטוריה · Fit Log" }] }),
});

const DOMAIN_ICON: Record<HistoryDomain, React.ReactNode> = {
  run: <Footprints aria-hidden />,
  home: <HeartPulse aria-hidden />,
  gym: <Dumbbell aria-hidden />,
};
const DOMAIN_TINT: Record<HistoryDomain, string> = {
  run: "bg-run/20 text-run",
  home: "bg-home/20 text-home",
  gym: "bg-gym/20 text-gym",
};

function History() {
  const { type } = Route.useSearch();
  const runs = useAllRuns();
  const gym = useAllSessions();
  const home = useHomeSessions();
  const [domain, setDomain] = useState<HistoryDomain | "all">(type ?? "all");
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState<string | null>(null);

  const all = useMemo(() => buildHistoryItems({ runs, home, gym }), [runs, home, gym]);
  const items = useMemo(
    () => filterHistory(all, { domain, query, month }),
    [all, domain, query, month],
  );
  const groups = useMemo(() => groupByWeek(items), [items]);
  const filtered = domain !== "all" || query.trim() !== "" || month !== null;
  const reset = () => {
    setDomain("all");
    setQuery("");
    setMonth(null);
  };

  return (
    <AppShell topBar={{ title: "היסטוריה" }}>
      <div className="space-y-2 px-4 sm:px-6">
        {/* Type chips — one tap, no separate screen */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="סוג אימון">
          {(["all", "run", "home", "gym"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={domain === value}
              onClick={() => setDomain(value)}
              className={cn(
                "min-h-10 rounded-full border px-3.5 text-sm font-semibold transition-colors",
                domain === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border-strong bg-surface text-muted-foreground",
              )}
            >
              {value === "all" ? "הכול" : DOMAIN_LABELS[value]}
            </button>
          ))}
        </div>

        {/* Search + month stepper */}
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש: תרגיל, הערה, מקום…"
            aria-label="חיפוש בהיסטוריה"
            className="pe-9"
          />
        </div>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1">
          <button
            type="button"
            aria-label="חודש קודם"
            onClick={() => setMonth(shiftMonth(month ?? currentMonth(), -1))}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border-strong bg-surface"
          >
            <ChevronRight aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => (month ? setMonth(null) : setMonth(currentMonth()))}
            className="min-h-11 rounded-lg border border-border-strong bg-surface px-2 text-sm font-semibold"
            aria-label={month ? "הצג את כל התקופה" : "הצג את החודש הנוכחי"}
          >
            {month ? formatMonthLabel(month) : "כל התקופה"}
          </button>
          <button
            type="button"
            aria-label="חודש הבא"
            onClick={() => setMonth(shiftMonth(month ?? currentMonth(), 1))}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border-strong bg-surface"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
        </div>

        <p className="flex items-center justify-between text-xs text-muted-foreground">
          <span data-testid="history-count">
            {items.length} אימונים{month ? ` · ${formatMonthLabel(month)}` : ""}
          </span>
          {filtered ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-9 items-center gap-1 font-semibold text-foreground underline underline-offset-2"
            >
              <X aria-hidden className="size-3.5" />
              איפוס
            </button>
          ) : null}
        </p>

        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong p-5 text-center">
            <p className="text-sm font-bold">
              {all.length === 0 ? "עדיין אין אימונים" : "אין אימונים שמתאימים לסינון"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {all.length === 0
                ? "הדיווח הראשון יופיע כאן מיד אחרי השמירה."
                : "נסה חודש אחר או אפס את הסינון."}
            </p>
            <div className="mt-3 flex justify-center gap-2">
              {all.length === 0 ? (
                <Link
                  to="/report"
                  className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
                >
                  דיווח ראשון
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex min-h-11 items-center rounded-lg border border-border-strong px-4 text-sm font-bold"
                >
                  איפוס סינון
                </button>
              )}
            </div>
          </div>
        ) : null}

        {groups.map((g) => (
          <section key={g.weekStart} aria-label={g.label}>
            <header className="flex items-baseline justify-between gap-2 px-1 pb-1 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {g.label}
              </h2>
              <span className="text-xs text-muted-foreground">{g.summary}</span>
            </header>
            <ul className="space-y-1.5">
              {g.items.map((item) => (
                <li key={item.key}>
                  <HistoryRow item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AppShell>
  );
}

function HistoryRow({ item }: { item: HistoryItem }) {
  return (
    <Link
      to={historyHref(item)}
      className="list-row"
      aria-label={`${item.title} · ${formatDayLabel(item.day)} · ${item.metric}`}
    >
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg [&_svg]:size-4",
          DOMAIN_TINT[item.domain],
        )}
      >
        {DOMAIN_ICON[item.domain]}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold">{item.title}</span>
          {item.status !== "completed" ? (
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                item.status === "draft"
                  ? "bg-warning-soft/60 text-warning"
                  : "bg-info-soft/60 text-info",
              )}
            >
              {STATUS_LABELS[item.status]}
            </span>
          ) : null}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {item.metric}
          {item.sub ? ` · ${item.sub}` : ""}
        </span>
      </span>
      <span className="ltr-nums text-end text-xs font-semibold text-muted-foreground">
        {formatDayLabel(item.day)}
      </span>
      <ChevronLeft aria-hidden className="size-4 text-muted-foreground" />
    </Link>
  );
}
