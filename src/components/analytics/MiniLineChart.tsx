/**
 * MiniLineChart — SVG קטן ומותאם מובייל.
 * ללא ספריה חיצונית. סקאלה אוטומטית עם רצפה = min של הנתונים (לא בהכרח 0).
 * אין גלילה אופקית. יש חלופה מספרית (aria-label + טקסט מלווה).
 */
import { useMemo, useState } from "react";

export interface MiniLineChartProps {
  points: Array<{ x: string; y: number }>;
  unit?: string;
  height?: number;
  ariaLabel?: string;
}

export function MiniLineChart({ points, unit, height = 140, ariaLabel }: MiniLineChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const norm = useMemo(() => normalize(points, height), [points, height]);
  if (points.length === 0) {
    return (
      <div
        className="grid place-items-center rounded-2xl border border-dashed border-border-strong bg-surface p-6 text-sm text-muted-foreground"
        style={{ height }}
      >
        אין נתונים לגרף בטווח זה.
      </div>
    );
  }
  const label = ariaLabel ?? `גרף עם ${points.length} נקודות. ערך אחרון ${last(points)}${unit ? " " + unit : ""}.`;
  const hoverPt = hover != null ? norm.pts[hover] : null;
  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${norm.width} ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        role="img"
        aria-label={label}
        className="block"
      >
        {/* axis-baseline */}
        <line
          x1={0}
          x2={norm.width}
          y1={height - 1}
          y2={height - 1}
          className="stroke-border-strong"
          strokeWidth={1}
        />
        <path d={norm.path} fill="none" strokeWidth={2} className="stroke-primary" />
        {norm.pts.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.cx}
              cy={p.cy}
              r={hover === i ? 5 : 3}
              className={hover === i ? "fill-primary" : "fill-primary/70"}
            />
            <rect
              x={Math.max(0, p.cx - 12)}
              y={0}
              width={24}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover((prev) => (prev === i ? null : i))}
              className="cursor-pointer"
              aria-label={`נקודה ${i + 1} — ${p.y}${unit ? " " + unit : ""}`}
            />
          </g>
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {formatDate(points[0].x)} → {formatDate(points[points.length - 1].x)}
        </span>
        <span className="ltr-nums">
          {hoverPt
            ? `${formatDate(hoverPt.x)} · ${hoverPt.y}${unit ? " " + unit : ""}`
            : `${points.length} נקודות · אחרון ${last(points)}${unit ? " " + unit : ""}`}
        </span>
      </div>
    </div>
  );
}

function last(points: Array<{ y: number }>): number {
  return points[points.length - 1].y;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
}

function normalize(points: Array<{ x: string; y: number }>, height: number) {
  const width = 320;
  if (points.length === 0) return { path: "", pts: [], width };
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const pad = 12;
  const range = max - min || 1;
  const stepX = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;
  const pts = points.map((p, i) => {
    const cx = pad + i * stepX;
    const cy = height - pad - ((p.y - min) / range) * (height - pad * 2);
    return { ...p, cx, cy };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(" ");
  return { path, pts, width };
}
