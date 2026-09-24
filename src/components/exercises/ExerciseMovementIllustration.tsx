/**
 * ExerciseMovementIllustration — "התחלה → סיום" for the common home movements (ADR-0046).
 *
 * Two stick poses side by side, drawn from one shared figure primitive, keyed by a
 * `movementIllustration` id that lives in the exercise metadata. Original SVG, no animation,
 * no external asset; a missing key simply renders nothing so the card still works.
 */
import { Fragment } from "react";
import { cn } from "@/lib/utils";

export type MovementKey =
  | "push-up"
  | "diamond-push-up"
  | "wide-push-up"
  | "crunch"
  | "dumbbell-curl"
  | "shoulder-press"
  | "triceps-extension"
  | "floor-press"
  | "row"
  | "jump-rope";

/** One figure: head, torso, arms and legs are given as polylines so each pose is a few points. */
function Figure({
  arms,
  legs,
  torso = "50,30 50,62",
  head = { cx: 50, cy: 22, r: 7 },
  load,
}: {
  arms: string;
  legs: string;
  torso?: string;
  head?: { cx: number; cy: number; r: number };
  /** Small squares for the dumbbells, when the movement holds one. */
  load?: { x: number; y: number }[];
}) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={4}>
      <circle cx={head.cx} cy={head.cy} r={head.r} className="stroke-current" />
      <polyline points={torso} className="stroke-current" />
      <polyline points={arms} className="stroke-current" />
      <polyline points={legs} className="stroke-current" />
      {load?.map((l, i) => (
        <rect
          key={i}
          x={l.x - 4}
          y={l.y - 3}
          width={8}
          height={6}
          rx={1.5}
          className="fill-current stroke-none opacity-80"
        />
      ))}
    </g>
  );
}

type Pose = { start: React.ReactNode; end: React.ReactNode };

const POSES: Record<MovementKey, Pose> = {
  "push-up": {
    start: (
      <Figure
        head={{ cx: 20, cy: 46, r: 6 }}
        torso="26,50 74,62"
        arms="30,50 30,72 30,50"
        legs="74,62 92,70"
      />
    ),
    end: (
      <Figure
        head={{ cx: 20, cy: 58, r: 6 }}
        torso="26,62 74,70"
        arms="30,62 34,72 30,62"
        legs="74,70 92,76"
      />
    ),
  },
  "diamond-push-up": {
    start: (
      <Figure
        head={{ cx: 20, cy: 46, r: 6 }}
        torso="26,50 74,62"
        arms="30,50 26,72 30,50"
        legs="74,62 92,70"
      />
    ),
    end: (
      <Figure
        head={{ cx: 20, cy: 58, r: 6 }}
        torso="26,62 74,70"
        arms="30,62 28,72 30,62"
        legs="74,70 92,76"
      />
    ),
  },
  "wide-push-up": {
    start: (
      <Figure
        head={{ cx: 20, cy: 46, r: 6 }}
        torso="26,50 74,62"
        arms="30,50 14,72 30,50 46,72"
        legs="74,62 92,70"
      />
    ),
    end: (
      <Figure
        head={{ cx: 20, cy: 58, r: 6 }}
        torso="26,62 74,70"
        arms="30,62 12,74 30,62 48,74"
        legs="74,70 92,76"
      />
    ),
  },
  crunch: {
    start: (
      <Figure
        head={{ cx: 22, cy: 56, r: 6 }}
        torso="28,60 60,72"
        arms="28,60 30,70"
        legs="60,72 76,54 92,72"
      />
    ),
    end: (
      <Figure
        head={{ cx: 34, cy: 44, r: 6 }}
        torso="40,50 60,72"
        arms="40,50 44,62"
        legs="60,72 76,54 92,72"
      />
    ),
  },
  "dumbbell-curl": {
    start: <Figure arms="36,44 30,74" legs="50,62 38,92 50,62 62,92" load={[{ x: 30, y: 74 }]} />,
    end: (
      <Figure arms="36,44 44,52 38,38" legs="50,62 38,92 50,62 62,92" load={[{ x: 38, y: 38 }]} />
    ),
  },
  "shoulder-press": {
    start: <Figure arms="36,44 28,38" legs="50,62 38,92 50,62 62,92" load={[{ x: 28, y: 38 }]} />,
    end: <Figure arms="36,44 32,16" legs="50,62 38,92 50,62 62,92" load={[{ x: 32, y: 14 }]} />,
  },
  "triceps-extension": {
    start: (
      <Figure arms="38,44 46,20 54,34" legs="50,62 38,92 50,62 62,92" load={[{ x: 54, y: 34 }]} />
    ),
    end: <Figure arms="38,44 46,20 50,8" legs="50,62 38,92 50,62 62,92" load={[{ x: 50, y: 8 }]} />,
  },
  "floor-press": {
    start: (
      <Figure
        head={{ cx: 18, cy: 60, r: 6 }}
        torso="24,64 70,64"
        arms="34,64 34,50"
        legs="70,64 84,48 92,64"
        load={[{ x: 34, y: 48 }]}
      />
    ),
    end: (
      <Figure
        head={{ cx: 18, cy: 60, r: 6 }}
        torso="24,64 70,64"
        arms="34,64 34,34"
        legs="70,64 84,48 92,64"
        load={[{ x: 34, y: 32 }]}
      />
    ),
  },
  row: {
    start: (
      <Figure
        head={{ cx: 30, cy: 34, r: 6 }}
        torso="36,40 70,52"
        arms="44,44 44,76"
        legs="70,52 70,92"
        load={[{ x: 44, y: 76 }]}
      />
    ),
    end: (
      <Figure
        head={{ cx: 30, cy: 34, r: 6 }}
        torso="36,40 70,52"
        arms="44,44 46,58 60,50"
        legs="70,52 70,92"
        load={[{ x: 60, y: 50 }]}
      />
    ),
  },
  "jump-rope": {
    start: <Figure arms="38,44 28,56 38,44 62,56" legs="50,62 44,92 50,62 56,92" />,
    end: <Figure arms="38,42 30,28 38,42 60,28" legs="50,60 44,84 50,60 56,84" />,
  },
};

