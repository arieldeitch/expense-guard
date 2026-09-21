/**
 * /plans — "תוכניות": פרויקט חצאי המרתון, יעדים ותבניות במקום אחד (ADR-0042).
 * Snapshot קצר לכל תוכנית; הפרטים במסכים הקיימים.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, CalendarRange, Target, Layers } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { SectionHeader } from "@/components/shell/PageHeader";
import { useRaceProject } from "@/lib/race-project/repo";
import { DAYS, KIND_LABELS, dayKey, formatDayMonth, weekStart } from "@/lib/race-project/model";
import { useActiveRuns } from "@/lib/runs";
import { useAllGoals } from "@/lib/goals";
import { useHomeTemplates } from "@/lib/home";
import { useAllTemplates } from "@/lib/templates";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const Route = createFileRoute("/plans")({
  component: PlansPage,
  head: () => ({ meta: [{ title: "תוכניות · Fit Log" }] }),
});

function Row({
  to,
  icon,
  tint,
  title,
  sub,
}: {
  to: string;
  icon: ReactNode;
  tint: string;
  title: string;
  sub: string;
}) {
  return (
    <Link to={to} className="list-row">
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg [&_svg]:size-4",
          tint,
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
      <span />
      <ChevronLeft aria-hidden className="size-4 text-muted-foreground" />
    </Link>
  );
}

function PlansPage() {
  const { settings, races, weeks } = useRaceProject();
  const runs = useActiveRuns();
  const goals = useAllGoals().filter((g) => g.status === "active" || g.status === "draft");
  const homeTemplates = useHomeTemplates().filter((t) => !t.deleted_at && t.status !== "trashed");
  const gymTemplates = useAllTemplates().filter((t) => !t.deleted_at);

  const today = dayKey();
  const week = weeks.find((w) => w.id === weekStart(today));
  const todayPlan = week?.days.find((d) => d.date === today);
  const completedRaces = races.filter(
    (r) => !r.deleted_at && (r.status === "completed" || runs.some((run) => run.race_id === r.id)),
  ).length;
  const nextRace = races
    .filter((r) => !r.deleted_at && r.status === "planned")
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"))[0];
  const todayLabel = todayPlan
    ? `היום (${DAYS[new Date(`${today}T12:00:00Z`).getUTCDay()]} ${formatDayMonth(today)}): ${KIND_LABELS[todayPlan.chosen.kind]}${todayPlan.chosen.minutes ? ` · ${todayPlan.chosen.minutes} דק׳` : ""}`
    : "עוד לא נפתחה תוכנית לשבוע הזה";

  return (
    <AppShell topBar={{ title: "תוכניות" }}>
      <SectionHeader title="ריצה" />
      <div className="px-4 sm:px-6">
        <Row
          to="/running/project"
          icon={<CalendarRange aria-hidden />}
          tint="bg-run/20 text-run"
          title={`חצאי המרתון ${settings.year} · ${completedRaces} מתוך ${settings.target_min}–${settings.target_max}`}
          sub={`${todayLabel}${nextRace ? ` · הבא: ${nextRace.name}${nextRace.date ? ` ${formatDayMonth(nextRace.date)}` : ""}` : ""}`}
        />
      </div>

      <SectionHeader title="יעדים" />
      <div className="space-y-1.5 px-4 sm:px-6">
        {goals.length === 0 ? (
          <Row
            to="/goals/new"
            icon={<Target aria-hidden />}
            tint="bg-goal/20 text-goal"
            title="הגדרת יעד"
            sub="יעד אחד לכל תחום — השוואה לעצמך בלבד"
          />
        ) : (
          goals.map((g) => (
            <Row
              key={g.id}
              to={`/goals/${g.id}`}
              icon={<Target aria-hidden />}
              tint="bg-goal/20 text-goal"
              title={g.name}
              sub={g.status === "draft" ? "טיוטה" : "פעיל"}
            />
          ))
        )}
      </div>

      <SectionHeader title="תבניות" />
      <div className="space-y-1.5 px-4 sm:px-6">
        <Row
          to="/home/templates"
          icon={<Layers aria-hidden />}
          tint="bg-home/20 text-home"
          title="תבניות פק״ל בבית"
          sub={homeTemplates.length ? `${homeTemplates.length} תבניות` : "אין תבניות עדיין"}
        />
        <Row
          to="/templates"
          icon={<Layers aria-hidden />}
          tint="bg-gym/20 text-gym"
          title="תבניות מכון"
          sub={gymTemplates.length ? `${gymTemplates.length} תבניות` : "אין תבניות עדיין"}
        />
      </div>
    </AppShell>
  );
}
