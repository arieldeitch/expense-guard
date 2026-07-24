/**
 * /treadmills/$id — היסטוריית כיול, זיהוי חריגות, והצעת מקדם עדכנית.
 * מציג את הפרופיל הפעיל, את היסטוריית הפרופילים, את רשימת הריצות שנכנסו לחישוב
 * (עם סימון חריגה + החרגה ידנית), וגרף פערים.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CheckCircle2, ShieldOff, Undo2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote, TileLabel, TileMetric } from "@/components/tile/Tile";
import { Button } from "@/components/ui/button";
import { DiffChart, type DiffPoint } from "@/components/suunto/DiffChart";
import { getTreadmill, useTreadmill } from "@/lib/catalog";
import { useAllRuns } from "@/lib/runs";
import {
  buildCalibrationInputs,
  confidenceLabelHebrew,
  proposeCalibration,
  suuntoRepo,
  useActiveCalibration,
  useCalibrationsForTreadmill,
  useExclusions,
} from "@/lib/suunto";

export const Route = createFileRoute("/treadmills/$id")({
  head: () => ({
    meta: [
      { title: "כיול הליכון · Fit Log" },
      { name: "description", content: "היסטוריית כיול הליכון והצעת מקדם על סמך פערי Suunto." },
      { property: "og:title", content: "כיול הליכון · Fit Log" },
      { property: "og:description", content: "היסטוריית כיול והצעת מקדם." },
    ],
  }),
  loader: ({ params }) => {
    const t = getTreadmill(params.id);
    if (!t) throw notFound();
    return { id: params.id };
  },
  component: TreadmillCalibrationPage,
});

function TreadmillCalibrationPage() {
  const { id } = Route.useLoaderData();
  const treadmill = useTreadmill(id);
  const runs = useAllRuns();
  const active = useActiveCalibration(id);
  const history = useCalibrationsForTreadmill(id);
  const exclusions = useExclusions(id);

  // exclusions נדרש כתלות כדי לחשב מחדש כשמצב ההחרגות משתנה (buildCalibrationInputs קורא לו פנימית)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const inputs = useMemo(() => buildCalibrationInputs(id, runs), [id, runs, exclusions]);
  const proposal = useMemo(() => proposeCalibration(id, inputs), [id, inputs]);
  const [confirming, setConfirming] = useState(false);

  const diffPoints: DiffPoint[] = useMemo(
    () =>
      inputs
        .filter((r) => !r.excluded && r.treadmill_distance_m! > 0)
        .map((r) => ({
          run_id: r.run_id,
          date: r.started_at,
          diff_percent:
            ((r.suunto_distance_m! - r.treadmill_distance_m!) / r.treadmill_distance_m!) * 100,
          is_outlier: r.is_outlier,
        })),
    [inputs],
  );

  if (!treadmill) return null;

  const handleApprove = () => {
    if (proposal.factor == null) return;
    const created = suuntoRepo.createCalibration({
      treadmill_id: id,
      factor: proposal.factor,
      calculation_method: proposal.method,
      sample_size: proposal.sample_size,
      period_start: proposal.period_start,
      period_end: proposal.period_end,
      confidence_label: proposal.confidence_label,
      included_run_ids: proposal.included_run_ids,
      excluded_run_ids: proposal.excluded_run_ids,
      diagnostics: proposal.diagnostics,
      status: "draft",
      approved_at: null,
      revoked_at: null,
      notes: null,
    });
    suuntoRepo.approveCalibration(created.id);
    toast.success("מקדם כיול חדש אושר. הפרופיל הקודם עודכן ל-superseded.");
    setConfirming(false);
  };

  return (
    <AppShell topBar={{ title: "כיול הליכון", back: { to: "/locations", label: "חזרה" } }}>
      <PageHeader
        eyebrow="Suunto ↔ הליכון"
        title={treadmill.display_name}
        description={`${treadmill.manufacturer ?? ""} ${treadmill.model ?? ""}`.trim() || undefined}
      />

      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>ריצות עם שני מקורות</TileLabel>
          <TileMetric value={proposal.sample_size.toString()} unit={`/ ${inputs.length}`} />
          <TileFootnote>
            {inputs.length - proposal.sample_size > 0
              ? `${inputs.length - proposal.sample_size} הוחרגו/חריגות`
              : "אין ריצות שהוחרגו"}
          </TileFootnote>
        </Tile>
        <Tile size="sm">
          <TileLabel>מקדם מוצע</TileLabel>
          <TileMetric value={proposal.factor != null ? proposal.factor.toFixed(4) : "—"} />
          <TileFootnote>{confidenceLabelHebrew(proposal.confidence_label)}</TileFootnote>
        </Tile>
        <Tile size="sm">
          <TileLabel>פער חציוני</TileLabel>
          <TileMetric
            value={
              Number.isFinite(proposal.diagnostics.median_distance_diff_percent)
                ? `${proposal.diagnostics.median_distance_diff_percent.toFixed(1)}%`
                : "—"
            }
          />
          <TileFootnote>Suunto מול הליכון</TileFootnote>
        </Tile>
        <Tile size="sm">
          <TileLabel>פרופיל פעיל</TileLabel>
          <TileMetric value={active ? active.factor.toFixed(4) : "אין"} />
          <TileFootnote>
            {active ? confidenceLabelHebrew(active.confidence_label) : "לא הוגדר"}
          </TileFootnote>
        </Tile>
      </div>

      <SectionHeader title="הצעת כיול" />
      <div className="px-4 sm:px-6">
        <Tile>
          <div className="text-sm">{proposal.narrative}</div>
          {proposal.factor != null ? (
            <>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>חציון יחס: {proposal.diagnostics.median_ratio.toFixed(4)}</div>
                <div>ממוצע יחס: {proposal.diagnostics.mean_ratio.toFixed(4)}</div>
                <div>סטיית תקן: {proposal.diagnostics.stddev_percent.toFixed(1)}%</div>
                <div>
                  טווח: {proposal.diagnostics.min_ratio.toFixed(3)} –{" "}
                  {proposal.diagnostics.max_ratio.toFixed(3)}
                </div>
              </div>
              {confirming ? (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="rounded-lg border border-warning/40 bg-warning/10 p-2 text-xs">
                    האישור משפיע רק על תצוגות "מרחק מוצע" — לא משנה נתוני מקור. הפרופיל הפעיל הקודם
                    יעבור ל-superseded אך יישמר בהיסטוריה.
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleApprove}>
                      <CheckCircle2 className="me-1 size-4" />
                      אשר
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <Button className="mt-3" size="sm" onClick={() => setConfirming(true)}>
                  אישור והחלה
                </Button>
              )}
            </>
          ) : null}
        </Tile>
      </div>

      <SectionHeader title="מגמת פערים" />
      <div className="px-4 sm:px-6">
        <Tile size="sm">
          <DiffChart points={diffPoints} />
          <TileFootnote>
            נקודה כתומה = חריגה סטטיסטית (MAD). ריצות שהוחרגו ידנית לא מופיעות בגרף.
          </TileFootnote>
        </Tile>
      </div>

      <SectionHeader title="ריצות אליגיביליות" />
      <div className="space-y-2 px-4 sm:px-6">
        {inputs.length === 0 ? (
          <Tile size="sm">
            <TileLabel>אין ריצות עם נתוני Suunto להליכון זה</TileLabel>
            <TileFootnote>הוסף נתוני Suunto לריצות הליכון קיימות כדי לחשב מקדם כיול.</TileFootnote>
          </Tile>
        ) : null}
        {inputs
          .slice()
          .sort((a, b) => b.started_at.localeCompare(a.started_at))
          .map((r) => (
            <Tile key={r.run_id} size="sm" className="gap-2">
              <div className="flex items-center justify-between gap-2">
                <Link
                  to="/running/$id"
                  params={{ id: r.run_id }}
                  className="text-sm font-bold hover:underline"
                >
                  {new Date(r.started_at).toLocaleDateString("he-IL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                </Link>
                <div className="flex flex-wrap items-center gap-1">
                  {r.is_outlier ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-warning-soft px-1.5 py-0.5 text-[11px] font-bold text-warning-foreground">
                      <TriangleAlert className="size-3" />
                      חריגה
                    </span>
                  ) : null}
                  {r.excluded ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                      <ShieldOff className="size-3" />
                      הוחרג
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">הליכון</div>
                  <div className="ltr-nums font-bold">
                    {(r.treadmill_distance_m! / 1000).toFixed(2)} ק"מ
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Suunto</div>
                  <div className="ltr-nums font-bold">
                    {(r.suunto_distance_m! / 1000).toFixed(2)} ק"מ
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">פער</div>
                  <div className="ltr-nums font-bold">
                    {(
                      ((r.suunto_distance_m! - r.treadmill_distance_m!) / r.treadmill_distance_m!) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                {r.excluded ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      suuntoRepo.includeRun(id, r.run_id);
                      toast.info("הריצה חזרה להיכלל בחישוב");
                    }}
                  >
                    <Undo2 className="me-1 size-3" />
                    החזרה לחישוב
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const reason = window.prompt("סיבת החרגה (אופציונלי)") ?? null;
                      suuntoRepo.excludeRun(id, r.run_id, reason);
                      toast.info("הריצה הוחרגה מחישוב הכיול");
                    }}
                  >
                    <ShieldOff className="me-1 size-3" />
                    החרגה
                  </Button>
                )}
              </div>
            </Tile>
          ))}
      </div>

      <SectionHeader title="היסטוריית פרופילים" />
      <div className="space-y-2 px-4 sm:px-6">
        {history.length === 0 ? (
          <Tile size="sm">
            <TileFootnote>עדיין לא נשמר פרופיל כיול להליכון זה.</TileFootnote>
          </Tile>
        ) : null}
        {history
          .slice()
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map((c) => (
            <Tile key={c.id} size="sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold">מקדם {c.factor.toFixed(4)}</div>
                  <TileFootnote>
                    {new Date(c.created_at).toLocaleDateString("he-IL")} · {c.sample_size} ריצות ·{" "}
                    {confidenceLabelHebrew(c.confidence_label)}
                  </TileFootnote>
                </div>
                <span
                  className={
                    c.status === "approved"
                      ? "rounded bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success-foreground"
                      : "rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                  }
                >
                  {c.status}
                </span>
              </div>
            </Tile>
          ))}
      </div>
    </AppShell>
  );
}
