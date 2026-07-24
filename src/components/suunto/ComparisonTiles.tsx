/**
 * ComparisonTiles — אריחי השוואה אנכיים בין שני מקורות.
 * מובייל: אריח לכל metric, כל אריח מציג ערך של כל מקור + הפרש + %.
 * כיוון תמיד: מקור-בסיס (first) → נגד (second). Suunto = second בברירת מחדל.
 * מלבד צבע יש גם חץ, תווית וסימון מקור טקסטואלי.
 */
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { cn } from "@/lib/utils";
import { formatDurationHMS, formatPace, formatDistanceKm, formatSpeed } from "@/lib/runs";
import type { ComparisonResult, MetricComparison } from "@/lib/suunto";

function formatByMetric(metric: string, v: number | null): string {
  if (v == null) return "–";
  switch (metric) {
    case "distance_meters":
      return `${formatDistanceKm(v)} ק"מ`;
    case "duration_seconds":
      return formatDurationHMS(v);
    case "average_pace_s_per_km":
      return `${formatPace(v)} /ק"מ`;
    case "average_speed_kmh":
      return `${formatSpeed(v)} קמ"ש`;
    default:
      return `${Math.round(v * 100) / 100}`;
  }
}
function formatDiffByMetric(metric: string, v: number | null): string {
  if (v == null) return "–";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  const abs = Math.abs(v);
  switch (metric) {
    case "distance_meters":
      return `${sign}${(abs / 1000).toFixed(2)} ק"מ`;
    case "duration_seconds":
      return `${sign}${formatDurationHMS(abs)}`;
    case "average_pace_s_per_km":
      return `${sign}${formatPace(abs)}`;
    case "average_speed_kmh":
      return `${sign}${abs.toFixed(1)} קמ"ש`;
    default:
      return `${sign}${abs.toFixed(2)}`;
  }
}

function DiffArrow({ dir }: { dir: MetricComparison["direction"] }) {
  const cls = "size-3.5";
  if (dir === "second_greater") return <ArrowUp aria-label="שני גדול יותר" className={cls} />;
  if (dir === "first_greater") return <ArrowDown aria-label="ראשון גדול יותר" className={cls} />;
  if (dir === "equal") return <Minus aria-label="שווה" className={cls} />;
  return null;
}

export function ComparisonTiles({ result }: { result: ComparisonResult }) {
  const primary = [
    "distance_meters",
    "duration_seconds",
    "average_pace_s_per_km",
    "average_speed_kmh",
  ];
  const primaryMetrics = result.metrics.filter((m) => primary.includes(m.metric));
  const secondary = result.metrics.filter(
    (m) => !primary.includes(m.metric) && (m.first_value != null || m.second_value != null),
  );

  return (
    <div className="flex flex-col gap-3">
      <Tile variant="info" tone="soft" size="sm">
        <TileLabel>סיכום פער</TileLabel>
        <div className="mt-1 text-sm font-bold">{result.summary}</div>
        <TileFootnote>
          {result.first_label} מול {result.second_label}
        </TileFootnote>
      </Tile>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {primaryMetrics.map((m) => (
          <MetricCard
            key={m.metric}
            m={m}
            first={result.first_label}
            second={result.second_label}
          />
        ))}
      </div>

      {secondary.length > 0 ? (
        <>
          <div className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            מדדים נוספים
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {secondary.map((m) => (
              <MetricCard
                key={m.metric}
                m={m}
                first={result.first_label}
                second={result.second_label}
                compact
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function MetricCard({
  m,
  first,
  second,
  compact,
}: {
  m: MetricComparison;
  first: string;
  second: string;
  compact?: boolean;
}) {
  const has = m.first_value != null && m.second_value != null;
  return (
    <Tile size={compact ? "sm" : "md"} className="gap-2">
      <div className="flex items-center justify-between">
        <TileLabel>{m.label}</TileLabel>
        {has ? (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold",
              m.direction === "second_greater" && "bg-info-soft text-info-foreground",
              m.direction === "first_greater" && "bg-warning-soft text-warning-foreground",
              m.direction === "equal" && "bg-tint text-muted-foreground",
            )}
          >
            <DiffArrow dir={m.direction} />
            {formatDiffByMetric(m.metric, m.diff)}
            {m.diff_percent != null ? (
              <span className="opacity-80">
                ({m.diff_percent >= 0 ? "+" : "−"}
                {Math.abs(m.diff_percent).toFixed(1)}%)
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SourceValue label={first} value={formatByMetric(m.metric, m.first_value)} />
        <SourceValue label={second} value={formatByMetric(m.metric, m.second_value)} highlight />
      </div>
      <TileFootnote>{m.explanation}</TileFootnote>
    </Tile>
  );
}

function SourceValue({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-2 py-1.5",
        highlight ? "border-primary/40 bg-primary/5" : "border-border bg-tint/60",
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="ltr-nums text-sm font-bold">{value}</div>
    </div>
  );
}
