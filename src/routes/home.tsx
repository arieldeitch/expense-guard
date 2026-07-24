import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartPulse, Plus, Target } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileLabel, TileMetric, TileFootnote } from "@/components/tile/Tile";
import { useDomainSummary } from "@/lib/hooks/use-domain-summary";
import { formatDaysSince } from "@/lib/selectors/domain-summary";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "כוח בבית · Fit Log" },
      { name: "description", content: "אימוני משקל גוף וציוד ביתי." },
      { property: "og:title", content: "כוח בבית · Fit Log" },
      { property: "og:description", content: "אימוני משקל גוף וציוד ביתי." },
    ],
  }),
  component: HomeDomainPage,
});

function HomeDomainPage() {
  const { data: summary, isPending } = useDomainSummary("home");
  const hasActivity = summary?.hasAnyActivity ?? false;

  return (
    <AppShell
      topBar={{
        title: "בית",
        back: { to: "/", label: "חזרה למסך הראשי" },
        action: (
          <Link
            to="/home/new"
            aria-label="אימון ביתי חדש"
            className="tile-interactive inline-flex size-9 items-center justify-center rounded-xl bg-home text-white"
          >
            <Plus aria-hidden className="size-5" />
          </Link>
        ),
      }}
    >
      <PageHeader
        eyebrow="תחום"
        title="כוח בבית"
        description="משקל גוף, ציוד מינימלי. שיאי חזרות מחושבים מהדיווח."
      />

      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>{summary?.primary.label ?? "אימונים החודש"}</TileLabel>
          <TileMetric value={isPending ? "–" : (summary?.primary.value ?? "–")} />
          <TileFootnote>{hasActivity ? "" : "ללא נתונים"}</TileFootnote>
        </Tile>
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>פעילות אחרונה</TileLabel>
          <TileMetric value={hasActivity ? (formatDaysSince(summary!.daysSinceLast) ?? "–") : "–"} />
          <TileFootnote>{hasActivity ? "" : "טרם דווח"}</TileFootnote>
        </Tile>
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>יעד פעיל</TileLabel>
          <TileMetric value={summary?.activeGoal ? `${summary.activeGoal.percent}%` : "–"} />
          <TileFootnote>
            {summary?.activeGoal ? summary.activeGoal.title : "אין יעד פעיל"}
          </TileFootnote>
        </Tile>
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>תבניות ביתיות</TileLabel>
          <TileMetric value="–" />
          <TileFootnote>מודול בקרוב</TileFootnote>
        </Tile>
      </div>

      <SectionHeader title="אימונים אחרונים" />
      <div className="px-4 sm:px-6">
        {hasActivity ? (
          <Tile>
            <TileFootnote>
              רשומות פרטניות ייטענו כשמודול ההיסטוריה יופעל. עד אז — סיכומים בלבד.
            </TileFootnote>
          </Tile>
        ) : (
          <EmptyState
            icon={<HeartPulse aria-hidden />}
            title="עדיין אין אימוני בית"
            description="דיווח ראשון יופיע כאן."
            action={
              <Link
                to="/home/new"
                className="tile-interactive inline-flex min-h-11 items-center gap-2 rounded-xl bg-home px-4 text-sm font-bold text-white"
              >
                <Plus aria-hidden className="size-4" />
                הוספת אימון
              </Link>
            }
          />
        )}
      </div>

      <SectionHeader title="יעדים ביתיים" />
      <div id="goals" className="px-4 sm:px-6">
        {summary?.activeGoal ? (
          <Tile variant="goal" tone="soft">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <TileLabel>יעד פעיל</TileLabel>
                <div className="truncate text-base font-bold">{summary.activeGoal.title}</div>
              </div>
              <div className="ltr-nums text-lg font-black">{summary.activeGoal.percent}%</div>
            </div>
          </Tile>
        ) : (
          <EmptyState
            icon={<Target aria-hidden />}
            title="אין יעדים פעילים"
            description="יעדים מוגדרים על ידך בלבד."
          />
        )}
      </div>
    </AppShell>
  );
}
