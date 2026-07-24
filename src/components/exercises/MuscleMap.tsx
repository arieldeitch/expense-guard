/**
 * MuscleMap — איור סכמטי מקורי של קידמת/אחורית הגוף.
 * מפורק ל־regions פשוטים (SVG paths/rects). קבוצת שריר ראשית מודגשת;
 * משניות מודגשות בעדינות. הצבע אינו האמצעי היחיד — לצדו legend + labels.
 *
 * זהו נכס מקורי, אין תלות בקובץ חיצוני / תמונה מוגנת.
 */
import type { BodyRegion } from "@/lib/exercises";

type Highlight = "primary" | "secondary" | "none";

interface Props {
  primaryRegion: BodyRegion | null;
  secondaryRegions: BodyRegion[];
  /** גודל לוגי — נמתח ב־responsive. */
  className?: string;
}

const PRIMARY_FILL = "oklch(0.78 0.16 55)";
const SECONDARY_FILL = "oklch(0.75 0.13 210)";
const IDLE_FILL = "oklch(0.32 0.02 260)";
const OUTLINE = "oklch(0.5 0.02 260)";

export function MuscleMap({ primaryRegion, secondaryRegions, className }: Props) {
  function color(region: BodyRegion): string {
    if (region === primaryRegion) return PRIMARY_FILL;
    if (secondaryRegions.includes(region)) return SECONDARY_FILL;
    return IDLE_FILL;
  }
  function highlight(region: BodyRegion): Highlight {
    if (region === primaryRegion) return "primary";
    if (secondaryRegions.includes(region)) return "secondary";
    return "none";
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3">
        <BodyView side="front" color={color} highlight={highlight} label="קדמי" />
        <BodyView side="back" color={color} highlight={highlight} label="אחורי" />
      </div>
      <Legend
        primary={primaryRegion}
        secondaries={secondaryRegions}
      />
    </div>
  );
}

function BodyView({
  side,
  color,
  highlight,
  label,
}: {
  side: "front" | "back";
  color: (r: BodyRegion) => string;
  highlight: (r: BodyRegion) => Highlight;
  label: string;
}) {
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 200" aria-label={`מפת שרירים ${label}`} className="h-56 w-full max-w-32">
        {/* silhouette */}
        <path
          d="M50 8 c9 0 15 7 15 16 c0 6 -2 10 -6 13 c8 3 14 10 15 20 l3 22 c0 3 -2 5 -5 5 h-2 l3 44 c1 6 -2 10 -6 12 l2 40 c0 3 -3 5 -6 5 h-6 l-2 -38 h-4 l-2 38 h-6 c-3 0 -6 -2 -6 -5 l2 -40 c-4 -2 -7 -6 -6 -12 l3 -44 h-2 c-3 0 -5 -2 -5 -5 l3 -22 c1 -10 7 -17 15 -20 c-4 -3 -6 -7 -6 -13 c0 -9 6 -16 15 -16 z"
          fill="oklch(0.24 0.02 260)"
          stroke={OUTLINE}
          strokeWidth={0.6}
        />

        {side === "front" ? (
          <>
            {/* chest */}
            <Rect x={30} y={45} w={40} h={16} r={4} region="chest" color={color} highlight={highlight} />
            {/* shoulders */}
            <Circle cx={26} cy={45} r={7} region="shoulders" color={color} highlight={highlight} />
            <Circle cx={74} cy={45} r={7} region="shoulders" color={color} highlight={highlight} />
            {/* arms (biceps) */}
            <Rect x={17} y={55} w={9} h={26} r={4} region="arms" color={color} highlight={highlight} />
            <Rect x={74} y={55} w={9} h={26} r={4} region="arms" color={color} highlight={highlight} />
            {/* forearms */}
            <Rect x={16} y={82} w={9} h={22} r={4} region="arms" color={color} highlight={highlight} opacity={0.85} />
            <Rect x={75} y={82} w={9} h={22} r={4} region="arms" color={color} highlight={highlight} opacity={0.85} />
            {/* core */}
            <Rect x={35} y={64} w={30} h={30} r={4} region="core" color={color} highlight={highlight} />
            {/* quads */}
            <Rect x={31} y={100} w={16} h={44} r={5} region="legs" color={color} highlight={highlight} />
            <Rect x={53} y={100} w={16} h={44} r={5} region="legs" color={color} highlight={highlight} />
            {/* calves (below knee) */}
            <Rect x={33} y={148} w={12} h={30} r={4} region="calves" color={color} highlight={highlight} />
            <Rect x={55} y={148} w={12} h={30} r={4} region="calves" color={color} highlight={highlight} />
          </>
        ) : (
          <>
            {/* upper back (traps + back) */}
            <Rect x={28} y={40} w={44} h={16} r={4} region="back" color={color} highlight={highlight} />
            {/* lats */}
            <Rect x={26} y={56} w={48} h={22} r={6} region="back" color={color} highlight={highlight} opacity={0.85} />
            {/* rear delts */}
            <Circle cx={26} cy={46} r={6} region="shoulders" color={color} highlight={highlight} />
            <Circle cx={74} cy={46} r={6} region="shoulders" color={color} highlight={highlight} />
            {/* triceps */}
            <Rect x={17} y={55} w={9} h={30} r={4} region="arms" color={color} highlight={highlight} />
            <Rect x={74} y={55} w={9} h={30} r={4} region="arms" color={color} highlight={highlight} />
            {/* low back */}
            <Rect x={38} y={80} w={24} h={12} r={3} region="back" color={color} highlight={highlight} opacity={0.9} />
            {/* glutes */}
            <Rect x={31} y={94} w={38} h={16} r={8} region="glutes" color={color} highlight={highlight} />
            {/* hamstrings */}
            <Rect x={31} y={112} w={16} h={34} r={5} region="legs" color={color} highlight={highlight} />
            <Rect x={53} y={112} w={16} h={34} r={5} region="legs" color={color} highlight={highlight} />
            {/* calves */}
            <Rect x={33} y={148} w={12} h={30} r={4} region="calves" color={color} highlight={highlight} />
            <Rect x={55} y={148} w={12} h={30} r={4} region="calves" color={color} highlight={highlight} />
          </>
        )}
      </svg>
      <figcaption className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </figcaption>
    </figure>
  );
}

