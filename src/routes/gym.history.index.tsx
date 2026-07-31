/**
 * /gym/history — היסטוריית אימוני כוח כאריחים עם פילטרים.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { History, GitCompare } from "lucide-react";
import { SessionHistoryTileCard } from "@/components/analytics/SessionHistoryTile";
import { HistoryFiltersSheet } from "@/components/analytics/HistoryFiltersSheet";
import { listSessionHistory, resolveRange } from "@/lib/analytics";
import type {
  SessionHistoryFilters,
  SessionHistorySort,
  TimeRangeId,
} from "@/lib/analytics";
import { useAllSessions } from "@/lib/sessions";
import { useHydrated } from "@/lib/storage/useHydrated";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/gym/history/")({
  head: () => ({
    meta: [
      { title: "היסטוריית אימוני כוח · Fit Log" },
      { name: "description", content: "היסטוריית אימוני כוח עם מדדים, שיאים והשוואות." },
      { property: "og:title", content: "היסטוריית אימוני כוח · Fit Log" },
      {
        property: "og:description",
        content: "היסטוריית אימוני כוח עם מדדים, שיאים והשוואות.",
      },
    ],
  }),
  component: GymHistoryPage,
});

function GymHistoryPage() {
  useAllSessions();
  // `listSessionHistory` קורא את ה-repository ישירות. ב-SSR האחסון ריק, ולכן
  // בלי השהיה עד ה-hydration נוצרת אי-התאמה ב-hydration (ADR-0039).
  const hydrated = useHydrated();
  const [range, setRange] = useState<TimeRangeId>("all");
  const [sort, setSort] = useState<SessionHistorySort>("date_desc");
  const [filters, setFilters] = useState<SessionHistoryFilters>({});
  const tiles = useMemo(() => {
    if (!hydrated) return [];
    const rr = resolveRange(range);
    return listSessionHistory({ ...filters, from: rr.from, to: rr.to }, sort);
  }, [range, sort, filters, hydrated]);

  return (
    <AppShell topBar={{ title: "היסטוריית כוח", back: { to: "/gym" } }}>
      <PageHeader
        eyebrow="חדר כושר"
        title="היסטוריית אימונים"
        description="כל האימונים שנשמרו — כולל טיוטות, ארכיון ואימונים חלקיים."
      />
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6">
        <HistoryFiltersSheet
          filters={filters}
          sort={sort}
          range={range}
          onChange={({ filters: f, sort: s, range: r }) => {
            setFilters(f);
            setSort(s);
            setRange(r);
          }}
        />
        <Button asChild variant="outline" size="sm">
          <Link to="/gym/compare" className="gap-2">
            <GitCompare className="size-4" aria-hidden /> השוואה
          </Link>
        </Button>
      </div>

      {tiles.length === 0 ? (
        <div className="px-4 sm:px-6">
          <EmptyState
            icon={<History aria-hidden />}
            title="אין אימונים בטווח זה"
            description="שנה את הפילטרים או התחל אימון חדש כדי לצבור היסטוריה."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
          {tiles.map((t) => (
            <SessionHistoryTileCard key={t.session.id} tile={t} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