const PHASE_LABEL: Record<"start" | "end", string> = { start: "התחלה", end: "סיום" };

export function ExerciseMovementIllustration({
  movement,
  className,
  height = 74,
  decorative = false,
}: {
  movement: MovementKey | null | undefined;
  className?: string;
  height?: number;
  /** Inside a button that already names the exercise, the preview is decorative. */
  decorative?: boolean;
}) {
  if (!movement || !POSES[movement]) return null;
  const pose = POSES[movement];
  // In a list row the two poses speak for themselves; captions at that size are unreadable
  // noise, so they appear only in the full-size variant on a detail screen.
  const showCaptions = !decorative;
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "איור התנועה: מצב התחלה ומצב סיום"}
    >
      {(["start", "end"] as const).map((phase, index) => (
        <Fragment key={phase}>
          {index === 1 ? (
            <span aria-hidden className="text-[10px] text-muted-foreground">
              ←
            </span>
          ) : null}
          <figure className="flex-1 rounded-lg border border-border bg-surface/60 p-0.5">
            <svg viewBox="0 0 100 100" height={height} className="w-full text-foreground/75">
              {pose[phase]}
            </svg>
            {showCaptions ? (
              <figcaption className="text-center text-[10px] text-muted-foreground">
                {PHASE_LABEL[phase]}
              </figcaption>
            ) : null}
          </figure>
        </Fragment>
      ))}
    </div>
  );
}

/** Metadata mapping: exercise slug → movement illustration. Unknown slugs render nothing. */
export const MOVEMENT_BY_SLUG: Record<string, MovementKey> = {
  "push-ups": "push-up",
  "knee-push-ups": "push-up",
  "incline-push-ups": "push-up",
  "close-grip-push-ups": "diamond-push-up",
  "diamond-push-ups": "diamond-push-up",
  "wide-push-ups": "wide-push-up",
  crunches: "crunch",
  "sit-ups": "crunch",
  "reverse-crunches": "crunch",
  "dumbbell-bicep-curls": "dumbbell-curl",
  "seated-dumbbell-shoulder-press": "shoulder-press",
  "overhead-triceps-extension": "triceps-extension",
  "dumbbell-floor-press": "floor-press",
  "single-arm-dumbbell-row": "row",
  "band-row": "row",
  "jump-rope": "jump-rope",
};

export function movementForSlug(slug: string | null | undefined): MovementKey | null {
  if (!slug) return null;
  return MOVEMENT_BY_SLUG[slug] ?? null;
}
