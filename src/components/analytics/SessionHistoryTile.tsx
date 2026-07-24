/**
 * SessionHistoryTile — אריח יחיד להיסטוריית אימוני כוח.
 * ללא רשימה טקסטואלית ארוכה. מציג רק מדדים משמעותיים.
 */
import { Link } from "@tanstack/react-router";
import { Tile, TileLabel, TileMetric, TileFootnote, TileTrend } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import type { SessionHistoryTile as TileData } from "@/lib/analytics";
import { useLocation } from "@/lib/catalog";

const STATUS_LABEL: Record<TileData["status"], { label: string; tone: "default" | "warning" | "info" | "success" }> = {
  completed: { label: "הושלם", tone: "success" },
  in_progress: { label: "בביצוע", tone: "info" },
  paused: { label: "מושהה", tone: "warning" },
  draft: { label: "טיוטה", tone: "warning" },
  abandoned: { label: "ננטש", tone: "warning" },
  archived: { label: "בארכיון", tone: "default" },
  trashed: { label: "בסל מחזור", tone: "default" },
};

export function SessionHistoryTileCard({ tile }: { tile: TileData }) {
  const { session } = tile;
  const location = useLocation(session.location_id ?? undefined);
  const status = STATUS_LABEL[tile.status];
  const date = new Date(session.started_at);
  const durMin = session.duration_seconds ? Math.round(session.duration_seconds / 60) : null;
  const compPct = Math.round(tile.completionRate * 100);
  const delta = tile.vsPreviousSimilar;
  return (
    <Link
      to="/gym/history/$id"
      params={{ id: session.id }}
      aria-label={`אימון ${session.name}`}
      className="block"
    >
      <Tile variant="gym" tone="soft" interactive className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-base font-black">{session.name}</div>
            <TileFootnote>
              {date.toLocaleDateString("he-IL")} · {location ? location.name : "ללא מקום"}
              {durMin != null ? ` · ${durMin} דק'` : ""}
            </TileFootnote>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Chip tone={status.tone}>{status.label}</Chip>
            {tile.personalRecordsCount > 0 ? (
              <Chip tone="success">{tile.personalRecordsCount} שיאים</Chip>
            ) : null}
            {tile.supersetsCount > 0 ? <Chip tone="info">סופרסטים</Chip> : null}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="תרגילים" value={String(tile.totalExercises)} />
          <MiniStat label="סטים" value={`${tile.completedSets}/${tile.totalSets}`} />
          <MiniStat
            label="נפח"
            value={tile.totalVolumeKg > 0 ? `${tile.totalVolumeKg.toLocaleString("he-IL")}` : "—"}
            unit={tile.totalVolumeKg > 0 ? "kg" : undefined}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">שלמות: {compPct}%</div>
          {tile.qualityScore != null ? (
            <div className="text-xs">
              איכות: <span className="ltr-nums font-bold">{tile.qualityScore}</span>/100
            </div>
          ) : null}
          {delta && delta.volumeDeltaPercent != null ? (
            <TileTrend
              delta={`${delta.volumeDeltaPercent > 0 ? "+" : ""}${delta.volumeDeltaPercent}%`}
              unit="נפח"
              direction={
                delta.volumeDeltaPercent > 0.5
                  ? "up"
                  : delta.volumeDeltaPercent < -0.5
                    ? "down"
                    : "flat"
              }
            />
          ) : null}
        </div>
      </Tile>
    </Link>
  );
}

function MiniStat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl border border-border-strong bg-surface p-2">
      <TileLabel className="text-[10px]">{label}</TileLabel>
      <TileMetric className="!text-xl" value={<span className="text-xl">{value}</span>} unit={unit} />
    </div>
  );
}
