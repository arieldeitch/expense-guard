import { createFileRoute, Link } from "@tanstack/react-router";
import { Footprints, Plus, Timer, History, MapPin, FileEdit } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileFootnote, TileLabel, TileMetric } from "@/components/tile/Tile";
import { RunTile } from "@/components/runs/RunTile";
import { DomainPrimaryGoalTile } from "@/components/goals/DomainPrimaryGoalTile";
import {
  computeRunAggregates,
  formatDistanceKm,
  formatDurationHMS,
  formatPace,
  useActiveRuns,
  useDrafts,
} from "@/lib/runs";
import { useAllLocations } from "@/lib/catalog";

export const Route = createFileRoute("/running")({
  head: () => ({
    meta: [
      { title: "ריצה · Fit Log" },
      {
        name: "description",
        content: "אזור הריצה: יצירת ריצה, סיכום תקופה, ריצה אחרונה והיסטוריה.",
      },
      { property: "og:title", content: "ריצה · Fit Log" },
      { property: "og:description", content: "אזור הריצה: יצירת ריצה, סיכום תקופה, היסטוריה." },
    ],
  }),
  component: RunningPage,
});

function RunningPage() {
  const runs = useActiveRuns();
  const drafts = useDrafts();
  const locations = useAllLocations();
  const agg = computeRunAggregates(runs, "month");
  const last =
    runs.length > 0 ? [...runs].sort((a, b) => (a.started_at < b.started_at ? 1 : -1))[0] : null;
  const locationName = (id: string | null) =>
    id ? (locations.find((l) => l.id === id)?.name ?? null) : null;

  return (
    <AppShell topBar={{ title: "ריצה", back: { to: "/", label: "חזרה למסך הראשי" } }}>
      <PageHeader
        eyebrow="תחום"
        title="ריצה"
        description="דיווח מהיר, מדדים עובדתיים, היסטוריה שקופה."
      />

      <div className="px-4 sm:px-6">
        <Link to="/running/new" className="block">
          <Tile variant="run" tone="solid" size="lg" interactive>
            <div className="flex items-center justify-between gap-3">
              <div>
                <TileLabel>הוספה</TileLabel>
                <div className="text-xl font-black">ריצה חדשה</div>
                <TileFootnote>בחירה בין הליכון לחוץ</TileFootnote>
              </div>
              <Plus className="size-8" aria-hidden />
            </div>
          </Tile>
        </Link>
      </div>

      {drafts.length > 0 ? (
        <>
          <SectionHeader title="טיוטות" />
          <div className="space-y-2 px-4 sm:px-6">
            {drafts.map((d) => (
              <Link key={d.id} to="/running/$id/edit" params={{ id: d.id }} className="block">
                <Tile variant="warning" tone="soft" interactive className="gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <FileEdit className="size-4" />
                      טיוטה — {d.run_type === "treadmill" ? "הליכון" : "חוץ"}
                    </div>
                    <div className="ltr-nums text-xs text-muted-foreground">
                      {new Date(d.started_at).toLocaleDateString("he-IL")}
                    </div>
                  </div>
                  <TileFootnote>
                    {formatDistanceKm(d.distance_meters)} ק"מ ·{" "}
                    {formatDurationHMS(d.duration_seconds)}
                  </TileFootnote>
                </Tile>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <SectionHeader title="החודש הנוכחי" />
      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>מרחק כולל</TileLabel>
          <TileMetric
            value={agg.total_distance_m > 0 ? formatDistanceKm(agg.total_distance_m, 1) : "–"}
            unit='ק"מ'
          />
        </Tile>
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>מספר ריצות</TileLabel>
          <TileMetric value={agg.count > 0 ? agg.count : "–"} />
        </Tile>
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>קצב ממוצע</TileLabel>
          <TileMetric value={formatPace(agg.avg_pace_s_per_km)} unit='/ק"מ' />
        </Tile>
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>הכי ארוכה</TileLabel>
          <TileMetric
            value={agg.longest_distance_m ? formatDistanceKm(agg.longest_distance_m, 1) : "–"}
            unit='ק"מ'
          />
        </Tile>
      </div>

      <SectionHeader title="הריצה האחרונה" />
      <div className="px-4 sm:px-6">
        {last ? (
          <RunTile run={last} locationName={locationName(last.location_id)} />
        ) : (
          <EmptyState
            icon={<Footprints aria-hidden />}
            title="עדיין אין ריצות"
            description="דיווח ראשון יופיע כאן."
            action={
              <Link
                to="/running/new"
                className="tile-interactive inline-flex min-h-11 items-center gap-2 rounded-xl bg-run px-4 text-sm font-bold text-white"
              >
                <Plus className="size-4" aria-hidden /> הוספת ריצה
              </Link>
            }
          />
        )}
      </div>

      <SectionHeader title="יעדי ריצה" />
      <div id="goals" className="px-4 sm:px-6">
        <DomainPrimaryGoalTile domain="running" />
      </div>

      <SectionHeader title="עוד" />
      <div className="grid grid-cols-2 gap-3 px-4 sm:px-6">
        <Link to="/running/history" className="block">
          <Tile interactive className="gap-1">
            <div className="flex items-center gap-2 font-bold">
              <History className="size-4" />
              היסטוריה
            </div>
            <TileFootnote>{runs.length} ריצות שמורות</TileFootnote>
          </Tile>
        </Link>
        <Link to="/running/routes" className="block">
          <Tile interactive className="gap-1">
            <div className="flex items-center gap-2 font-bold">
              <MapPin className="size-4" />
              מסלולים
            </div>
            <TileFootnote>ניהול מסלולים קבועים</TileFootnote>
          </Tile>
        </Link>
        <Link to="/locations" className="block">
          <Tile interactive className="gap-1">
            <div className="flex items-center gap-2 font-bold">
              <Timer className="size-4" />
              מקומות והליכונים
            </div>
            <TileFootnote>קטלוג משותף</TileFootnote>
          </Tile>
        </Link>
      </div>
    </AppShell>
  );
}
