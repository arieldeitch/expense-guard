import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Plus, Target } from "lucide-react";
import { Tile } from "@/components/tile/Tile";
import type { DomainSummary } from "@/lib/selectors/domain-summary";
import { formatDaysSince } from "@/lib/selectors/domain-summary";
import { cn } from "@/lib/utils";

type Variant = "run" | "gym" | "home";

const VARIANT_ICON_CLASS: Record<Variant, string> = {
  run: "bg-run/25 text-run",
  gym: "bg-gym/25 text-gym",
  home: "bg-home/25 text-home",
};

const VARIANT_PROGRESS_CLASS: Record<Variant, string> = {
  run: "bg-run",
  gym: "bg-gym",
  home: "bg-home",
};

/**
 * DomainSummaryTile — אריח launchpad מרכזי לתחום.
 * מציג:
 * - icon + שם התחום
 * - מדד ראשי אחד
 * - מדד משני אחד (אופציונלי)
 * - תאריך פעילות אחרונה
 * - יעד פעיל יחיד (אם קיים)
 * - CTA ראשי (פתיחת התחום) + CTA משני (דיווח חדש)
 *
 * ללא: היסטוריה, גרפים, כמה יעדים, טקסט מוטיבציה.
 */
export function DomainSummaryTile({
  variant,
  title,
  icon,
  domainPath,
  quickStartPath,
  summary,
  loading,
}: {
  variant: Variant;
  title: string;
  icon: ReactNode;
  domainPath: string;
  quickStartPath: string;
  summary: DomainSummary | undefined;
  loading?: boolean;
}) {
  return (
    <Tile variant={variant} tone="soft" size="lg" className="h-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "inline-flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:size-6",
              VARIANT_ICON_CLASS[variant],
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-black leading-tight">{title}</div>
            <div className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              תחום
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1">
        <MetricRow summary={summary} loading={loading} />
        <LastRow summary={summary} loading={loading} />
      </div>

      <GoalRow variant={variant} summary={summary} domainPath={domainPath} />

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <Link
          to={domainPath}
          className="tile-interactive inline-flex min-h-11 items-center justify-between gap-2 rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold text-foreground"
          aria-label={`פתיחת ${title}`}
        >
          <span className="truncate">פתיחת {title}</span>
          <ChevronLeft aria-hidden className="size-4 rtl:rotate-180" />
        </Link>
        <Link
          to={quickStartPath}
          className={cn(
            "tile-interactive inline-flex size-11 items-center justify-center rounded-xl text-white",
            variant === "run" && "bg-run",
            variant === "gym" && "bg-gym",
            variant === "home" && "bg-home",
          )}
          aria-label={`דיווח חדש · ${title}`}
        >
          <Plus aria-hidden className="size-5" />
        </Link>
      </div>
    </Tile>
  );
}

function MetricRow({
  summary,
  loading,
}: {
  summary: DomainSummary | undefined;
  loading?: boolean;
}) {
  if (loading || !summary) {
    return (
      <div className="flex items-baseline gap-2" aria-busy="true">
        <span className="h-8 w-16 animate-pulse rounded bg-tint" aria-hidden />
      </div>
    );
  }
  if (!summary.hasAnyActivity) {
    return (
      <div className="text-sm text-muted-foreground">
        עדיין אין {emptyLabel(summary.domain)} שנרשמו.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-1.5">
        <span className="ltr-nums text-3xl font-black leading-none tracking-tight">
          {formatNumber(summary.primary.value)}
        </span>
        <span className="text-sm font-medium text-muted-foreground">{summary.primary.unit}</span>
      </div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {summary.primary.label}
      </div>
      {summary.secondary && summary.secondary.value !== null ? (
        <div className="mt-1 text-xs text-muted-foreground">
          <span className="ltr-nums font-bold text-foreground">
            {formatNumber(summary.secondary.value)}
          </span>{" "}
          {summary.secondary.unit ? summary.secondary.unit + " · " : ""}
          {summary.secondary.label}
        </div>
      ) : null}
    </div>
  );
}

function LastRow({
  summary,
  loading,
}: {
  summary: DomainSummary | undefined;
  loading?: boolean;
}) {
  if (loading || !summary) return null;
  if (!summary.hasAnyActivity) return null;
  const label = formatDaysSince(summary.daysSinceLast);
  if (!label) return null;
  return (
    <div className="mt-1 text-xs text-muted-foreground">
      פעילות אחרונה: <span className="font-semibold text-foreground">{label}</span>
    </div>
  );
}

function GoalRow({
  variant,
  summary,
  domainPath,
}: {
  variant: Variant;
  summary: DomainSummary | undefined;
  domainPath: string;
}) {
  if (!summary) return null;
  if (!summary.activeGoal) {
    return (
      <div className="mt-3">
        <Link
          to={domainPath}
          hash="goals"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
        >
          <Target aria-hidden className="size-3.5" />
          הגדרת יעד
        </Link>
      </div>
    );
  }
  const goal = summary.activeGoal;
  return (
    <div className="mt-3 rounded-xl border border-border-strong bg-surface/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            יעד פעיל
          </div>
          <div className="truncate text-sm font-bold">{goal.title}</div>
        </div>
        <div className="ltr-nums shrink-0 text-sm font-black">
          {formatNumber(goal.currentValue)}
          <span className="text-muted-foreground"> / {formatNumber(goal.targetValue)}</span>
          <span className="ms-1 text-xs text-muted-foreground">{goal.targetUnit}</span>
        </div>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-tint"
        role="progressbar"
        aria-valuenow={goal.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`התקדמות ${goal.percent} אחוז`}
      >
        <div
          className={cn("h-full rounded-full", VARIANT_PROGRESS_CLASS[variant])}
          style={{ inlineSize: `${goal.percent}%` }}
        />
      </div>
      {summary.otherActiveGoalsCount > 0 ? (
        <Link
          to={domainPath}
          hash="goals"
          className="mt-2 inline-block text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
        >
          + {summary.otherActiveGoalsCount} יעדים נוספים בתחום
        </Link>
      ) : null}
    </div>
  );
}

function formatNumber(n: number | null): string {
  if (n === null) return "–";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

function emptyLabel(domain: "running" | "gym" | "home"): string {
  if (domain === "running") return "ריצות";
  return "אימונים";
}
