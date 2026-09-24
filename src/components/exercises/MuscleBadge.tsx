/**
 * MuscleBadge — a thumb-sized version of the muscle map for LISTS and cards (ADR-0046).
 *
 * `MuscleMap` (front + back + legend) is the right thing on an exercise detail page, but it is
 * far too tall for a picker row. This badge draws one small front silhouette with the worked
 * region highlighted, so the person can see "where this lands" while scanning the bank.
 *
 * Same taxonomy as the rest of the catalogue (`BodyRegion`), original SVG, no external asset,
 * works offline. Decorative: the exercise name next to it stays the source of truth, and the
 * whole thing carries one aria-label instead of exposing every shape.
 */
import type { BodyRegion } from "@/lib/exercises";
import { cn } from "@/lib/utils";

export const BODY_REGION_LABELS: Record<BodyRegion, string> = {
  chest: "חזה",
  back: "גב",
  shoulders: "כתפיים",
  arms: "ידיים",
  core: "בטן וליבה",
  glutes: "ישבן",
  legs: "רגליים",
  calves: "תאומים",
  full_body: "גוף מלא",
  custom: "אחר",
};

/** Each region as one simple shape on a 60×120 front silhouette. */
const SHAPES: Record<BodyRegion, React.ReactNode> = {
  chest: <rect x="18" y="27" width="24" height="10" rx="3" />,
  back: <rect x="17" y="26" width="26" height="14" rx="4" />,
  shoulders: (
    <>
      <circle cx="16" cy="28" r="5" />
      <circle cx="44" cy="28" r="5" />
    </>
  ),
  arms: (
    <>
      <rect x="9" y="33" width="6" height="18" rx="3" />
      <rect x="45" y="33" width="6" height="18" rx="3" />
    </>
  ),
  core: <rect x="21" y="39" width="18" height="18" rx="4" />,
  glutes: <rect x="19" y="58" width="22" height="10" rx="5" />,
  legs: (
    <>
      <rect x="19" y="61" width="9" height="27" rx="4" />
      <rect x="32" y="61" width="9" height="27" rx="4" />
    </>
  ),
  calves: (
    <>
      <rect x="20" y="90" width="7" height="18" rx="3" />
      <rect x="33" y="90" width="7" height="18" rx="3" />
    </>
  ),
  full_body: <rect x="15" y="24" width="30" height="86" rx="12" />,
  custom: <circle cx="30" cy="45" r="8" />,
};

export function MuscleBadge({
  primary,
  secondary = [],
  className,
  height = 46,
  decorative = false,
}: {
  primary: BodyRegion | null;
  secondary?: BodyRegion[];
  className?: string;
  height?: number;
  /**
   * Inside a row or button that already names the exercise, the drawing repeats information
   * and only lengthens the accessible name — hide it from assistive tech there.
   */
  decorative?: boolean;
}) {
  const parts = [
    primary ? `שריר עיקרי: ${BODY_REGION_LABELS[primary]}` : "",
    secondary.length ? `משני: ${secondary.map((r) => BODY_REGION_LABELS[r]).join(", ")}` : "",
  ].filter(Boolean);
  return (
    <svg
      viewBox="0 0 60 120"
      height={height}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : parts.join(" · ") || "מפת שרירים"}
      className={cn("shrink-0", className)}
    >
      <g fill="currentColor" className="text-muted-foreground/25">
        <circle cx="30" cy="12" r="7" />
        <rect x="17" y="22" width="26" height="38" rx="8" />
        <rect x="8" y="27" width="7" height="30" rx="3" />
        <rect x="45" y="27" width="7" height="30" rx="3" />
        <rect x="19" y="60" width="9" height="50" rx="4" />
        <rect x="32" y="60" width="9" height="50" rx="4" />
      </g>
      {secondary.length ? (
        <g fill="currentColor" className="text-primary/40">
          {secondary.map((region) => (
            <g key={`s-${region}`}>{SHAPES[region]}</g>
          ))}
        </g>
      ) : null}
      {primary ? (
        <g fill="currentColor" className="text-run">
          {SHAPES[primary]}
        </g>
      ) : null}
    </svg>
  );
}
