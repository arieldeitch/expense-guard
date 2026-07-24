/**
 * /home/sessions/$id/summary — סיכום אימון בית שהושלם.
 * מציג נתונים עובדתיים בלבד: תרגיל, סטים, חזרות, ממוצע, חציון, שינוי מפעם קודמת, שיאים אמיתיים.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, History as HistoryIcon } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote, TileLabel, TileMetric } from "@/components/tile/Tile";
import { EmptyState } from "@/components/shell/EmptyState";
import {
  detectRecords,
  homeQualityScore,
  listEntrySets,
  previousPerformance,
  sumDurationSeconds,
  sumReps,
  summarizeSets,
  useHomeSession,
  useHomeSessionEntries,
} from "@/lib/home";

export const Route = createFileRoute("/home/sessions/$id/summary")({
  head: () => ({
    meta: [
      { title: "סיכום אימון · Fit Log" },
      { name: "description", content: "סיכום עובדתי של אימון בית." },
      { property: "og:title", content: "סיכום אימון · Fit Log" },
      { property: "og:description", content: "סיכום עובדתי של אימון בית." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SummaryPage,
});

function SummaryPage() {
  const { id } = Route.useParams();
  const session = useHomeSession(id);
  const entries = useHomeSessionEntries(id);
  if (!session) {
    return (
      <AppShell topBar={{ title: "לא נמצא", back: { to: "/home" } }}>
        <EmptyState title="סיכום לא נמצא" description="ייתכן שהאימון נמחק." />
      </AppShell>
    );
  }
  const per = entries.map((e) => {
    const sets = listEntrySets(e.id);
    const s = summarizeSets(sets);
    const prev = previousPerformance(e.exercise_id, id);
    const q = homeQualityScore({ sets, previousTotalReps: prev?.totalReps ?? null });
    const records = detectRecords(e.exercise_id, id);
    return { entry: e, sets, summary: s, prev, quality: q, records };
  });
  const totals = {
    reps: per.reduce((a, p) => a + p.summary.totalReps, 0),
    sets: per.reduce((a, p) => a + p.summary.completedSets, 0),
    duration: session.duration_seconds ?? 0,
    records: per.reduce((a, p) => a + p.records.filter((r) => !r.isBaseline).length, 0),
    baselines: per.reduce((a, p) => a + p.records.filter((r) => r.isBaseline).length, 0),
  };

  return (
    <AppShell topBar={{ title: "סיכום", back: { to: "/home" } }}>
      <PageHeader
        eyebrow="אימון בית"
        title={session.name}
        description={`נתונים עובדתיים בלבד. ${totals.records} שיאים חדשים, ${totals.baselines} baselines.`}
      />

      <div className="grid grid-cols-4 gap-2 px-4 sm:px-6">
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>סטים</TileLabel>
          <TileMetric value={totals.sets || "–"} />
        </Tile>
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>חזרות</TileLabel>
          <TileMetric value={totals.reps || "–"} />
        </Tile>
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>משך</TileLabel>
          <TileMetric value={totals.duration ? formatDuration(totals.duration) : "–"} />
        </Tile>
        <Tile variant="goal" tone="soft" size="sm">
          <TileLabel>שיאים</TileLabel>
          <TileMetric value={totals.records || "–"} />
          <TileFootnote>
            {totals.baselines ? `+${totals.baselines} baseline` : ""}
          </TileFootnote>
        </Tile>
      </div>

      <SectionHeader title="פירוט תרגילים" />
      <div className="space-y-3 px-4 sm:px-6">
        {per.map(({ entry, summary, prev, quality, records }) => (
          <Tile key={entry.id} variant="home" tone="soft">
            <div className="flex items-start justify-between">
              <div>
                <TileLabel>תרגיל</TileLabel>
                <div className="text-base font-black">{entry.snapshot.exercise_name}</div>
              </div>
              <div className="text-end">
                <TileLabel>איכות</TileLabel>
                <div className="ltr-nums text-lg font-black">{quality.score}</div>
              </div>
            </div>
            <div className="ltr-nums grid grid-cols-3 gap-2 text-xs">
              <Stat label="סטים" value={`${summary.completedSets}/${summary.totalSets}`} />
              <Stat label="חזרות" value={summary.totalReps || "–"} />
              <Stat label="ממוצע" value={summary.averageReps != null ? summary.averageReps.toFixed(1) : "–"} />
              <Stat label="חציון" value={summary.medianReps != null ? summary.medianReps.toFixed(1) : "–"} />
              <Stat label="מקס׳ סט" value={summary.maxReps ?? "–"} />
              <Stat
                label="אחרון/ראשון"
                value={
                  summary.lastToFirstRatio != null
                    ? `${Math.round(summary.lastToFirstRatio * 100)}%`
                    : "–"
                }
              />
            </div>
            {prev ? (
              <TileFootnote className="mt-1">
                השוואה לפעם קודמת ({new Date(prev.sessionDate).toLocaleDateString("he-IL")}):{" "}
                <b className="text-foreground">
                  {prev.totalReps != null
                    ? `${summary.totalReps - prev.totalReps > 0 ? "+" : ""}${summary.totalReps - prev.totalReps} חז׳`
                    : "אין נתונים"}
                </b>
              </TileFootnote>
            ) : (
              <TileFootnote className="mt-1">
                אימון ראשון לתרגיל זה — נתוני בסיס.
              </TileFootnote>
            )}
            {records.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {records.map((r, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black ${
                      r.isBaseline
                        ? "bg-info-soft text-info"
                        : "bg-goal-soft text-goal"
                    }`}
                  >
                    <BadgeCheck className="size-3" aria-hidden />
                    {recordLabel(r)}
                  </span>
                ))}
              </div>
            ) : null}
            <Link
              to="/exercises/$id/history"
              params={{ id: entry.exercise_id }}
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              <HistoryIcon aria-hidden className="size-3.5" />
              היסטוריית תרגיל
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </Tile>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 px-4 sm:px-6">
        <Link
          to="/home/history/$id"
          params={{ id }}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border-strong bg-tint px-4 text-sm font-bold text-muted-foreground"
        >
          פרטי אימון
        </Link>
        <Link
          to="/home"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-home px-4 text-sm font-black text-white"
        >
          חזרה לתחום בית
        </Link>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-surface px-2 py-1 text-center">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="ltr-nums text-sm font-black">{value}</div>
    </div>
  );
}

function recordLabel(r: {
  kind: string;
  value: number;
  units: string;
  isBaseline: boolean;
}): string {
  const kinds: Record<string, string> = {
    top_reps_in_set: "שיא חזרות בסט",
    top_reps_in_session: "שיא חזרות באימון",
    top_avg_reps_per_set: "ממוצע לסט",
    top_hold_seconds: "שיא זמן",
    top_rounds: "שיא סבבים",
    top_reps_per_minute: "צפיפות",
    top_added_weight: "משקל נוסף",
    same_load_lower_rpe: "RPE נמוך יותר",
  };
  const base = kinds[r.kind] ?? r.kind;
  const suffix = r.isBaseline ? " · baseline" : "";
  return `${base}: ${Math.round(r.value * 10) / 10}${suffix}`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}ד׳ ${s}שנ׳` : `${s}שנ׳`;
}
