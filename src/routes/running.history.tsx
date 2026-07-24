import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Footprints, X } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile } from "@/components/tile/Tile";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { RunTile } from "@/components/runs/RunTile";
import { RUN_TYPE_LABELS, useAllRuns } from "@/lib/runs";
import { useAllLocations } from "@/lib/catalog";
import { useActiveRoutes } from "@/lib/runs";
import type { RunType } from "@/lib/runs";

export const Route = createFileRoute("/running/history")({
  head: () => ({
    meta: [
      { title: "היסטוריית ריצה · Fit Log" },
      { name: "description", content: "כל הריצות השמורות, פילטרים ומיון." },
      { property: "og:title", content: "היסטוריית ריצה · Fit Log" },
      { property: "og:description", content: "כל הריצות השמורות." },
    ],
  }),
  component: HistoryPage,
});

type SortKey = "date_desc" | "date_asc" | "distance" | "duration" | "pace";

function HistoryPage() {
  const runs = useAllRuns().filter((r) => r.deleted_at == null);
  const locations = useAllLocations();
  const routes = useActiveRoutes();
  const [type, setType] = useState<"all" | RunType>("all");
  const [locationId, setLocationId] = useState<string>("all");
  const [routeId, setRouteId] = useState<string>("all");
  const [status, setStatus] = useState<"all" | "completed" | "draft" | "archived">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");

  const filtered = useMemo(() => {
    let list = runs.slice();
    if (type !== "all") list = list.filter((r) => r.run_type === type);
    if (status !== "all") list = list.filter((r) => r.status === status);
    if (locationId !== "all") list = list.filter((r) => r.location_id === locationId);
    if (routeId !== "all") list = list.filter((r) => r.route_id === routeId);
    if (from) list = list.filter((r) => r.started_at >= from);
    if (to) list = list.filter((r) => r.started_at <= to + "T23:59");
    list.sort((a, b) => {
      switch (sort) {
        case "date_asc":
          return a.started_at < b.started_at ? -1 : 1;
        case "distance":
          return (b.distance_meters ?? 0) - (a.distance_meters ?? 0);
        case "duration":
          return (b.duration_seconds ?? 0) - (a.duration_seconds ?? 0);
        case "pace":
          return (a.average_pace_s_per_km ?? Infinity) - (b.average_pace_s_per_km ?? Infinity);
        default:
          return a.started_at < b.started_at ? 1 : -1;
      }
    });
    return list;
  }, [runs, type, status, locationId, routeId, from, to, sort]);

  const activeFilters = [
    type !== "all",
    status !== "all",
    locationId !== "all",
    routeId !== "all",
    !!from,
    !!to,
  ].filter(Boolean).length;
  const clear = () => {
    setType("all");
    setStatus("all");
    setLocationId("all");
    setRouteId("all");
    setFrom("");
    setTo("");
  };

  return (
    <AppShell topBar={{ title: "היסטוריה", back: { to: "/running", label: "חזרה" } }}>
      <PageHeader
        eyebrow="ריצה"
        title="היסטוריה"
        description={`${filtered.length} מתוך ${runs.length} ריצות`}
      />

      <div className="flex items-center gap-2 px-4 sm:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="me-1 size-4" />
              פילטרים{activeFilters > 0 ? ` (${activeFilters})` : ""}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>פילטרים</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <F label="סוג">
                <Select value={type} onValueChange={(v) => setType(v as "all" | RunType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="treadmill">{RUN_TYPE_LABELS.treadmill}</SelectItem>
                    <SelectItem value="outdoor">{RUN_TYPE_LABELS.outdoor}</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="סטטוס">
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="completed">הושלמו</SelectItem>
                    <SelectItem value="draft">טיוטות</SelectItem>
                    <SelectItem value="archived">בארכיון</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="מקום">
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              <F label="מסלול">
                <Select value={routeId} onValueChange={setRouteId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              <div className="grid grid-cols-2 gap-2">
                <F label="מתאריך">
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </F>
                <F label="עד תאריך">
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </F>
              </div>
              <Button variant="ghost" onClick={clear}>
                <X className="me-1 size-4" />
                ניקוי
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-9 max-w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">חדש → ישן</SelectItem>
            <SelectItem value="date_asc">ישן → חדש</SelectItem>
            <SelectItem value="distance">מרחק</SelectItem>
            <SelectItem value="duration">משך</SelectItem>
            <SelectItem value="pace">קצב</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 space-y-2 px-4 sm:px-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Footprints aria-hidden />}
            title="אין ריצות תואמות"
            description="נקה פילטרים או הוסף ריצה."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/running/new">הוספת ריצה</Link>
              </Button>
            }
          />
        ) : (
          filtered.map((r) => (
            <RunTile
              key={r.id}
              run={r}
              locationName={
                r.location_id ? locations.find((l) => l.id === r.location_id)?.name : null
              }
              routeName={r.route_id ? routes.find((x) => x.id === r.route_id)?.name : null}
            />
          ))
        )}
      </div>
    </AppShell>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-bold text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
