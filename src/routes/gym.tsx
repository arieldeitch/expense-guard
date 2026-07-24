import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, Play, Plus, Target } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileLabel, TileMetric, TileFootnote } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import { useDomainSummary } from "@/lib/hooks/use-domain-summary";
import { formatDaysSince } from "@/lib/selectors/domain-summary";
import { useAllTemplates } from "@/lib/templates";
import { useActiveSession } from "@/lib/sessions";


export const Route = createFileRoute("/gym")({
  head: () => ({
    meta: [
      { title: "חדר כושר · Fit Log" },
      { name: "description", content: "אימוני כוח בחדר כושר — תבניות, סטים, שיאים." },
      { property: "og:title", content: "חדר כושר · Fit Log" },
      { property: "og:description", content: "אימוני כוח בחדר כושר — תבניות, סטים, שיאים." },
    ],
  }),
  component: GymPage,
});

function GymPage() {
  const { data: summary, isPending } = useDomainSummary("gym");
  const templates = useAllTemplates();
  const activeSession = useActiveSession();
  const hasActivity = summary?.hasAnyActivity ?? false;


  return (
    <AppShell
      topBar={{
        title: "חדר כושר",
        back: { to: "/", label: "חזרה למסך הראשי" },
        action: (
          <Link
            to="/gym/new"
            aria-label="אימון חדר כושר חדש"
            className="tile-interactive inline-flex size-9 items-center justify-center rounded-xl bg-gym text-white"
          >
            <Plus aria-hidden className="size-5" />
          </Link>
        ),
      }}
    >
      <PageHeader
        eyebrow="תחום"
        title="חדר כושר"
        description="תבניות אימון, סטים, סופרסטים. שיאים מחושבים מהדיווח."
      />

      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Tile variant="gym" tone="soft" size="sm">
          <TileLabel>{summary?.primary.label ?? "אימונים החודש"}</TileLabel>
          <TileMetric value={isPending ? "–" : (summary?.primary.value ?? "–")} />
          <TileFootnote>{hasActivity ? "" : "ללא נתונים"}</TileFootnote>
        </Tile>
        <Tile variant="gym" tone="soft" size="sm">
          <TileLabel>פעילות אחרונה</TileLabel>
          <TileMetric
            value={hasActivity ? (formatDaysSince(summary!.daysSinceLast) ?? "–") : "–"}
          />
          <TileFootnote>{hasActivity ? "" : "טרם דווח"}</TileFootnote>
        </Tile>
        <Tile variant="gym" tone="soft" size="sm">
          <TileLabel>יעד פעיל</TileLabel>
          <TileMetric value={summary?.activeGoal ? `${summary.activeGoal.percent}%` : "–"} />
          <TileFootnote>
            {summary?.activeGoal ? summary.activeGoal.title : "אין יעד פעיל"}
          </TileFootnote>
        </Tile>
        <Link
          to="/templates"
          className="tile-interactive block rounded-2xl border border-border-strong bg-surface p-3 text-start"
        >
          <Tile
            variant="gym"
            tone="soft"
            size="sm"
            className="border-0 bg-transparent p-0 shadow-none"
          >
            <TileLabel>תבניות</TileLabel>
            <TileMetric value={String(templates.length)} />
            <TileFootnote>לפתיחה ← ניהול תבניות</TileFootnote>
          </Tile>
        </Link>
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
            icon={<Dumbbell aria-hidden />}
            title="עדיין אין אימוני חדר כושר"
            description="דיווח ראשון יופיע כאן. אפשר להתחיל מתבנית או מאימון ריק."
            action={
              <Link
                to="/gym/new"
                className="tile-interactive inline-flex min-h-11 items-center gap-2 rounded-xl bg-gym px-4 text-sm font-bold text-white"
              >
                <Plus aria-hidden className="size-4" />
                הוספת אימון
              </Link>
            }
          />
        )}
      </div>

      <SectionHeader title="יעדי כוח" />
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
