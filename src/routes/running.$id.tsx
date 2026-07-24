import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Copy as CopyIcon, Pencil, Trash2, Archive } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote, TileLabel, TileMetric } from "@/components/tile/Tile";
import { Button } from "@/components/ui/button";
import {
  RUN_STATUS_LABELS,
  RUN_TYPE_LABELS,
  SEGMENT_TYPE_LABELS,
  formatDistanceKm,
  formatDurationHMS,
  formatPace,
  formatSpeed,
  runsRepo,
  useRun,
} from "@/lib/runs";
import { useAllLocations, useTreadmill } from "@/lib/catalog";
import { useActiveRoutes } from "@/lib/runs";

export const Route = createFileRoute("/running/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "פרטי ריצה · Fit Log" },
      { name: "description", content: "פרטי סשן ריצה עם מדדים, מקטעים והערות." },
      { property: "og:title", content: "פרטי ריצה · Fit Log" },
      { property: "og:description", content: "פרטי סשן ריצה." },
    ],
  }),
  loader: ({ params }) => {
    const run = runsRepo.getRun(params.id);
    if (!run) throw notFound();
    return { id: params.id };
  },
  component: RunDetail,
});

function RunDetail() {
  const { id } = Route.useLoaderData();
  const run = useRun(id);
  const navigate = useNavigate();
  const locations = useAllLocations();
  const routes = useActiveRoutes();
  const treadmill = useTreadmill(run?.treadmill_id ?? undefined);

  if (!run) return null;
  const locationName = run.location_id
    ? locations.find((l) => l.id === run.location_id)?.name
    : null;
  const routeName = run.route_id ? routes.find((r) => r.id === run.route_id)?.name : null;

  const provTag = (field: string) => {
    const s = run.provenance[field as keyof typeof run.provenance];
    if (!s || s === "manual") return null;
    return (
      <span className="ms-1 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
        {s === "derived" ? "מחושב" : s === "device" ? "מכשיר" : s}
      </span>
    );
  };

  return (
    <AppShell topBar={{ title: "פרטי ריצה", back: { to: "/running/history", label: "חזרה" } }}>
      <PageHeader
        eyebrow={`${RUN_TYPE_LABELS[run.run_type]} · ${RUN_STATUS_LABELS[run.status]}`}
        title={new Date(run.started_at).toLocaleString("he-IL", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
        description={locationName || routeName || run.free_text_location || undefined}
      />

      <div className="grid grid-cols-3 gap-3 px-4 sm:px-6">
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>מרחק</TileLabel>
          <TileMetric value={formatDistanceKm(run.distance_meters)} unit='ק"מ' />
          <TileFootnote>{provTag("distance_meters")}</TileFootnote>
        </Tile>
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>זמן</TileLabel>
          <TileMetric value={formatDurationHMS(run.duration_seconds)} />
          <TileFootnote>{provTag("duration_seconds")}</TileFootnote>
        </Tile>
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>קצב</TileLabel>
          <TileMetric value={formatPace(run.average_pace_s_per_km)} unit='/ק"מ' />
          <TileFootnote>{provTag("average_pace_s_per_km")}</TileFootnote>
        </Tile>
      </div>

      <SectionHeader title="מדדים נוספים" />
      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Metric
          label="מהירות ממוצעת"
          value={formatSpeed(run.average_speed_kmh)}
          unit='קמ"ש'
          extra={provTag("average_speed_kmh")}
        />
        {run.run_type === "treadmill" ? (
          <>
            <Metric label="מהירות מרבית" value={formatSpeed(run.max_speed_kmh)} unit='קמ"ש' />
            <Metric
              label="שיפוע ממוצע"
              value={run.average_incline_pct?.toString() ?? "–"}
              unit="%"
            />
            <Metric label="שיפוע מרבי" value={run.max_incline_pct?.toString() ?? "–"} unit="%" />
          </>
        ) : (
          <>
            <Metric label="עלייה" value={run.elevation_gain_m?.toString() ?? "–"} unit="מ'" />
            <Metric label="ירידה" value={run.elevation_loss_m?.toString() ?? "–"} unit="מ'" />
          </>
        )}
        <Metric label="דופק ממוצע" value={run.average_heart_rate?.toString() ?? "–"} />
        <Metric label="דופק מרבי" value={run.max_heart_rate?.toString() ?? "–"} />
        <Metric label="Cadence" value={run.average_cadence_spm?.toString() ?? "–"} unit="spm" />
        <Metric label="קלוריות" value={run.calories?.toString() ?? "–"} />
        <Metric label="תחושת קושי" value={run.perceived_effort?.toString() ?? "–"} unit="/10" />
      </div>

      {treadmill ? (
        <>
          <SectionHeader title="הליכון" />
          <div className="px-4 sm:px-6">
            <Tile>
              <div className="font-bold">{treadmill.display_name}</div>
              <TileFootnote>
                {treadmill.manufacturer} {treadmill.model}
              </TileFootnote>
            </Tile>
          </div>
        </>
      ) : null}

      {run.segments.length > 0 ? (
        <>
          <SectionHeader title="מקטעים" />
          <div className="space-y-2 px-4 sm:px-6">
            {run.segments.map((s, i) => (
              <Tile key={s.id} size="sm" className="gap-1">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>
                    #{i + 1} · {SEGMENT_TYPE_LABELS[s.segment_type]}
                  </span>
                  <span className="ltr-nums text-xs text-muted-foreground">
                    {formatDurationHMS(s.duration_seconds)} · {formatDistanceKm(s.distance_meters)}{" "}
                    ק"מ
                  </span>
                </div>
              </Tile>
            ))}
          </div>
        </>
      ) : null}

      {run.notes ? (
        <>
          <SectionHeader title="הערות" />
          <div className="px-4 sm:px-6">
            <Tile>
              <div className="whitespace-pre-wrap text-sm">{run.notes}</div>
            </Tile>
          </div>
        </>
      ) : null}

      <SectionHeader title="פעולות" />
      <div className="grid grid-cols-2 gap-2 px-4 sm:grid-cols-4 sm:px-6">
        <Button asChild variant="outline">
          <Link to="/running/$id/edit" params={{ id: run.id }}>
            <Pencil className="me-1 size-4" />
            עריכה
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const dup = runsRepo.duplicateRun(run.id);
            if (dup) {
              toast.success("שוכפל לטיוטה");
              navigate({ to: "/running/$id/edit", params: { id: dup.id } });
            }
          }}
        >
          <CopyIcon className="me-1 size-4" />
          שכפול
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (run.status === "archived") runsRepo.unarchiveRun(run.id);
            else runsRepo.archiveRun(run.id);
            toast.info(run.status === "archived" ? "הוצאה מארכיון" : "הועברה לארכיון");
          }}
        >
          <Archive className="me-1 size-4" />
          {run.status === "archived" ? "הוצא מארכיון" : "ארכוב"}
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            if (!window.confirm("להעביר את הריצה לסל המחזור? הפעולה ניתנת לשחזור.")) return;
            runsRepo.softDeleteRun(run.id);
            toast.info("הריצה הועברה לסל המחזור");
            navigate({ to: "/running/history" });
          }}
        >
          <Trash2 className="me-1 size-4" />
          מחיקה
        </Button>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  unit,
  extra,
}: {
  label: string;
  value: string;
  unit?: string;
  extra?: React.ReactNode;
}) {
  return (
    <Tile size="sm">
      <TileLabel>{label}</TileLabel>
      <TileMetric value={value} unit={unit} />
      {extra ? <TileFootnote>{extra}</TileFootnote> : null}
    </Tile>
  );
}
