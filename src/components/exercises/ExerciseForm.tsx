/**
 * ExerciseForm — יצירה או עריכה של תרגיל אישי.
 * מגישה Progressive disclosure — שדות חובה תמיד גלויים, המתקדמים נפתחים בהחלטה.
 * מזהה כפילות שם (לא חוסמת — דורשת אישור מפורש).
 *
 * שדות חובה: שם, קטגוריה, קבוצת שריר ראשית, סוג מעקב.
 * ברירות מחדל: 3 סטים × 12 חזרות, מנוחה 60 שנ.
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ConfirmDialog } from "@/components/catalog/ConfirmDialog";
import {
  CATEGORIES_ORDERED,
  CATEGORY_LABEL,
  createExercise,
  DIFFICULTIES_ORDERED,
  DIFFICULTY_LABEL,
  exerciseFormSchema,
  findSimilarExercises,
  MOVEMENT_PATTERN_LABEL,
  MOVEMENT_PATTERNS_ORDERED,
  TRACKING_TYPE_LABEL,
  TRACKING_TYPES_ORDERED,
  updateExercise,
  type Difficulty,
  type Exercise,
  type ExerciseCategory,
  type MovementPattern,
  type MuscleGroup,
  type TrackingType,
} from "@/lib/exercises";
import { EQUIPMENT_TYPE_LABEL, EQUIPMENT_TYPES_ORDERED, type EquipmentType } from "@/lib/catalog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise?: Exercise | null;
  /** אם קיים — יש parent ווריאציה. */
  parent?: Exercise | null;
  muscleGroups: MuscleGroup[];
  onSaved?: (e: Exercise) => void;
}

interface FormState {
  name_he: string;
  name_en: string;
  aliasesText: string;
  category: ExerciseCategory;
  primary_muscle_group_id: string;
  secondary_muscle_group_ids: string[];
  movement_pattern: MovementPattern;
  tracking_type: TrackingType;
  required_equipment_types: EquipmentType[];
  optional_equipment_types: EquipmentType[];
  unilateral: boolean;
  bodyweight_based: boolean;
  difficulty: Difficulty;
  default_sets: string;
  default_reps: string;
  default_rest: string;
  default_rpe: string;
  default_rir: string;
  instructions: string;
  cuesText: string;
  mistakesText: string;
  personal_notes: string;
  is_favorite: boolean;
}

function toState(e: Exercise | null | undefined, muscleGroups: MuscleGroup[]): FormState {
  const defaultMg = muscleGroups[0]?.id ?? "";
  return {
    name_he: e?.name_he ?? "",
    name_en: e?.name_en ?? "",
    aliasesText: (e?.aliases ?? []).join(", "),
    category: (e?.category as ExerciseCategory) ?? "compound",
    primary_muscle_group_id: e?.primary_muscle_group_id ?? defaultMg,
    secondary_muscle_group_ids: e?.secondary_muscle_group_ids ?? [],
    movement_pattern: (e?.movement_pattern as MovementPattern) ?? "horizontal_push",
    tracking_type: (e?.tracking_type as TrackingType) ?? "weight_reps",
    required_equipment_types: (e?.required_equipment_types ?? []) as EquipmentType[],
    optional_equipment_types: (e?.optional_equipment_types ?? []) as EquipmentType[],
    unilateral: e?.unilateral ?? false,
    bodyweight_based: e?.bodyweight_based ?? false,
    difficulty: (e?.difficulty as Difficulty) ?? "intermediate",
    default_sets: String(e?.default_sets ?? 3),
    default_reps: e?.default_reps != null ? String(e.default_reps) : "12",
    default_rest: e?.default_rest_seconds != null ? String(e.default_rest_seconds) : "60",
    default_rpe: e?.default_rpe != null ? String(e.default_rpe) : "",
    default_rir: e?.default_rir != null ? String(e.default_rir) : "",
    instructions: e?.instructions ?? "",
    cuesText: (e?.technique_cues ?? []).join("\n"),
    mistakesText: (e?.common_mistakes ?? []).join("\n"),
    personal_notes: e?.personal_notes ?? "",
    is_favorite: e?.is_favorite ?? false,
  };
}

