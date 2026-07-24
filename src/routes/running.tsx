import { createFileRoute, Link } from "@tanstack/react-router";
import { Footprints, Plus, Sparkles, Target } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileLabel, TileMetric, TileFootnote } from "@/components/tile/Tile";
import { useDomainSummary } from "@/lib/hooks/use-domain-summary";
import { formatDaysSince } from "@/lib/selectors/domain-summary";

export const Route = createFileRoute("/running")({
  head: () => ({
    meta: [
      { title: "ריצה · Fit Log" },
      { name: "description", content: "סשני ריצה, מסלולים, קריאות Suunto ומקטעים." },
      { property: "og:title", content: "ריצה · Fit Log" },
      { property: "og:description", content: "סשני ריצה, מסלולים, קריאות Suunto ומקטעים." },
    ],
  }),
  component: RunningPage,
});

function RunningPage() {
  const { data: summary, isPending } = useDomainSummary("running");
  const hasActivity = summary?.hasAnyActivity ?? false;

  return (
    <AppShell
      topBar={{
        title: "ריצה",
        back: { to: "/", label: "חזרה למסך הראשי" },
        action: (
          <Link
            to="/running/new"
            aria-label="דיווח ריצה חדש"
            className="tile-interactive inline-flex size-9 items-center justify-center rounded-xl bg-run text-white"
          >
            <Plus aria-hidden className="size-5" />
          </Link>
        ),
      }}
    >
      <PageHeader
        eyebrow="תחום"
        title="ריצה"
        description="מסלולים, סשנים ומקטעים. Raw מ־Suunto נשמר בנפרד."
      />

      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>{summary?.primary.label ?? "מרחק החודש"}</TileLabel>
          <TileMetric
            value={isPending ? "–" : (summary?.primary.value ?? "–")}
            unit={summary?.primary.unit}
          />
          <TileFootnote>
            {hasActivity ? "החודש הנוכחי" : "ללא נתונים"}
          </TileFootnote>
        </Tile>
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>ריצות החודש</TileLabel>
          <TileMetric value={hasActivity ? (summary?.secondary?.value ?? 0) : "0"} />
          <TileFootnote>{hasActivity ? "" : "ללא נתונים"}</TileFootnote>
        </Tile>
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>פעילות אחרונה</TileLabel>
          <TileMetric value={hasActivity ? (formatDaysSince(summary!.daysSinceLast) ?? "–") : "–"} />
          <TileFootnote>{hasActivity ? "" : "טרם דווח"}</TileFootnote>
        </Tile>
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>יעד פעיל</TileLabel>
          <TileMetric value={summary?.activeGoal ? `${summary.activeGoal.percent}%` : "–"} />
          <TileFootnote>
            {summary?.activeGoal ? summary.activeGoal.title : "אין יעד פעיל"}
          </TileFootnote>
        </Tile>
      </div>

      <SectionHeader title="ריצות אחרונות" />
      <div className="px-4 sm:px-6">
        {hasActivity ? (
          <Tile>
            <TileFootnote>
              רשומות פרטניות ייטענו כשמודול ההיסטוריה יופעל. עד אז — סיכומים בלבד.
            </TileFootnote>
          </Tile>
        ) : (
          <EmptyState
            icon={<Footprints aria-hidden />}
            title="עדיין אין ריצות שמורות"
            description="דיווח ראשון יופיע כאן. Suunto import ייצור סשן אוטומטית."
            action={
              <Link
                to="/running/new"
                className="tile-interactive inline-flex min-h-11 items-center gap-2 rounded-xl bg-run px-4 text-sm font-bold text-white"
              >
                <Plus aria-hidden className="size-4" />
                הוספת ריצה
              </Link>
            }
          />
        )}
      </div>

      <SectionHeader title="יעדי ריצה" />
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
            description="יעדים מוגדרים על ידך בלבד. המערכת לא ממציאה יעדים."
          />
        )}
      </div>

      <SectionHeader title="הערות" />
      <div className="px-4 sm:px-6">
        <Tile>
          <TileFootnote>
            <Sparkles aria-hidden className="me-1 inline size-4 text-muted-foreground" />
            נתונים ריקים = אין ריצות. אין ערכי דמו במסך זה.
          </TileFootnote>
        </Tile>
      </div>
    </AppShell>
  );
}
