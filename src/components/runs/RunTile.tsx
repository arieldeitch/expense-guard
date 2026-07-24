/** RunTile — אריח היסטוריה עם מדדים עיקריים. */
import { Link } from "@tanstack/react-router";
import { MapPin, Timer, Activity } from "lucide-react";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import {
  RUN_TYPE_LABELS,
  RUN_STATUS_LABELS,
  formatDistanceKm,
  formatDurationHMS,
  formatPace,
} from "@/lib/runs";
import type { RunSession } from "@/lib/runs";

export function RunTile({
  run,
  locationName,
  routeName,
}: {
  run: RunSession;
  locationName?: string | null;
  routeName?: string | null;
}) {
  const date = new Date(run.started_at);
  const dateStr = date.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return (
    <Link to="/running/$id" params={{ id: run.id }} className="block">
      <Tile variant="run" tone="soft" interactive className="gap-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-run/20 px-1.5 py-0.5 font-bold text-run">
              {RUN_TYPE_LABELS[run.run_type]}
            </span>
            {run.status !== "completed" ? (
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-bold text-muted-foreground">
                {RUN_STATUS_LABELS[run.status]}
              </span>
            ) : null}
          </div>
          <span className="text-muted-foreground ltr-nums">{dateStr}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <TileLabel>מרחק</TileLabel>
            <div className="ltr-nums text-base font-black">
              {formatDistanceKm(run.distance_meters)}
              <span className="text-xs font-normal"> ק"מ</span>
            </div>
          </div>
          <div>
            <TileLabel>זמן</TileLabel>
            <div className="ltr-nums text-base font-black">
              {formatDurationHMS(run.duration_seconds)}
            </div>
          </div>
          <div>
            <TileLabel>קצב</TileLabel>
            <div className="ltr-nums text-base font-black">
              {formatPace(run.average_pace_s_per_km)}
              <span className="text-xs font-normal"> /ק"מ</span>
            </div>
          </div>
        </div>
        {locationName || routeName || run.free_text_location ? (
          <TileFootnote className="flex items-center gap-1">
            <MapPin className="size-3" />
            {locationName || routeName || run.free_text_location}
          </TileFootnote>
        ) : null}
      </Tile>
    </Link>
  );
}