export function ExerciseForm({ open, onOpenChange, exercise, parent, muscleGroups, onSaved }: Props) {
  const initial = useMemo(() => toState(exercise, muscleGroups), [exercise, muscleGroups]);
  const [state, setState] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(Boolean(exercise));
  const [duplicateOverride, setDuplicateOverride] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (open) {
      setState(initial);
      setErrors({});
      setShowAdvanced(Boolean(exercise));
      setDuplicateOverride(false);
    }
  }, [open, initial, exercise]);

  const dirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(initial), [state, initial]);

  const similar = useMemo(
    () => (state.name_he.trim().length > 1 ? findSimilarExercises(state.name_he, exercise?.id) : []),
    [state.name_he, exercise?.id],
  );

  function requestClose(next: boolean) {
    if (!next && dirty) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(next);
  }

  function parseNum(v: string): number | undefined {
    if (v.trim() === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  function toggleType(list: EquipmentType[], t: EquipmentType): EquipmentType[] {
    return list.includes(t) ? list.filter((x) => x !== t) : [...list, t];
  }

  function toggleSecondary(id: string): void {
    setState((s) => ({
      ...s,
      secondary_muscle_group_ids: s.secondary_muscle_group_ids.includes(id)
        ? s.secondary_muscle_group_ids.filter((x) => x !== id)
        : [...s.secondary_muscle_group_ids, id],
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const aliases = state.aliasesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
    const parsed = exerciseFormSchema.safeParse({
      name_he: state.name_he,
      name_en: state.name_en,
      aliases,
      category: state.category,
      primary_muscle_group_id: state.primary_muscle_group_id,
      secondary_muscle_group_ids: state.secondary_muscle_group_ids,
      movement_pattern: state.movement_pattern,
      tracking_type: state.tracking_type,
      required_equipment_ids: [],
      optional_equipment_ids: [],
      required_equipment_types: state.required_equipment_types,
      optional_equipment_types: state.optional_equipment_types,
      unilateral: state.unilateral,
      bodyweight_based: state.bodyweight_based,
      difficulty: state.difficulty,
      default_sets: Number(state.default_sets),
      default_reps: parseNum(state.default_reps) ?? null,
      default_rep_range_min: null,
      default_rep_range_max: null,
      default_rest_seconds: parseNum(state.default_rest) ?? null,
      default_rpe: parseNum(state.default_rpe) ?? null,
      default_rir: parseNum(state.default_rir) ?? null,
      instructions: state.instructions,
      technique_cues: state.cuesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10),
      common_mistakes: state.mistakesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10),
      safety_notes: null,
      personal_notes: state.personal_notes,
      location_ids: [],
      parent_exercise_id: parent?.id ?? null,
      is_favorite: state.is_favorite,
    });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) map[issue.path.join(".")] = issue.message;
      setErrors(map);
      return;
    }
    if (similar.length > 0 && !duplicateOverride) {
      setDuplicateOverride(true);
      return;
    }
    const data = parsed.data;
    const payload = {
      name_he: data.name_he,
      name_en: data.name_en ?? null,
      aliases: data.aliases ?? [],
      slug: exercise?.slug ?? "",
      category: data.category as ExerciseCategory,
      primary_muscle_group_id: data.primary_muscle_group_id,
      secondary_muscle_group_ids: data.secondary_muscle_group_ids,
      movement_pattern: data.movement_pattern as MovementPattern,
      tracking_type: data.tracking_type as TrackingType,
      required_equipment_ids: data.required_equipment_ids,
      optional_equipment_ids: data.optional_equipment_ids,
      required_equipment_types: data.required_equipment_types,
      optional_equipment_types: data.optional_equipment_types,
      unilateral: data.unilateral ?? false,
      bodyweight_based: data.bodyweight_based ?? false,
      difficulty: data.difficulty as Difficulty,
      default_sets: data.default_sets,
      default_reps: data.default_reps ?? null,
      default_rep_range_min: data.default_rep_range_min ?? null,
      default_rep_range_max: data.default_rep_range_max ?? null,
      default_rest_seconds: data.default_rest_seconds ?? null,
      default_rpe: data.default_rpe ?? null,
      default_rir: data.default_rir ?? null,
      instructions: data.instructions ?? null,
      technique_cues: data.technique_cues,
      common_mistakes: data.common_mistakes,
      safety_notes: data.safety_notes ?? null,
      personal_notes: data.personal_notes ?? null,
      location_ids: data.location_ids ?? [],
      parent_exercise_id: data.parent_exercise_id ?? null,
      variation_type: parent ? "grip" as const : null,
      variation_notes: null,
      is_custom: true,
      is_favorite: state.is_favorite,
    };
    const saved = exercise
      ? updateExercise(exercise.id, payload)
      : createExercise({ ...payload });
    if (saved) onSaved?.(saved);
    onOpenChange(false);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent
          side="bottom"
          dir="rtl"
          className="max-h-[92vh] overflow-y-auto rounded-t-2xl border-border-strong bg-background sm:mx-auto sm:max-w-2xl"
        >
          <SheetHeader className="text-start">
            <SheetTitle>
              {exercise ? "עריכת תרגיל" : parent ? `ווריאציה של ${parent.name_he}` : "תרגיל חדש"}
            </SheetTitle>
            <SheetDescription>
              שם, קטגוריה, קבוצת שריר וסוג מעקב הם השדות ההכרחיים. השאר אופציונלי.
            </SheetDescription>
          </SheetHeader>

          <form className="mt-4 flex flex-col gap-4" onSubmit={submit}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="ex-name-he" className="mb-1.5 block text-sm font-bold">
                  שם בעברית *
                </Label>
                <Input
                  id="ex-name-he"
                  value={state.name_he}
                  required
                  maxLength={120}
                  className="min-h-11 rounded-xl"
                  onChange={(e) => {
                    setState((s) => ({ ...s, name_he: e.target.value }));
                    setDuplicateOverride(false);
                  }}
                  placeholder="למשל: לחיצת חזה בשיפוע"
                />
                {errors.name_he ? (
                  <p className="mt-1 text-xs text-destructive">{errors.name_he}</p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="ex-category" className="mb-1.5 block text-sm font-bold">
                  קטגוריה *
                </Label>
                <Select
                  value={state.category}
                  onValueChange={(v) => setState((s) => ({ ...s, category: v as ExerciseCategory }))}
                >
                  <SelectTrigger id="ex-category" className="min-h-11 rounded-xl border-border-strong">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {CATEGORIES_ORDERED.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ex-difficulty" className="mb-1.5 block text-sm font-bold">
                  רמת קושי
                </Label>
                <Select
                  value={state.difficulty}
                  onValueChange={(v) => setState((s) => ({ ...s, difficulty: v as Difficulty }))}
                >
                  <SelectTrigger id="ex-difficulty" className="min-h-11 rounded-xl border-border-strong">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {DIFFICULTIES_ORDERED.map((d) => (
                      <SelectItem key={d} value={d}>
                        {DIFFICULTY_LABEL[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ex-primary" className="mb-1.5 block text-sm font-bold">
                  קבוצת שריר ראשית *
                </Label>
                <Select
                  value={state.primary_muscle_group_id}
                  onValueChange={(v) => setState((s) => ({ ...s, primary_muscle_group_id: v }))}
                >
                  <SelectTrigger id="ex-primary" className="min-h-11 rounded-xl border-border-strong">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {muscleGroups.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name_he}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.primary_muscle_group_id ? (
                  <p className="mt-1 text-xs text-destructive">{errors.primary_muscle_group_id}</p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="ex-tracking" className="mb-1.5 block text-sm font-bold">
                  סוג מעקב *
                </Label>
                <Select
                  value={state.tracking_type}
                  onValueChange={(v) => setState((s) => ({ ...s, tracking_type: v as TrackingType }))}
                >
                  <SelectTrigger id="ex-tracking" className="min-h-11 rounded-xl border-border-strong">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {TRACKING_TYPES_ORDERED.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TRACKING_TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ex-movement" className="mb-1.5 block text-sm font-bold">
                  דפוס תנועה
                </Label>
                <Select
                  value={state.movement_pattern}
                  onValueChange={(v) => setState((s) => ({ ...s, movement_pattern: v as MovementPattern }))}
                >
                  <SelectTrigger id="ex-movement" className="min-h-11 rounded-xl border-border-strong">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {MOVEMENT_PATTERNS_ORDERED.map((p) => (
                      <SelectItem key={p} value={p}>
                        {MOVEMENT_PATTERN_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {similar.length > 0 && !duplicateOverride ? (
              <div className="rounded-xl border border-warning/60 bg-warning-soft/40 p-3">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <AlertTriangle aria-hidden className="size-4 text-warning" />
                  קיימים תרגילים בעלי שם דומה
                </div>
                <ul className="mt-1 text-xs text-muted-foreground">
                  {similar.slice(0, 3).map((s) => (
                    <li key={s.id}>· {s.name_he}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  אם זו ווריאציה — המשך. לחיצה נוספת על "שמור" תיצור את התרגיל.
                </p>
              </div>
            ) : null}

            <div>
              <Label className="mb-1.5 block text-sm font-bold">קבוצות שריר משניות</Label>
              <div className="flex flex-wrap gap-1.5">
                {muscleGroups
                  .filter((m) => m.id !== state.primary_muscle_group_id)
                  .map((m) => {
                    const on = state.secondary_muscle_group_ids.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleSecondary(m.id)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                          on
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border-strong bg-surface text-muted-foreground"
                        }`}
                      >
                        {m.name_he}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-bold">ציוד נדרש</Label>
              <div className="flex flex-wrap gap-1.5">
                {EQUIPMENT_TYPES_ORDERED.map((t) => {
                  const on = state.required_equipment_types.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          required_equipment_types: toggleType(s.required_equipment_types, t),
                          optional_equipment_types: s.optional_equipment_types.filter((x) => x !== t),
                        }))
                      }
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                        on
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border-strong bg-surface text-muted-foreground"
                      }`}
                    >
                      {EQUIPMENT_TYPE_LABEL[t]}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                מקום ללא ציוד נדרש → התרגיל יסומן כלא זמין (אבל לא ייעלם).
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <NumField
                id="ex-sets"
                label="סטים"
                value={state.default_sets}
                min={1}
                max={20}
                onChange={(v) => setState((s) => ({ ...s, default_sets: v }))}
                error={errors.default_sets}
              />
              <NumField
                id="ex-reps"
                label="חזרות"
                value={state.default_reps}
                min={1}
                max={999}
                onChange={(v) => setState((s) => ({ ...s, default_reps: v }))}
                error={errors.default_reps}
              />
              <NumField
                id="ex-rest"
                label="מנוחה (שנ')"
                value={state.default_rest}
                min={0}
                max={3600}
                onChange={(v) => setState((s) => ({ ...s, default_rest: v }))}
                error={errors.default_rest_seconds}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <Switch
                  checked={state.unilateral}
                  onCheckedChange={(v) => setState((s) => ({ ...s, unilateral: v }))}
                />
                חד־צדדי
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <Switch
                  checked={state.bodyweight_based}
                  onCheckedChange={(v) => setState((s) => ({ ...s, bodyweight_based: v }))}
                />
                מבוסס משקל גוף
              </label>
              <label className="ms-auto flex items-center gap-2 text-sm font-semibold">
                <Switch
                  checked={state.is_favorite}
                  onCheckedChange={(v) => setState((s) => ({ ...s, is_favorite: v }))}
                />
                מועדף
              </label>
            </div>

            <button
              type="button"
              className="text-sm font-bold text-info hover:underline"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? "הסתרת מתקדם" : "הצגת שדות מתקדמים"}
            </button>

            {showAdvanced ? (
              <div className="flex flex-col gap-3 border-t border-border pt-3">
                <div>
                  <Label htmlFor="ex-name-en" className="mb-1.5 block text-sm font-bold">
                    שם באנגלית
                  </Label>
                  <Input
                    id="ex-name-en"
                    value={state.name_en}
                    className="min-h-11 rounded-xl"
                    onChange={(e) => setState((s) => ({ ...s, name_en: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ex-aliases" className="mb-1.5 block text-sm font-bold">
                    שמות חלופיים (מופרדים בפסיק)
                  </Label>
                  <Input
                    id="ex-aliases"
                    value={state.aliasesText}
                    className="min-h-11 rounded-xl"
                    onChange={(e) => setState((s) => ({ ...s, aliasesText: e.target.value }))}
                    placeholder="בנץ', לחיצת מוט"
                  />
                </div>
                <div>
                  <Label htmlFor="ex-instr" className="mb-1.5 block text-sm font-bold">
                    הוראות ביצוע
                  </Label>
                  <Textarea
                    id="ex-instr"
                    value={state.instructions}
                    rows={3}
                    className="rounded-xl"
                    onChange={(e) => setState((s) => ({ ...s, instructions: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ex-cues" className="mb-1.5 block text-sm font-bold">
                    נקודות טכניקה (שורה לכל נקודה)
                  </Label>
                  <Textarea
                    id="ex-cues"
                    value={state.cuesText}
                    rows={3}
                    className="rounded-xl"
                    onChange={(e) => setState((s) => ({ ...s, cuesText: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ex-mist" className="mb-1.5 block text-sm font-bold">
                    טעויות נפוצות (שורה לכל נקודה)
                  </Label>
                  <Textarea
                    id="ex-mist"
                    value={state.mistakesText}
                    rows={2}
                    className="rounded-xl"
                    onChange={(e) => setState((s) => ({ ...s, mistakesText: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ex-notes" className="mb-1.5 block text-sm font-bold">
                    הערות אישיות
                  </Label>
                  <Textarea
                    id="ex-notes"
                    value={state.personal_notes}
                    rows={2}
                    className="rounded-xl"
                    onChange={(e) => setState((s) => ({ ...s, personal_notes: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 block text-sm font-bold">ציוד אופציונלי</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {EQUIPMENT_TYPES_ORDERED.map((t) => {
                        const on = state.optional_equipment_types.includes(t);
                        if (state.required_equipment_types.includes(t)) return null;
                        return (
                          <button
                            key={t}
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                              setState((s) => ({
                                ...s,
                                optional_equipment_types: toggleType(s.optional_equipment_types, t),
                              }))
                            }
                            className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                              on
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border-strong bg-surface text-muted-foreground"
                            }`}
                          >
                            {EQUIPMENT_TYPE_LABEL[t]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <SheetFooter className="mt-4 flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 flex-1 rounded-xl"
                onClick={() => requestClose(false)}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                className="min-h-11 flex-1 rounded-xl bg-primary text-primary-foreground"
              >
                {exercise ? "שמירה" : "יצירה"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="סגירת טופס"
        description="יש שינויים שלא נשמרו. לסגור בכל זאת?"
        confirmLabel="סגירה"
        destructive
        onConfirm={() => {
          setConfirmClose(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}

function NumField({
  id,
  label,
  value,
  min,
  max,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  min: number;
  max: number;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ltr-nums min-h-11 rounded-xl text-center"
      />
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
