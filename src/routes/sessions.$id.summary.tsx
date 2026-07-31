/**
 * /sessions/$id/summary — סיכום עובדתי לאחר סיום אימון.
 * ללא צ׳ירלידינג, ללא קונפטי. מספרים, שיאים, וקישורים לפעולה הבאה.
 */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Repeat2, History, GitCompare } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote, TileLabel, TileMetric } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import { useLocation } from "@/lib/catalog";
import {
  duplicateSessionAsNew,
  useSession,
  useSessionBlocks,
  useSessionExercises,
  useSessionVolume,
} from "@/lib/sessions";
import { useHydrated } from "@/lib/storage/useHydrated";
import { computeWorkoutQuality, detectSessionRecords, labelForRecord } from "@/lib/analytics";
import { QualityBreakdown } from "@/components/analytics/QualityBreakdown";

export const Route = createFileRoute("/sessions/$id/summary")({
  head: () => ({
    meta: [
      { title: "סיכום אימון · Fit Log" },
      { name: "description", content: "סיכום עובדתי של אימון כוח שהסתיים." },
      { property: "og:title", content: "סיכום אימון · Fit Log" },
      { property: "og:description", content: "סיכום עובדתי של אימון כוח שהסתיים." },
    ],
  }),
  component: SessionSummary,
});

function SessionSummary() {
  const { id } = Route.useParams();
  const session = useSession(id);
  const blocks = useSessionBlocks(id);
  const exercises = useSessionExercises(id);
  const volume = useSessionVolume(id);
  const location = useLocation(session?.location_id ?? undefined);
  const hydrated = useHydrated();
  // לשרת אין `localStorage`, ולכן `session` תמיד null שם. זריקת `notFound()`
  // ב-render של השרת מפילה את גבול ה-Suspense (React #419) ומאלצת client
  // rendering של כל תת-העץ. נמנעים מכך עד שה-hydration הסתיים. ראה ADR-0039.
  if (!hydrated) return null;
  if (!session) throw notFound();

  const records = detectSessionRecords(id);
  const realPRs = records.filter((r) => !r.isBaseline);
  const quality = session.status === "completed" ? computeWorkoutQuality(id) : null;

  return (
    <AppShell topBar={{ title: "סיכום אימון", back: { to: "/gym" } }}>
      <PageHeader
        eyebrow={location ? location.name : "אימון"}
        title={session.name}
        description={`הסתיים ${session.ended_at ? new Date(session.ended_at).toLocaleString("he-IL") : "—"}`}
      />

      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Tile size="sm" variant="gym" tone="soft">
          <TileLabel>משך</TileLabel>
          <TileMetric value={formatHMS(session.duration_seconds ?? volume.totalDurationSeconds)} />
        </Tile>
        <Tile size="sm" variant="gym" tone="soft">
          <TileLabel>נפח</TileLabel>
          <TileMetric value={`${volume.totalVolumeKg}ק״ג`} />
        </Tile>
        <Tile size="sm" variant="gym" tone="soft">
          <TileLabel>סטים</TileLabel>
          <TileMetric value={`${volume.completedSets}/${volume.totalSets}`} />
        </Tile>
        <Tile size="sm" variant="gym" tone="soft">
          <TileLabel>תרגילים</TileLabel>
          <TileMetric value={`${volume.completedExercises}/${volume.totalExercises}`} />
        </Tile>
      </div>

      {realPRs.length > 0 ? (
        <section className="mt-4 px-4 sm:px-6">
          <div className="rounded-2xl border border-success/40 bg-success-soft/25 p-3">
            <div className="mb-2 text-sm font-black text-success">שיאים</div>
            <ul className="flex flex-col gap-1">
              {realPRs.map((r, i) => (
                <li key={i} className="flex items-start justify-between gap-2 text-sm">
                  <span className="font-bold">{labelForRecord(r)}</span>
                  <Chip tone="success">{r.value}</Chip>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {quality ? (
        <section className="mt-4 px-4 sm:px-6">
          <QualityBreakdown quality={quality} />
        </section>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 px-4 sm:px-6">
        <Link
          to="/gym/history"
          className="inline-flex items-center gap-1 rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm font-bold"
        >
          <History className="size-4" aria-hidden /> היסטוריית אימונים
        </Link>
        <Link
          to="/gym/compare"
          search={{ a: id } as never}
          className="inline-flex items-center gap-1 rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm font-bold"
        >
          <GitCompare className="size-4" aria-hidden /> השווה לאימון קודם
        </Link>
      </div>


      <section className="mt-4 flex flex-col gap-2 px-4 pb-24 sm:px-6">
        {blocks.map((b) => {
          const items = exercises.filter((e) => e.block_id === b.id);
          if (!items.length) return null;
          return (
            <div key={b.id} className="rounded-xl border border-border-strong bg-surface p-2">
              {items.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between gap-2 border-b border-border-strong/40 py-1 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{ex.snapshot.exercise_name}</div>
                  </div>
                  <div className="ltr-nums text-xs text-muted-foreground">
                    {ex.completed ? "הושלם" : "לא הושלם"}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </section>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto flex max-w-md gap-2 px-3 sm:bottom-4">
        <Link
          to="/gym"
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-border-strong bg-surface-elevated py-3 text-sm font-bold"
        >
          <ArrowRight aria-hidden className="size-4" /> חזרה
        </Link>
        <button
          type="button"
          onClick={() => {
            const s = duplicateSessionAsNew(id);
            if (s) window.location.href = `/sessions/${s.id}`;
          }}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gym py-3 text-sm font-bold text-white"
        >
          <Repeat2 aria-hidden className="size-4" /> חזור על האימון
        </button>
      </div>
      <TileFootnote className="px-4 pb-4 text-center sm:px-6">
        כל הנתונים נשמרו מקומית. שיאים מחושבים מהיסטוריית האימונים בלבד.
      </TileFootnote>
    </AppShell>
  );
}

function formatHMS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (hh > 0)
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
