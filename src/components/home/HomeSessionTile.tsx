/**
 * HomeSessionTile — אריח לרשומת אימון בהיסטוריה.
 */
import { Link } from "@tanstack/react-router";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import type { HomeSession } from "@/lib/home";
import { cn } from "@/lib/utils";

interface Props {
  session: HomeSession;
  primaryLabel: string;
  totalReps: number;
  totalSets: number;
  totalExercises: number;
  durationSeconds: number | null;
  recordsCount: number;
}

export function HomeSessionTile({
  session,
  primaryLabel,
  totalReps,
  totalSets,
  totalExercises,
  durationSeconds,
  recordsCount,
}: Props) {
  const date = new Date(session.started_at);
  const dateStr = date.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  return (
    <Link
      to="/home/history/$id"
      params={{ id: session.id }}
      className="block focus-visible:rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <Tile variant="home" tone="soft" interactive>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <TileLabel>{dateStr}</TileLabel>
            <div className="truncate text-base font-black">{primaryLabel}</div>
          </div>
          {recordsCount > 0 ? (
            <div className="shrink-0 rounded-full bg-goal-soft px-2 py-0.5 text-[10px] font-black text-goal">
              {recordsCount} שיא{recordsCount === 1 ? "" : "ים"}
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-4 gap-2 pt-1">
          <Stat label="תרגילים" value={totalExercises} />
          <Stat label="סטים" value={totalSets} />
          <Stat label="חזרות" value={totalReps} />
          <Stat
            label="משך"
            value={durationSeconds ? formatDuration(durationSeconds) : "–"}
          />
        </div>
        {session.status === "partial" ? (
          <TileFootnote className={cn("text-warning")}>אימון חלקי</TileFootnote>
        ) : null}
      </Tile>
    </Link>
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

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}ד׳`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h}ש׳ ${r}ד׳`;
}
