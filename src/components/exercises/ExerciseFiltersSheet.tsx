/**
 * ExerciseFiltersSheet — Drawer אנכי (Sheet) לסינון ספריית תרגילים.
 * לפי §3 של product-requirements — אין שורת chips אופקית נגררת.
 */
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/catalog/shared";
import {
  CATEGORIES_ORDERED,
  CATEGORY_LABEL,
  DIFFICULTIES_ORDERED,
  DIFFICULTY_LABEL,
  EMPTY_EXERCISE_FILTERS,
  MOVEMENT_PATTERN_LABEL,
  MOVEMENT_PATTERNS_ORDERED,
  TRACKING_TYPE_LABEL,
  TRACKING_TYPES_ORDERED,
  type ExerciseCategory,
  type ExerciseFilters,
  type MovementPattern,
  type MuscleGroup,
  type TrackingType,
  type Difficulty,
} from "@/lib/exercises";
import type { TrainingLocation } from "@/lib/catalog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ExerciseFilters;
  onFiltersChange: (next: ExerciseFilters) => void;
  muscleGroups: MuscleGroup[];
  locations: TrainingLocation[];
}

export function ExerciseFiltersSheet({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  muscleGroups,
  locations,
}: Props) {
  function set<K extends keyof ExerciseFilters>(key: K, value: ExerciseFilters[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }
  function toggleIn<T extends string>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        dir="rtl"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl border-border-strong bg-background sm:mx-auto sm:max-w-2xl"
      >
        <SheetHeader className="text-start">
          <SheetTitle>סינון תרגילים</SheetTitle>
          <SheetDescription>בחירת קריטריונים לצמצום הרשימה.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-5">
          <FieldGroup label="נראות">
            <Select value={filters.visibility} onValueChange={(v) => set("visibility", v as ExerciseFilters["visibility"])}>
              <SelectTrigger className="min-h-11 rounded-xl border-border-strong">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="active">פעילים בלבד</SelectItem>
                <SelectItem value="archived">ארכיון בלבד</SelectItem>
                <SelectItem value="all">כולם</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="מקום אימון (זמינות)">
            <Select
              value={filters.onlyAvailableInLocation ?? "none"}
              onValueChange={(v) => set("onlyAvailableInLocation", v === "none" ? null : v)}
            >
              <SelectTrigger className="min-h-11 rounded-xl border-border-strong">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="none">כל התרגילים (ללא סינון ציוד)</SelectItem>
                {locations
                  .filter((l) => l.deleted_at === null && l.is_active)
                  .map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              בחירת מקום מסתירה תרגילים שהציוד הנדרש להם חסר.
            </p>
          </FieldGroup>

          <ChipGroup
            label="קבוצות שריר"
            items={muscleGroups.map((m) => ({ id: m.id, label: m.name_he }))}
            selected={filters.muscleGroupIds}
            onToggle={(id) => set("muscleGroupIds", toggleIn(filters.muscleGroupIds, id))}
          />

          <ChipGroup
            label="דפוס תנועה"
            items={MOVEMENT_PATTERNS_ORDERED.map((p) => ({ id: p, label: MOVEMENT_PATTERN_LABEL[p] }))}
            selected={filters.movementPatterns}
            onToggle={(id) => set("movementPatterns", toggleIn(filters.movementPatterns, id as MovementPattern))}
          />

          <ChipGroup
            label="סוג מעקב"
            items={TRACKING_TYPES_ORDERED.map((t) => ({ id: t, label: TRACKING_TYPE_LABEL[t] }))}
            selected={filters.trackingTypes}
            onToggle={(id) => set("trackingTypes", toggleIn(filters.trackingTypes, id as TrackingType))}
          />

          <ChipGroup
            label="קטגוריה"
            items={CATEGORIES_ORDERED.map((c) => ({ id: c, label: CATEGORY_LABEL[c] }))}
            selected={filters.categories}
            onToggle={(id) => set("categories", toggleIn(filters.categories, id as ExerciseCategory))}
          />

          <ChipGroup
            label="רמת קושי"
            items={DIFFICULTIES_ORDERED.map((d) => ({ id: d, label: DIFFICULTY_LABEL[d] }))}
            selected={filters.difficulty}
            onToggle={(id) => set("difficulty", toggleIn(filters.difficulty, id as Difficulty))}
          />

          <FieldGroup label="מסננים נוספים">
            <div className="flex flex-col gap-3">
              <ToggleRow
                label="מועדפים בלבד"
                checked={filters.favoritesOnly}
                onChange={(v) => set("favoritesOnly", v)}
              />
              <ToggleRow
                label="עם מדיה בלבד"
                checked={filters.withMediaOnly}
                onChange={(v) => set("withMediaOnly", v)}
              />
              <ToggleRow
                label="תרגילים מותאמים אישית בלבד"
                checked={filters.customOnly}
                onChange={(v) => set("customOnly", v)}
              />
            </div>
          </FieldGroup>
        </div>

        <SheetFooter className="mt-6 flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1 rounded-xl"
            onClick={() => onFiltersChange({ ...EMPTY_EXERCISE_FILTERS, query: filters.query })}
          >
            איפוס
          </Button>
          <Button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-primary text-primary-foreground"
            onClick={() => onOpenChange(false)}
          >
            סיום
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-bold">{label}</Label>
      {children}
    </div>
  );
}

function ChipGroup({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <FieldGroup label={label}>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => {
          const isOn = selected.includes(it.id);
          return (
            <button
              key={it.id}
              type="button"
              aria-pressed={isOn}
              onClick={() => onToggle(it.id)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                isOn
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border-strong bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    </FieldGroup>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between rounded-xl border border-border-strong bg-surface px-3">
      <span className="text-sm font-semibold">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function exerciseFiltersActiveCount(f: ExerciseFilters): number {
  let n = 0;
  if (f.muscleGroupIds.length) n++;
  if (f.movementPatterns.length) n++;
  if (f.trackingTypes.length) n++;
  if (f.categories.length) n++;
  if (f.difficulty.length) n++;
  if (f.onlyAvailableInLocation) n++;
  if (f.favoritesOnly) n++;
  if (f.withMediaOnly) n++;
  if (f.customOnly) n++;
  if (f.visibility !== "active") n++;
  return n;
}

// re-export for convenience where the icon is used alongside
export { Filter };
