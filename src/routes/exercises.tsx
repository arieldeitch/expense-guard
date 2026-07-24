/**
 * /exercises — ספריית תרגילים.
 * חיפוש בשורה עליונה, פילטרים ב־Sheet אנכי, אריחים ב־grid.
 * כפתור "תרגיל חדש" יוצר תרגיל אישי; שכפול/עריכה זמינים מכל אריח.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, Filter, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExerciseTile } from "@/components/exercises/ExerciseTile";
import { ExerciseForm } from "@/components/exercises/ExerciseForm";
import {
  ExerciseFiltersSheet,
  exerciseFiltersActiveCount,
} from "@/components/exercises/ExerciseFiltersSheet";
import {
  EMPTY_EXERCISE_FILTERS,
  filterExercises,
  getExerciseAvailability,
  useAllExercises,
  useMuscleGroups,
  type ExerciseFilters,
  type Exercise,
} from "@/lib/exercises";
import { useAllLocations, useEquipmentInLocation } from "@/lib/catalog";

export const Route = createFileRoute("/exercises")({
  head: () => ({
    meta: [
      { title: "ספריית תרגילים · Fit Log" },
      {
        name: "description",
        content: "ספריית תרגילי כוח: חדר כושר, בית, משקל גוף. חיפוש, סינון, מותאמים אישית.",
      },
      { property: "og:title", content: "ספריית תרגילים · Fit Log" },
      {
        property: "og:description",
        content: "ניהול תרגילים לאימוני כוח בחדר, בבית ובמשקל גוף.",
      },
    ],
  }),
  component: ExercisesPage,
});

function ExercisesPage() {
  const all = useAllExercises();
  const muscleGroups = useMuscleGroups();
  const locations = useAllLocations();

  const [filters, setFilters] = useState<ExerciseFilters>(EMPTY_EXERCISE_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const locationEquipment = useEquipmentInLocation(filters.onlyAvailableInLocation ?? "");

  const filtered = useMemo(
    () =>
      filterExercises({
        exercises: all,
        filters,
        locationEquipment: filters.onlyAvailableInLocation ? locationEquipment : undefined,
      }),
    [all, filters, locationEquipment],
  );

  const activeCount = exerciseFiltersActiveCount(filters);
  const mgById = useMemo(() => new Map(muscleGroups.map((m) => [m.id, m])), [muscleGroups]);
  const trashCount = useMemo(() => all.filter((e) => e.deleted_at !== null).length, [all]);

  const availabilitySnapshot = filters.onlyAvailableInLocation
    ? { locationId: filters.onlyAvailableInLocation, items: locationEquipment }
    : null;

  return (
    <AppShell topBar={{ title: "תרגילים", back: { to: "/gym" } }}>
      <PageHeader
        eyebrow="ספרייה"
        title="תרגילים"
        description="חדר כושר · בית · משקל גוף. מותאמים אישית לציוד שברשותך."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="min-h-11 rounded-xl bg-primary text-primary-foreground"
          >
            <Plus aria-hidden className="me-1 size-4" />
            תרגיל חדש
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-6">
        <Input
          value={filters.query}
          onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
          placeholder="חיפוש לפי שם, alias או קבוצת שריר"
          className="min-h-11 rounded-xl border-border-strong"
          aria-label="חיפוש תרגילים"
        />
        <Button
          variant="outline"
          onClick={() => setFiltersOpen(true)}
          className="min-h-11 rounded-xl border-border-strong"
        >
          <Filter aria-hidden className="me-1 size-4" />
          סינון{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        {filtered.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState
              icon={<Dumbbell aria-hidden />}
              title={
                filters.query || activeCount > 0 ? "לא נמצאו תרגילים תואמים" : "אין עדיין תרגילים"
              }
              description={
                filters.query || activeCount > 0
                  ? "נסה חיפוש אחר, הרחב פילטרים או שנה את המקום שנבחר."
                  : "צור תרגיל ראשון או המתן לטעינת קטלוג ברירת מחדל."
              }
              action={
                <Button
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                  className="min-h-11 rounded-xl bg-primary text-primary-foreground"
                >
                  יצירת תרגיל חדש
                </Button>
              }
            />
          </div>
        ) : (
          filtered.map((e) => (
            <ExerciseTile
              key={e.id}
              exercise={e}
              primaryMuscle={mgById.get(e.primary_muscle_group_id) ?? null}
              availability={
                availabilitySnapshot ? getExerciseAvailability(e, availabilitySnapshot) : null
              }
              onEdit={(ex) => {
                setEditing(ex);
                setFormOpen(true);
              }}
            />
          ))
        )}
      </div>

      {trashCount > 0 ? (
        <div className="mt-6 px-4 sm:px-6">
          <Link
            to="/trash"
            className="tile-interactive inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            <Trash2 aria-hidden className="size-4" />
            סל מחזור ({trashCount} תרגילים)
          </Link>
        </div>
      ) : null}

      <ExerciseFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onFiltersChange={setFilters}
        muscleGroups={muscleGroups}
        locations={locations}
      />

      <ExerciseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        exercise={editing}
        muscleGroups={muscleGroups}
      />
    </AppShell>
  );
}
