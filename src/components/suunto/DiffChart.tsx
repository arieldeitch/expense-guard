/**
 * DiffChart — גרף פשוט של הפער באחוזים לפי תאריך, SVG בלבד.
 * מובייל: viewBox עם רספונסיביות מלאה. אין גלילה אופקית. ללא ספרייה.
 */
import { useMemo } from "react";

export interface DiffPoint {
  run_id: string;
  date: string; // ISO
  diff_percent: number;
  is_outlier: boolean;
}

export function DiffChart({ points, height = 160 }: { points: DiffPoint[]; height?: number }) {
  const sorted = useMemo(
    () => points.slice().sort((a, b) => a.date.localeCompare(b.date)),
    [points],
  );

  if (sorted.length === 0) {
    return <div className="text-sm text-muted-foreground">אין נתונים להצגת גרף.</div>;
  }
  if (sorted.length === 1) {
    return (
      <div className="text-sm text-muted-foreground">
        יש נקודה אחת בלבד ({sorted[0].diff_percent.toFixed(1)}%). דרושות עוד ריצות למגמה.
      </div>
    );
  }

  const width = 600;
  const padding = { t: 10, r: 10, b: 22, l: 30 };
  const innerW = width - padding.l - padding.r;
  const innerH = height - padding.t - padding.b;

  const values = sorted.map((p) => p.diff_percent);
  const rawMax = Math.max(...values, 0);
  const rawMin = Math.min(...values, 0);
  const pad = Math.max(1, (rawMax - rawMin) * 0.1);
  const yMax = rawMax + pad;
  const yMin = rawMin - pad;
  const yRange = yMax - yMin || 1;

  const x = (i: number) => (sorted.length === 1 ? innerW / 2 : (i / (sorted.length - 1)) * innerW);
  const y = (v: number) => innerH - ((v - yMin) / yRange) * innerH;

  const zeroY = y(0);
  const path = sorted
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.diff_percent).toFixed(1)}`)
    .join(" ");

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        role="img"
        aria-label={`גרף פער באחוזים על פני ${sorted.length} ריצות`}
      >
        <g transform={`translate(${padding.l},${padding.t})`}>
          {/* zero line */}
          <line
            x1={0}
            x2={innerW}
            y1={zeroY}
            y2={zeroY}
            stroke="currentColor"
            strokeOpacity={0.45}
            strokeDasharray="4 4"
          />
          {/* axis min/max labels */}
          <text x={-4} y={0} textAnchor="end" fontSize={10} fill="currentColor" opacity={0.6}>
            {yMax.toFixed(0)}%
          </text>
          <text x={-4} y={innerH} textAnchor="end" fontSize={10} fill="currentColor" opacity={0.6}>
            {yMin.toFixed(0)}%
          </text>
          <text
            x={-4}
            y={zeroY + 3}
            textAnchor="end"
            fontSize={10}
            fill="currentColor"
            opacity={0.6}
          >
            0
          </text>

          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="text-primary"
          />
          {sorted.map((p, i) => (
            <g key={p.run_id} transform={`translate(${x(i)},${y(p.diff_percent)})`}>
              <circle
                r={p.is_outlier ? 5 : 3.5}
                className={p.is_outlier ? "fill-warning" : "fill-primary"}
              />
              <title>
                {new Date(p.date).toLocaleDateString("he-IL")}: {p.diff_percent.toFixed(1)}%
                {p.is_outlier ? " (חריגה)" : ""}
              </title>
            </g>
          ))}

          {/* x labels — first, mid, last */}
          {[0, Math.floor(sorted.length / 2), sorted.length - 1].map((i, k) => (
            <text
              key={k}
              x={x(i)}
              y={innerH + 14}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              opacity={0.6}
            >
              {new Date(sorted[i].date).toLocaleDateString("he-IL", {
                day: "2-digit",
                month: "2-digit",
              })}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}