function Rect({
  x,
  y,
  w,
  h,
  r,
  region,
  color,
  highlight,
  opacity = 1,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  region: BodyRegion;
  color: (r: BodyRegion) => string;
  highlight: (r: BodyRegion) => Highlight;
  opacity?: number;
}) {
  const stroke = highlight(region) !== "none" ? "oklch(0.95 0.02 260)" : OUTLINE;
  const strokeWidth = highlight(region) === "primary" ? 1.5 : 0.5;
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={r}
      ry={r}
      fill={color(region)}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
    />
  );
}

function Circle({
  cx,
  cy,
  r,
  region,
  color,
  highlight,
}: {
  cx: number;
  cy: number;
  r: number;
  region: BodyRegion;
  color: (r: BodyRegion) => string;
  highlight: (r: BodyRegion) => Highlight;
}) {
  const stroke = highlight(region) !== "none" ? "oklch(0.95 0.02 260)" : OUTLINE;
  const strokeWidth = highlight(region) === "primary" ? 1.5 : 0.5;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={color(region)}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}

function Legend({
  primary,
  secondaries,
}: {
  primary: BodyRegion | null;
  secondaries: BodyRegion[];
}) {
  const REGION_LABELS: Record<BodyRegion, string> = {
    chest: "חזה",
    back: "גב",
    shoulders: "כתפיים",
    arms: "ידיים",
    core: "בטן וליבה",
    glutes: "ישבן",
    legs: "רגליים",
    calves: "תאומים",
    full_body: "גוף מלא",
    custom: "מותאם אישית",
  };
  return (
    <ul className="mt-3 flex flex-wrap gap-2 text-[11px]" aria-label="מקרא">
      {primary ? (
        <li className="inline-flex items-center gap-1.5 rounded-md border border-run/60 bg-run-soft/40 px-2 py-1 font-bold text-foreground">
          <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: PRIMARY_FILL }} />
          ראשי: {REGION_LABELS[primary]}
        </li>
      ) : null}
      {secondaries.map((r) => (
        <li
          key={r}
          className="inline-flex items-center gap-1.5 rounded-md border border-gym/60 bg-gym-soft/40 px-2 py-1 font-semibold text-foreground"
        >
          <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: SECONDARY_FILL }} />
          משני: {REGION_LABELS[r]}
        </li>
      ))}
    </ul>
  );
}
