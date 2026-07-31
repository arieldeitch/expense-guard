/**
 * /gym/history/$id — מסך פרטי אימון היסטורי מלא.
 *
 * מציג: סיכום, מקום, משך, תרגילים (sections נפתחים), סטים בפועל,
 * ערכי תכנון מול ביצוע, RPE/RIR, הערות, שיאים, מדד איכות, השוואה לאימון דומה.
 */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useHydrated } from "@/lib/storage/useHydrated";
import { useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { Tile, TileLabel, TileMetric, TileFootnote } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import { QualityBreakdown } from "@/components/analytics/QualityBreakdown";
import { Repeat2, ChevronDown, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useSession,
  useSessionBlocks,
  useSessionExercises,
  useSessionVolume,
  useExerciseSets,
  duplicateSessionAsNew,
} from "@/lib/sessions";
import { useLocation } from "@/lib/catalog";
import { useExercise } from "@/lib/exercises";
import {
  computeWorkoutQuality,
  detectSessionRecords,
  labelForRecord,
  buildSessionHistoryTile,
} from "@/lib/analytics";
import type { StrengthSessionExercise } from "@/lib/sessions";

export const Route = createFileRoute("/gym/history/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `אימון ${params.id.slice(0, 6)} · Fit Log` },
      { name: "description", content: "פרטי אימון כוח היסטורי — סטים, שיאים ומדד איכות." },
    ],
  }),
  component: GymHistoryDetail,
});

function GymHistoryDetail() {
  const { id } = Route.useParams();
  const session = useSession(id);
  const blocks = useSessionBlocks(id);
  const exercises = useSessionExercises(id);
  const volume = useSessionVolume(id);
  const location = useLocation(session?.location_id ?? undefined);
  const hydrated = useHydrated();
  // ראה ADR-0039 — אין לזרוק notFound() ב-render של השרת (אין שם localStorage).
  if (!hydrated) return null;
  if (!session) throw notFound();
  const tile = buildSessionHistoryTile(session);
  const quality = session.status === "completed" ? computeWorkoutQuality(id) : null;
  const records = session.status === "completed" ? detectSessionRecords(id) : [];
  const durMin = session.duration_seconds ? Math.round(session.duration_seconds / 60) : null;

  function onDuplicate() {
    const s = duplicateSessionAsNew(id);
    if (s) window.location.assign(`/sessions/${s.id}`);
  }

  return (
    <AppShell topBar={{ title: "פרטי אימון", back: { to: "/gym/history" } }}>
      <PageHeader
        eyebrow={location ? location.name : "אימון"}
        title={session.name}
        description={new Date(session.started_at).toLocaleString("he-IL")}
      />
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6">
        <Button size="sm" onClick={onDuplicate} className="gap-2">
          <Repeat2 className="size-4" aria-hidden /> שכפל כאימון חדש
        </Button>
        {tile.vsPreviousSimilar ? (
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link
              to="/gym/compare"
              search={{ a: id, b: tile.vsPreviousSimilar.sessionId } as never}
            >
              <GitCompare className="size-4" aria-hidden /> השוואה לאימון דומה קודם
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <SmallTile label="משך" value={durMin != null ? `${durMin} דק'` : "—"} />
        <SmallTile label="תרגילים" value={String(exercises.length)} />
        <SmallTile label="סטים" value={`${volume.completedSets}/${volume.totalSets}`} />
        <SmallTile
          label="נפח"
          value={volume.totalVolumeKg > 0 ? String(volume.totalVolumeKg) : "—"}
          unit={volume.totalVolumeKg > 0 ? "kg" : undefined}
        />
        <SmallTile label="חזרות" value={String(volume.totalReps)} />
        <SmallTile label="שלמות" value={`${Math.round(volume.completionRate * 100)}%`} />
        <SmallTile label="שיאים" value={String(records.filter((r) => !r.isBaseline).length)} />
        <SmallTile
          label="RPE כללי"
          value={session.perceived_effort != null ? String(session.perceived_effort) : "—"}
        />
      </div>

      {records.length > 0 ? (
        <div className="px-4 sm:px-6">
          <Tile>
            <TileLabel>שיאים ונתוני בסיס</TileLabel>
            <ul className="mt-2 space-y-1">
              {records.map((r, i) => (
                <li key={i} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    <div className="font-bold">{labelForRecord(r)}</div>
                    <div className="text-xs text-muted-foreground">{r.comparisonNote}</div>
                  </div>
                  <div className="ltr-nums text-sm font-bold">
                    {r.value}
                    {r.unit === "kg" || r.unit === "1rm_kg"
                      ? " kg"
                      : r.unit === "volume_kg"
                        ? " kg·reps"
                        : r.unit === "rpe"
                          ? " RPE"
                          : ""}
                  </div>
                </li>
              ))}
            </ul>
          </Tile>
        </div>
      ) : null}

      {quality ? (
        <div className="px-4 sm:px-6">
          <QualityBreakdown quality={quality} />
        </div>
      ) : null}

      <div className="space-y-2 px-4 sm:px-6">
        {exercises.map((ex) => (
          <ExerciseSection key={ex.id} ex={ex} />
        ))}
      </div>

      {session.notes ? (
        <div className="px-4 sm:px-6">
          <Tile>
            <TileLabel>הערות</TileLabel>
            <p className="mt-2 text-sm whitespace-pre-wrap">{session.notes}</p>
          </Tile>
        </div>
      ) : null}
    </AppShell>
  );
}

function SmallTile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <Tile size="sm" variant="gym" tone="soft">
      <TileLabel>{label}</TileLabel>
      <TileMetric value={value} unit={unit} />
    </Tile>
  );
}

