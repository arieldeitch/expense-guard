/**
 * HomeExercisePicker — בחירת תרגילים לתוכנית בית.
 *
 * עקרונות (ADR-0029):
 *  - סדר: **אחרונים → מועדפים → קבוצות** (קבוצות בשפת משתמש, לא קטגוריות טכניות).
 *  - חיפוש בעברית או באנגלית.
 *  - פילטר ציוד פשוט בלבד (5 אפשרויות), אופציונלי.
 *  - **בחירה מרובה** לפני סגירה — לא נסגר אחרי כל תרגיל.
 *  - ללא הוראות/טעויות נפוצות/מדיה/מטא-דאטה מלא — אלה שייכים למסך התרגיל.
 *  - ללא dialog בתוך dialog: "תרגיל מותאם" נפתח **באותו** גיליון.
 */
import { useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAllExercises, useMuscleGroups, createExercise, type Exercise } from "@/lib/exercises";
import {
  HOME_EQUIPMENT_LABELS,
  curatedGroups,
  homeEquipmentOf,
  matchesQuery,
  buildCustomHomeExercise,
  type HomeEquipmentFilter,
} from "@/lib/exercises/homeCatalog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** מזהי תרגילים שכבר בתוכנית — מוצגים כ"נוסף". */
  alreadyInPlan?: string[];
  /** מזהי תרגילים שהופיעו לאחרונה (סדר: החדש ביותר ראשון). */
  recentIds?: string[];
  /** נקרא פעם אחת עם כל התרגילים שנבחרו. */
  onAdd: (exerciseIds: string[]) => void;
}

const EQUIPMENT_ORDER: HomeEquipmentFilter[] = [
  "none",
  "band",
  "dumbbells",
  "pullup_bar",
  "other",
];

