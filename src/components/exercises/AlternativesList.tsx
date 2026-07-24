/**
 * AlternativesList — הצגת חלופות מדורגות לתרגיל נבחר.
 * מציג שם החלופה, סיבה מרכזית, קבוצת שריר, ציוד, זמינות והבדל מרכזי.
 * אינו מבצע החלפה — קישור בלבד.
 */
import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, ChevronLeft } from "lucide-react";
import { Tile } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import {
  AVAILABILITY_STATUS_LABEL,
  AVAILABILITY_STATUS_TONE,
  DIFFICULTY_LABEL,
  MOVEMENT_PATTERN_LABEL,
  type AlternativeScore,
  type MuscleGroup,
} from "@/lib/exercises";

export function AlternativesList({
  alternatives,
  muscleGroups,
}: {
  alternatives: AlternativeScore[];
  muscleGroups: MuscleGroup[];
}) {
  if (alternatives.length === 0) {
    return (
      <div className="tile-base p-4 text-sm text-muted-foreground">
        לא נמצאו חלופות מתאימות בקטלוג הנוכחי.
      </div>
    );
  }
  const mgById = new Map(muscleGroups.map((m) => [m.id, m]));

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {alternatives.map((alt) => {
        const primary = mgById.get(alt.exercise.primary_muscle_group_id);
        const tone = AVAILABILITY_STATUS_TONE[alt.availability.status];
        return (
          <li key={alt.exercise.id}>
            <Link
              to="/exercises/$id"
              params={{ id: alt.exercise.id }}
              className="block h-full"
              aria-label={`מעבר לתרגיל ${alt.exercise.name_he}`}
            >
              <Tile size="sm" className="h-full hover:border-primary/50">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2">
                  <div className="grid size-9 place-items-center rounded-lg bg-tint text-foreground">
                    <ArrowLeftRight aria-hidden className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{alt.exercise.name_he}</div>
                    <div className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {primary?.name_he ?? "—"}
                      <span aria-hidden> · </span>
                      {MOVEMENT_PATTERN_LABEL[alt.exercise.movement_pattern]}
                    </div>
                  </div>
                  <ChevronLeft aria-hidden className="size-4 text-muted-foreground rtl:rotate-180" />
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Chip
                    tone={
                      tone === "success"
                        ? "success"
                        : tone === "warning"
                          ? "warning"
                          : tone === "info"
                            ? "info"
                            : "default"
                    }
                  >
                    {AVAILABILITY_STATUS_LABEL[alt.availability.status]}
                  </Chip>
                  <Chip>{DIFFICULTY_LABEL[alt.exercise.difficulty]}</Chip>
                </div>
                {alt.reasons.length > 0 ? (
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                    {alt.reasons.slice(0, 2).join(" · ")}
                  </p>
                ) : null}
              </Tile>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