function ExerciseSection({ ex }: { ex: StrengthSessionExercise }) {
  const sets = useExerciseSets(ex.id);
  const exercise = useExercise(ex.exercise_id);
  const [open, setOpen] = useState(false);
  const done = sets.filter((s) => s.completed).length;
  return (
    <div className="rounded-2xl border border-border-strong bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 p-3 text-right"
      >
        <div className="min-w-0">
          <div className="truncate text-base font-black">
            {ex.snapshot.exercise_name || exercise?.name_he || "תרגיל"}
          </div>
          <div className="text-xs text-muted-foreground">
            {done}/{sets.length} סטים · {ex.snapshot.tracking_type ?? "—"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ex.substituted_from_exercise_id ? <Chip tone="warning">הוחלף</Chip> : null}
          <ChevronDown
            className={"size-4 transition-transform " + (open ? "rotate-180" : "")}
            aria-hidden
          />
        </div>
      </button>
      {open ? (
        <div className="border-t border-border-strong">
          <table className="w-full text-sm">
            <thead className="bg-tint text-xs text-muted-foreground">
              <tr>
                <th className="p-2 text-right">#</th>
                <th className="p-2 text-right">סוג</th>
                <th className="p-2 text-right">תכנון</th>
                <th className="p-2 text-right">בפועל</th>
                <th className="p-2 text-right">RPE</th>
              </tr>
            </thead>
            <tbody>
              {sets.map((s) => (
                <tr key={s.id} className="border-t border-border-strong">
                  <td className="p-2 ltr-nums">{s.set_number}</td>
                  <td className="p-2 text-xs">{s.set_type}</td>
                  <td className="p-2 ltr-nums text-xs">
                    {s.planned_weight ?? "—"}×{s.planned_reps ?? "—"}
                  </td>
                  <td className="p-2 ltr-nums text-xs">
                    {s.actual_weight ?? "—"}×{s.actual_reps ?? "—"}{" "}
                    {s.skipped ? <Chip tone="warning">דולג</Chip> : null}
                    {!s.completed && !s.skipped ? <Chip tone="default">לא בוצע</Chip> : null}
                  </td>
                  <td className="p-2 ltr-nums text-xs">{s.rpe ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ex.notes ? (
            <div className="p-2 text-xs text-muted-foreground">הערה: {ex.notes}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
