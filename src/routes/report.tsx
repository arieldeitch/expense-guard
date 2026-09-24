/**
 * /report — "דיווח": יעד ראשי בניווט (ADR-0042). לחיצה אחת מכל מסך.
 * מציג טיוטות פתוחות להמשך, ואז ארבע דרכי דיווח + ביצוע מהתוכנית השבועית.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Dumbbell,
  Footprints,
  HeartPulse,
  CalendarRange,
  Moon,
  Mountain,
  Sun,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { SectionHeader } from "@/components/shell/PageHeader";
import { useAllRuns, formatDurationHMS } from "@/lib/runs";
import { useActiveHomeDrafts } from "@/lib/home";
import { useAllSessions } from "@/lib/sessions";
import { formatDayLabel } from "@/lib/history/items";
import { dayKey } from "@/lib/race-project/model";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const Route = createFileRoute("/report")({
  component: ReportPage,
  head: () => ({ meta: [{ title: "דיווח · Fit Log" }] }),
});

const OPTIONS: {
  to: string;
  title: string;
  hint: string;
  icon: ReactNode;
  tint: string;
}[] = [
  {
    to: "/home/pakal/morning",
    title: "פק״לים בוקר",
    hint: "כמויות בלבד — הרשימה הקבועה שלך",
    icon: <Sun aria-hidden />,
    tint: "bg-home/20 text-home",
  },
  {
    to: "/home/pakal/evening",
    title: "פק״לים ערב",
    hint: "כמויות בלבד — הרשימה הקבועה שלך",
    icon: <Moon aria-hidden />,
    tint: "bg-home/20 text-home",
  },
  {
    to: "/running/new/treadmill",
    title: "ריצה על הליכון",
    hint: "דקות ושניות, מרחק, מהירות, שיפוע",
    icon: <Footprints aria-hidden />,
    tint: "bg-run/20 text-run",
  },
  {
    to: "/running/new/outdoor",
    title: "ריצה בחוץ",
    hint: "מסלול, מרחק, קצב, עליות",
    icon: <Mountain aria-hidden />,
    tint: "bg-run/20 text-run",
  },
  {
    to: "/home/quick",
    title: "תרגיל יחיד",
    hint: "דיווח מהיר של תרגיל אחד עם סטים גמישים",
    icon: <HeartPulse aria-hidden />,
    tint: "bg-home/20 text-home",
  },
  {
    to: "/gym/new",
    title: "אימון מכון",
    hint: "תבנית או אימון חופשי עם טיימר",
    icon: <Dumbbell aria-hidden />,
    tint: "bg-gym/20 text-gym",
  },
  {
    to: "/running/project",
    title: "ביצוע מהתוכנית השבועית",
    hint: "חצאי המרתון · הריצה של היום מקושרת לתוכנית",
    icon: <CalendarRange aria-hidden />,
    tint: "bg-goal/20 text-goal",
  },
];

function ReportPage() {
  const runDrafts = useAllRuns().filter((r) => r.status === "draft" && !r.deleted_at);
  const homeDrafts = useActiveHomeDrafts();
  const gymDrafts = useAllSessions().filter(
    (s) =>
      !s.deleted_at &&
      (s.status === "draft" || s.status === "in_progress" || s.status === "paused"),
  );
  const drafts = [
    ...runDrafts.map((r) => ({
      key: `run-${r.id}`,
      to: `/running/${r.id}/edit`,
      title: r.run_type === "treadmill" ? "ריצה על הליכון" : "ריצה בחוץ",
      sub: [
        formatDayLabel(dayKey(r.started_at)),
        r.duration_seconds ? formatDurationHMS(r.duration_seconds) : null,
      ]
        .filter(Boolean)
        .join(" · "),
      tint: "bg-run/20 text-run",
      icon: <Footprints aria-hidden />,
      at: r.started_at,
    })),
    ...homeDrafts.map((s) => ({
      key: `home-${s.id}`,
      to: `/home/sessions/${s.id}`,
      title: s.name,
      sub: formatDayLabel(dayKey(s.started_at)),
      tint: "bg-home/20 text-home",
      icon: <HeartPulse aria-hidden />,
      at: s.started_at,
    })),
    ...gymDrafts.map((s) => ({
      key: `gym-${s.id}`,
      to: `/sessions/${s.id}`,
      title: s.name,
      sub: formatDayLabel(dayKey(s.started_at)),
      tint: "bg-gym/20 text-gym",
      icon: <Dumbbell aria-hidden />,
      at: s.started_at,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <AppShell topBar={{ title: "דיווח" }}>
      {drafts.length > 0 ? (
        <>
          <SectionHeader title={`להמשיך טיוטה · ${drafts.length}`} />
          <ul className="space-y-1.5 px-4 sm:px-6">
            {drafts.slice(0, 5).map((d) => (
              <li key={d.key}>
                <Link to={d.to} className="list-row">
                  <span
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-lg [&_svg]:size-4",
                      d.tint,
                    )}
                  >
                    {d.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{d.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      טיוטה · {d.sub}
                    </span>
                  </span>
                  <span />
                  <ChevronLeft aria-hidden className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <SectionHeader title="דיווח חדש" />
      <ul className="space-y-1.5 px-4 sm:px-6">
        {OPTIONS.map((o) => (
          <li key={o.to}>
            <Link to={o.to} className="list-row min-h-16">
              <span
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-lg [&_svg]:size-5",
                  o.tint,
                )}
              >
                {o.icon}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-bold">{o.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{o.hint}</span>
              </span>
              <span />
              <ChevronLeft aria-hidden className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="px-4 pt-3 text-xs text-muted-foreground sm:px-6">
        כל דיווח נשמר במכשיר תוך כדי הקלדה. אפשר לדווח גם על תאריך קודם — שדה התאריך נמצא בראש
        הטופס.
      </p>
    </AppShell>
  );
}
