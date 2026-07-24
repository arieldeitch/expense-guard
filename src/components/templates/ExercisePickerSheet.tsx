/**
 * ExercisePickerSheet — בוחר תרגילים מהספרייה כדי להוסיף לבלוק תבנית.
 * תמיכה בבחירה מרובה כדי ליצור סופרסט בפעולה אחת.
 * סינון: חיפוש, מועדפים, זמינות במקום, קבוצת שריר.
 */
import { useMemo, useState } from "react";
import { Check, Search, Star } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/catalog/shared";
import {
  filterExercises,
  getExerciseAvailability,
  useAllExercises,
  useMuscleGroups,
  EMPTY_EXERCISE_FILTERS,
  type Exercise,
} from "@/lib/exercises";
import { useEquipmentInLocation } from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string | null;
  /** onSelect(exerciseIds, asSuperset) — למעלה מ־1 → מציעים סופרסט. */
  onSelect: (exerciseIds: string[], asSuperset: boolean) => void;
  title?: string;
}

export function ExercisePickerSheet({
  open,
  onOpenChange,
  locationId,
  onSelect,
  title,
}: Props) {
  const all = useAllExercises();
  const muscleGroups = useMuscleGroups();
  const locationEquipment = useEquipmentInLocation(locationId ?? "");
  const mgById = useMemo(() => new Map(muscleGroups.map((m) => [m.id, m])), [muscleGroups]);

  const [query, setQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [muscle, setMuscle] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [asSuperset, setAsSuperset] = useState(false);

  const filtered = useMemo(() => {
    const filters = {
      ...EMPTY_EXERCISE_FILTERS,
      query,
      showFavoritesOnly: onlyFavorites,
      muscleGroupIds: muscle ? [muscle] : [],
      onlyAvailableInLocation: onlyAvailable && locationId ? locationId : null,
    };
    return filterExercises({
      exercises: all,
      filters,
      locationEquipment: onlyAvailable && locationId ? locationEquipment : undefined,
    });
  }, [all, query, onlyFavorites, onlyAvailable, locationId, locationEquipment, muscle]);

  function toggle(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function commit() {
    if (selected.length === 0) return;
    onSelect(selected, asSuperset && selected.length >= 2);
    setSelected([]);
    setAsSuperset(false);
    onOpenChange(false);
  }

  function reset() {
    setSelected([]);
    setAsSuperset(false);
    setQuery("");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <SheetContent
        side="bottom"
        dir="rtl"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl border-border-strong bg-background sm:mx-auto sm:max-w-2xl"
      >
        <SheetHeader className="text-start">
          <SheetTitle>{title ?? "הוספת תרגיל"}</SheetTitle>
          <SheetDescription>
            {locationId
              ? "מוצגים תרגילים מהספרייה. אפשר לבחור מספר תרגילים ליצירת סופרסט."
              : "לא נבחר מקום — זמינות ציוד לא נבדקת. ניתן לבחור בכל זאת."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-3">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש לפי שם או קבוצת שריר"
              className="min-h-11 rounded-xl border-border-strong pe-9"
              aria-label="חיפוש תרגילים"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={onlyFavorites}
              onClick={() => setOnlyFavorites((v) => !v)}
              icon={<Star aria-hidden className="size-3.5" />}
            >
              מועדפים
            </FilterChip>
            {locationId ? (
              <FilterChip active={onlyAvailable} onClick={() => setOnlyAvailable((v) => !v)}>
                זמין במקום
              </FilterChip>
            ) : null}
            <select
              value={muscle ?? ""}
              onChange={(e) => setMuscle(e.target.value || null)}
              className="min-h-9 rounded-full border border-border-strong bg-surface px-3 text-xs font-bold"
              aria-label="סינון לפי קבוצת שריר"
            >
              <option value="">כל הקבוצות</option>
              {muscleGroups.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name_he}
                </option>
              ))}
            </select>
          </div>

          <div className="grid max-h-[50vh] grid-cols-1 gap-2 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                לא נמצאו תרגילים תואמים
              </p>
            ) : (
              filtered.map((ex) => (
                <PickerRow
                  key={ex.id}
                  exercise={ex}
                  selected={selected.includes(ex.id)}
                  muscleName={mgById.get(ex.primary_muscle_group_id)?.name_he ?? "—"}
                  availabilityBadge={
                    onlyAvailable || locationId
                      ? availabilityLabel(ex, locationId ? { locationId, items: locationEquipment } : null)
                      : null
                  }
                  onToggle={() => toggle(ex.id)}
                />
              ))
            )}
          </div>

          {selected.length >= 2 ? (
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-strong bg-tint/40 p-3 text-sm">
              <input
                type="checkbox"
                checked={asSuperset}
                onChange={(e) => setAsSuperset(e.target.checked)}
                className="size-4 accent-gym"
              />
              <span>הוסף כסופרסט אחד ({selected.length} תרגילים)</span>
            </label>
          ) : null}
        </div>

        <SheetFooter className="mt-4 flex-row gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="min-h-11 rounded-xl border border-border-strong"
          >
            ביטול
          </Button>
          <Button
            type="button"
            onClick={commit}
            disabled={selected.length === 0}
            className="min-h-11 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            הוספת {selected.length > 0 ? selected.length : ""} תרגילים
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function availabilityLabel(
  exercise: Exercise,
  snapshot: { locationId: string; items: ReturnType<typeof useEquipmentInLocation> } | null,
): { label: string; tone: "success" | "warning" | "info" | "destructive" } | null {
  const status = getExerciseAvailability(exercise, snapshot);
  if (status.status === "available") return { label: "זמין", tone: "success" };
  if (status.status === "partial") return { label: "חלקי", tone: "warning" };
  if (status.status === "unavailable") return { label: "ציוד חסר", tone: "destructive" };
  return null;
}

function FilterChip({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-xs font-bold",
        active
          ? "border-primary bg-primary/15 text-foreground"
          : "border-border-strong bg-surface text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function PickerRow({
  exercise,
  selected,
  muscleName,
  availabilityBadge,
  onToggle,
}: {
  exercise: Exercise;
  selected: boolean;
  muscleName: string;
  availabilityBadge: { label: string; tone: "success" | "warning" | "info" | "destructive" } | null;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-2 text-start text-sm",
        selected
          ? "border-primary bg-primary/10"
          : "border-border-strong bg-surface hover:bg-surface-elevated",
      )}
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-lg border",
          selected ? "border-primary bg-primary text-white" : "border-border-strong bg-tint",
        )}
      >
        {selected ? <Check aria-hidden className="size-4" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-bold">{exercise.name_he}</span>
        <span className="block truncate text-[11px] uppercase tracking-wider text-muted-foreground">
          {muscleName}
        </span>
      </span>
      {availabilityBadge ? <Chip tone={availabilityBadge.tone}>{availabilityBadge.label}</Chip> : null}
    </button>
  );
}