export function HomeExercisePicker({
  open,
  onOpenChange,
  alreadyInPlan = [],
  recentIds = [],
  onAdd,
}: Props) {
  const all = useAllExercises();
  const [query, setQuery] = useState("");
  const [equipment, setEquipment] = useState<HomeEquipmentFilter | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [customOpen, setCustomOpen] = useState(false);

  const inPlan = useMemo(() => new Set(alreadyInPlan), [alreadyInPlan]);

  const passes = useMemo(
    () => (e: Exercise) =>
      matchesQuery(e, query) && (equipment === null || homeEquipmentOf(e) === equipment),
    [query, equipment],
  );

  const groups = useMemo(() => curatedGroups(all), [all]);

  const recent = useMemo(() => {
    const byId = new Map(all.map((e) => [e.id, e]));
    return recentIds
      .map((id) => byId.get(id))
      .filter((e): e is Exercise => e !== undefined)
      .filter(passes)
      .slice(0, 6);
  }, [all, recentIds, passes]);

  const favorites = useMemo(
    () => all.filter((e) => e.is_favorite).filter(passes).slice(0, 8),
    [all, passes],
  );

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function close() {
    setSelected([]);
    setQuery("");
    setEquipment(null);
    setCustomOpen(false);
    onOpenChange(false);
  }

  function confirm() {
    if (selected.length > 0) onAdd(selected);
    close();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50">
      <section
        role="dialog"
        aria-label="בחירת תרגילים"
        className="flex max-h-[88vh] w-full flex-col rounded-t-2xl bg-background"
      >
        {/* Header — חיפוש + סגירה */}
        <header className="flex items-center gap-2 border-b border-border-strong p-3">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute inset-y-0 start-2 my-auto size-4 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש בעברית או באנגלית…"
              aria-label="חיפוש תרגיל"
              className="ps-8"
            />
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="סגור בחירת תרגילים"
            className="grid size-11 place-items-center rounded-xl bg-tint"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        {/* פילטר ציוד — אופציונלי */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-border-strong px-3 py-2">
          <FilterChip active={equipment === null} onClick={() => setEquipment(null)}>
            הכול
          </FilterChip>
          {EQUIPMENT_ORDER.map((eq) => (
            <FilterChip key={eq} active={equipment === eq} onClick={() => setEquipment(eq)}>
              {HOME_EQUIPMENT_LABELS[eq]}
            </FilterChip>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
          {customOpen ? (
            <CustomExerciseForm
              onCancel={() => setCustomOpen(false)}
              onCreate={(created) => {
                setCustomOpen(false);
                setSelected((prev) => [...prev, created.id]);
              }}
            />
          ) : null}

          {recent.length > 0 ? (
            <Section title="אחרונים">
              {recent.map((e) => (
                <Row
                  key={e.id}
                  exercise={e}
                  selected={selected.includes(e.id)}
                  inPlan={inPlan.has(e.id)}
                  onToggle={() => toggle(e.id)}
                />
              ))}
            </Section>
          ) : null}

          {favorites.length > 0 ? (
            <Section title="מועדפים">
              {favorites.map((e) => (
                <Row
                  key={e.id}
                  exercise={e}
                  selected={selected.includes(e.id)}
                  inPlan={inPlan.has(e.id)}
                  onToggle={() => toggle(e.id)}
                />
              ))}
            </Section>
          ) : null}

          {groups.map(({ group, exercises }) => {
            const visible = exercises.filter(passes);
            if (visible.length === 0) return null;
            return (
              <Section key={group.id} title={group.label}>
                {visible.map((e) => (
                  <Row
                    key={e.id}
                    exercise={e}
                    selected={selected.includes(e.id)}
                    inPlan={inPlan.has(e.id)}
                    onToggle={() => toggle(e.id)}
                  />
                ))}
              </Section>
            );
          })}

          {!customOpen ? (
            <button
              type="button"
              onClick={() => setCustomOpen(true)}
              className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-strong text-sm font-bold text-muted-foreground"
            >
              <Plus className="size-4" aria-hidden />
              תרגיל מותאם
            </button>
          ) : null}
        </div>

        {/* פעולה ראשית אחת */}
        <footer className="border-t border-border-strong p-3">
          <Button
            type="button"
            onClick={confirm}
            disabled={selected.length === 0}
            className="min-h-12 w-full rounded-xl bg-home text-white"
          >
            {selected.length === 0 ? "בחר תרגילים" : `הוסף ${selected.length} תרגילים`}
          </Button>
        </footer>
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-3">
      <h3 className="mb-1 text-xs font-black uppercase text-muted-foreground">{title}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

function Row({
  exercise,
  selected,
  inPlan,
  onToggle,
}: {
  exercise: Exercise;
  selected: boolean;
  inPlan: boolean;
  onToggle: () => void;
}) {
  const eq = homeEquipmentOf(exercise);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`${selected ? "הסר" : "הוסף"} ${exercise.name_he}`}
      className={cn(
        "flex min-h-12 w-full items-center gap-2 rounded-xl border px-3 py-2 text-start",
        selected ? "border-home bg-home-soft/40" : "border-border-strong bg-surface",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{exercise.name_he}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {exercise.name_en ? `${exercise.name_en} · ` : ""}
          {HOME_EQUIPMENT_LABELS[eq]}
          {inPlan ? " · כבר בתוכנית" : ""}
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg border",
          selected ? "border-home bg-home text-white" : "border-border-strong text-muted-foreground",
        )}
      >
        {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
      </span>
    </button>
  );
}

/** תרגיל מותאם — שם, סוג מדידה וציוד בלבד. ללא מטא-דאטה נוסף. */
function CustomExerciseForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (created: Exercise) => void;
}) {
  const muscleGroups = useMuscleGroups();
  const fullBodyGroupId =
    muscleGroups.find((m) => m.code === "full_body")?.id ?? muscleGroups[0]?.id ?? "";
  return (
    <form
      className="mt-3 flex flex-col gap-2 rounded-xl border border-border-strong bg-surface p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const name = String(data.get("name") ?? "").trim();
        if (!name) return;
        const measure = String(data.get("measure") ?? "reps") === "time" ? "time" : "reps";
        const equip = String(data.get("equipment") ?? "none") as HomeEquipmentFilter;
        const created = createExercise(
          buildCustomHomeExercise({
            name_he: name,
            measure,
            equipment: equip,
            primaryMuscleGroupId: fullBodyGroupId,
          }),
        );
        onCreate(created);
      }}
    >
      <h3 className="text-xs font-black uppercase text-muted-foreground">תרגיל מותאם</h3>
      <Input name="name" aria-label="שם התרגיל" placeholder="שם התרגיל" autoFocus />
      <div className="flex gap-2">
        <label className="flex-1 text-xs">
          <span className="mb-1 block text-muted-foreground">מדידה</span>
          <select
            name="measure"
            aria-label="סוג מדידה"
            className="min-h-11 w-full rounded-xl border border-border-strong bg-surface px-2 text-sm"
          >
            <option value="reps">חזרות</option>
            <option value="time">זמן</option>
          </select>
        </label>
        <label className="flex-1 text-xs">
          <span className="mb-1 block text-muted-foreground">ציוד</span>
          <select
            name="equipment"
            aria-label="ציוד"
            className="min-h-11 w-full rounded-xl border border-border-strong bg-surface px-2 text-sm"
          >
            <option value="none">ללא ציוד</option>
            <option value="band">גומייה</option>
            <option value="dumbbells">משקולות</option>
            <option value="pullup_bar">מתח</option>
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="min-h-11 flex-1 rounded-xl bg-home text-white">
          צור והוסף
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="min-h-11 flex-1 rounded-xl border-border-strong"
        >
          ביטול
        </Button>
      </div>
    </form>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-9 shrink-0 rounded-full border px-3 text-xs font-bold",
        active ? "border-home bg-home text-white" : "border-border-strong bg-surface",
      )}
    >
      {children}
    </button>
  );
}
