/**
 * HomeExerciseAdder — "הוסף תרגיל" for the home flows (ADR-0045/0046).
 *
 * Two taps to an exercise, never one long flat list:
 *   ציוד (משקל גוף · דאמבלים · חבל)  →  [דאמבלים only] קבוצת שרירים  →  תרגיל
 * The most common exercise of each muscle group is listed first, each row carries a small
 * muscle badge, and the start/end movement illustration is shown when we have one.
 */
import { useMemo, useState } from "react";
import { ChevronRight, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MuscleBadge } from "@/components/exercises/MuscleBadge";
import {
  ExerciseMovementIllustration,
  movementForSlug,
} from "@/components/exercises/ExerciseMovementIllustration";
import { useAllExercises, useMuscleGroups } from "@/lib/exercises";
import type { Exercise } from "@/lib/exercises";
import {
  DUMBBELL_GROUPS,
  HOME_BANK_CATEGORIES,
  bankCategoryCount,
  bodyRegionOfExercise,
  bodyweightExercises,
  dumbbellExercisesForGroup,
  ropeExercises,
  type DumbbellGroupDef,
  type HomeBankCategory,
} from "@/lib/exercises/homeBank";
import { cn } from "@/lib/utils";

export function HomeExerciseAdder({ onPick }: { onPick: (exerciseId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<HomeBankCategory | null>(null);
  const [group, setGroup] = useState<DumbbellGroupDef | null>(null);
  const [query, setQuery] = useState("");
  const all = useAllExercises();
  const muscleGroups = useMuscleGroups();

  const idByCode = useMemo(() => {
    const map = new Map(muscleGroups.map((m) => [m.code, m.id]));
    return (code: string) => map.get(code) ?? null;
  }, [muscleGroups]);

  const reset = () => {
    setCategory(null);
    setGroup(null);
    setQuery("");
  };
  const close = () => {
    setOpen(false);
    reset();
  };
  const pick = (exercise: Exercise) => {
    onPick(exercise.id);
    close();
  };

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return all
      .filter((e) => !e.deleted_at && e.is_active)
      .filter(
        (e) =>
          e.name_he.toLowerCase().includes(q) ||
          (e.name_en ?? "").toLowerCase().includes(q) ||
          e.aliases.some((a) => a.toLowerCase().includes(q)),
      )
      .slice(0, 20);
  }, [all, query]);

  const list: Exercise[] = useMemo(() => {
    if (searchResults) return searchResults;
    if (category === "bodyweight") return bodyweightExercises(all);
    if (category === "rope") return ropeExercises(all);
    if (category === "dumbbells" && group) return dumbbellExercisesForGroup(all, group, idByCode);
    return [];
  }, [searchResults, category, group, all, idByCode]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border-strong text-sm font-bold text-muted-foreground"
      >
        <Plus aria-hidden className="size-4" />
        הוסף תרגיל
      </button>
    );
  }

  return (
    <section
      aria-label="בחירת תרגיל"
      className="space-y-2 rounded-xl border border-border-strong bg-surface p-2"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="חיפוש תרגיל"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש תרגיל…"
            className="pe-9"
          />
        </div>
        <button
          type="button"
          aria-label="סגור בחירת תרגילים"
          onClick={close}
          className="inline-flex size-11 items-center justify-center rounded-xl bg-tint"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>

      {/* breadcrumb — always shows where we are and how to go back one level */}
      {!searchResults && (category || group) ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <button
            type="button"
            className="min-h-11 min-w-11 px-1 font-bold underline"
            onClick={reset}
          >
            ציוד
          </button>
          {category ? (
            <>
              <ChevronRight aria-hidden className="size-3 rtl:rotate-180" />
              <button
                type="button"
                className="min-h-11 min-w-11 px-1 font-bold underline"
                onClick={() => setGroup(null)}
              >
                {HOME_BANK_CATEGORIES.find((c) => c.id === category)?.label}
              </button>
            </>
          ) : null}
          {group ? (
            <>
              <ChevronRight aria-hidden className="size-3 rtl:rotate-180" />
              <span className="font-bold text-foreground">{group.label}</span>
            </>
          ) : null}
        </div>
      ) : null}

      {/* level 1 — equipment */}
      {!searchResults && !category ? (
        <ul className="grid grid-cols-1 gap-1.5">
          {HOME_BANK_CATEGORIES.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setCategory(c.id)}
                className="grid min-h-12 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border bg-background px-3 text-start"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{c.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{c.hint}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {bankCategoryCount(all, c.id)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* level 2 — muscle group, dumbbells only */}
      {!searchResults && category === "dumbbells" && !group ? (
        <ul className="grid grid-cols-2 gap-1.5">
          {DUMBBELL_GROUPS.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => setGroup(g)}
                className="flex min-h-12 w-full items-center gap-2 rounded-lg border border-border bg-background px-2 text-start"
              >
                <MuscleBadge primary={muscleRegionOf(g.id)} height={34} decorative />
                <span className="truncate text-sm font-bold">{g.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* level 3 — exercises */}
      {list.length > 0 ? (
        <ul className="grid grid-cols-1 gap-1.5">
          {list.map((exercise, index) => (
            <li key={exercise.id}>
              <button
                type="button"
                onClick={() => pick(exercise)}
                className={cn(
                  "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border bg-background p-2 text-start",
                  index === 0 && !searchResults ? "border-primary/60" : "border-border",
                )}
              >
                <MuscleBadge
                  primary={bodyRegionOfExercise(exercise, muscleGroups)}
                  height={36}
                  decorative
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{exercise.name_he}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {index === 0 && !searchResults ? "הנפוץ ביותר · " : ""}
                    {exercise.name_en ?? ""}
                  </span>
                </span>
                <ExerciseMovementIllustration
                  movement={movementForSlug(exercise.slug)}
                  height={40}
                  className="w-24"
                  decorative
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {searchResults && searchResults.length === 0 ? (
        <p className="p-3 text-center text-sm text-muted-foreground">לא נמצא תרגיל בשם הזה.</p>
      ) : null}
    </section>
  );
}

/** Dumbbell group code → the badge's body region (the badge uses the coarser taxonomy). */
function muscleRegionOf(code: string) {
  switch (code) {
    case "biceps":
    case "triceps":
      return "arms" as const;
    case "shoulders":
      return "shoulders" as const;
    case "chest":
      return "chest" as const;
    case "back":
      return "back" as const;
    default:
      return null;
  }
}
