/**
 * TemplateExerciseRow — שורת תרגיל בתוך בלוק.
 * מציגה שם, סטים×חזרות/טווח, משקל, מנוחה. הרחבה = עריכה מלאה של כל הערכים.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Chip } from "@/components/catalog/shared";
import { useExercise, useMuscleGroups } from "@/lib/exercises";
import {
  moveTemplateExercise,
  removeTemplateExercise,
  SET_TYPE_LABELS,
  SUPERSET_LETTERS,
  updateTemplateExercise,
  type WorkoutTemplateExercise,
} from "@/lib/templates";
import { cn } from "@/lib/utils";

interface Props {
  exercise: WorkoutTemplateExercise;
  /** אינדקס בתוך בלוק — לתצוגת A1/A2. */
  positionIndex: number;
  blockLetter: string; // "A", "B", ...
  isSuperset: boolean;
  siblingsCount: number;
}

export function TemplateExerciseRow({
  exercise,
  positionIndex,
  blockLetter,
  isSuperset,
  siblingsCount,
}: Props) {
  const [open, setOpen] = useState(false);
  const catalog = useExercise(exercise.exercise_id);
  const muscles = useMuscleGroups();
  const primary = catalog ? muscles.find((m) => m.id === catalog.primary_muscle_group_id) : null;
  const label = isSuperset ? `${blockLetter}${positionIndex + 1}` : blockLetter;

  return (
    <div
      className={cn(
        "rounded-xl border bg-surface p-3 shadow-[var(--shadow-tile)]",
        isSuperset ? "border-gym/70" : "border-border-strong",
      )}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
        <span
          className={cn(
            "grid size-9 place-items-center rounded-lg text-xs font-black",
            isSuperset ? "bg-gym text-white" : "bg-tint text-foreground",
          )}
          aria-label={`תרגיל ${label}`}
        >
          {label}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-black">{catalog?.name_he ?? "תרגיל לא נמצא"}</div>
          <div className="mt-0.5 truncate text-[11px] uppercase tracking-wider text-muted-foreground">
            {primary?.name_he ?? "—"} · {catalog?.tracking_type ?? "—"}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Chip>
              {exercise.planned_sets}×{formatReps(exercise)}
            </Chip>
            {exercise.planned_weight !== null ? (
              <Chip tone="info">
                {exercise.planned_weight} {exercise.weight_unit}
              </Chip>
            ) : null}
            {exercise.rest_seconds !== null ? (
              <Chip>מנוחה {formatSecs(exercise.rest_seconds)}</Chip>
            ) : null}
            {exercise.set_type !== "regular" ? (
              <Chip tone="warning">{SET_TYPE_LABELS[exercise.set_type]}</Chip>
            ) : null}
            {exercise.alternate_exercise_ids.length > 0 ? (
              <Chip>{exercise.alternate_exercise_ids.length} חלופות</Chip>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-1">
            <IconButton
              label="הזזה למעלה"
              disabled={positionIndex === 0}
              onClick={() => moveTemplateExercise(exercise.id, "up")}
            >
              <ChevronUp aria-hidden className="size-4" />
            </IconButton>
            <IconButton
              label="הזזה למטה"
              disabled={positionIndex >= siblingsCount - 1}
              onClick={() => moveTemplateExercise(exercise.id, "down")}
            >
              <ChevronDown aria-hidden className="size-4" />
            </IconButton>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border-strong bg-surface px-2 text-xs font-bold"
          >
            <LayoutList aria-hidden className="size-3.5" />
            {open ? "סגור" : "פרטים"}
          </button>
        </div>
      </div>

      {open ? <ExerciseEditor exercise={exercise} /> : null}
    </div>
  );
}

function ExerciseEditor({ exercise }: { exercise: WorkoutTemplateExercise }) {
  const useRange = exercise.rep_range_min !== null || exercise.rep_range_max !== null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-3">
      <Field label="סטים">
        <Input
          type="number"
          min={1}
          value={exercise.planned_sets}
          onChange={(e) =>
            updateTemplateExercise(exercise.id, {
              planned_sets: Math.max(1, Number(e.target.value) || 1),
            })
          }
          className="min-h-11 rounded-xl border-border-strong"
        />
      </Field>
      {useRange ? (
        <>
          <Field label="חזרות מ־">
            <Input
              type="number"
              min={0}
              value={exercise.rep_range_min ?? ""}
              onChange={(e) =>
                updateTemplateExercise(exercise.id, {
                  rep_range_min: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="min-h-11 rounded-xl border-border-strong"
            />
          </Field>
          <Field label="עד">
            <Input
              type="number"
              min={0}
              value={exercise.rep_range_max ?? ""}
              onChange={(e) =>
                updateTemplateExercise(exercise.id, {
                  rep_range_max: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="min-h-11 rounded-xl border-border-strong"
            />
          </Field>
        </>
      ) : (
        <Field label="חזרות">
          <Input
            type="number"
            min={0}
            value={exercise.planned_reps ?? ""}
            onChange={(e) =>
              updateTemplateExercise(exercise.id, {
                planned_reps: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="min-h-11 rounded-xl border-border-strong"
          />
        </Field>
      )}
      <div className="col-span-2 sm:col-span-3">
        <button
          type="button"
          className="text-xs font-bold text-primary underline"
          onClick={() =>
            updateTemplateExercise(exercise.id, {
              rep_range_min: useRange ? null : exercise.planned_reps,
              rep_range_max: useRange ? null : exercise.planned_reps,
              planned_reps: useRange ? exercise.rep_range_min : null,
            })
          }
        >
          {useRange ? "החלף לחזרות קבועות" : "החלף לטווח חזרות"}
        </button>
      </div>

      <Field label="משקל">
        <Input
          type="number"
          min={0}
          step="0.5"
          value={exercise.planned_weight ?? ""}
          onChange={(e) =>
            updateTemplateExercise(exercise.id, {
              planned_weight: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className="min-h-11 rounded-xl border-border-strong"
        />
      </Field>
      <Field label="יחידה">
        <Select
          value={exercise.weight_unit}
          onValueChange={(v) =>
            updateTemplateExercise(exercise.id, { weight_unit: v as "kg" | "lb" })
          }
        >
          <SelectTrigger className="min-h-11 rounded-xl border-border-strong">
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="kg">קילוגרם</SelectItem>
            <SelectItem value="lb">פאונד</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="מנוחה (שניות)">
        <Input
          type="number"
          min={0}
          value={exercise.rest_seconds ?? ""}
          placeholder="ברירת מחדל"
          onChange={(e) =>
            updateTemplateExercise(exercise.id, {
              rest_seconds: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className="min-h-11 rounded-xl border-border-strong"
        />
      </Field>

      <Field label="RPE">
        <Input
          type="number"
          min={1}
          max={10}
          step="0.5"
          value={exercise.default_rpe ?? ""}
          onChange={(e) =>
            updateTemplateExercise(exercise.id, {
              default_rpe: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className="min-h-11 rounded-xl border-border-strong"
        />
      </Field>
      <Field label="RIR">
        <Input
          type="number"
          min={0}
          max={10}
          value={exercise.default_rir ?? ""}
          onChange={(e) =>
            updateTemplateExercise(exercise.id, {
              default_rir: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className="min-h-11 rounded-xl border-border-strong"
        />
      </Field>
      <Field label="סוג סט">
        <Select
          value={exercise.set_type}
          onValueChange={(v) =>
            updateTemplateExercise(exercise.id, {
              set_type: v as WorkoutTemplateExercise["set_type"],
            })
          }
        >
          <SelectTrigger className="min-h-11 rounded-xl border-border-strong">
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir="rtl">
            {Object.entries(SET_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="col-span-2 sm:col-span-3">
        <Field label="הערות">
          <Input
            value={exercise.notes ?? ""}
            onChange={(e) =>
              updateTemplateExercise(exercise.id, {
                notes: e.target.value || null,
              })
            }
            className="min-h-11 rounded-xl border-border-strong"
            placeholder="קיו טכני, כיוון, אבזור"
          />
        </Field>
      </div>

      <div className="col-span-2 sm:col-span-3 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => removeTemplateExercise(exercise.id)}
          className="min-h-11 rounded-xl text-destructive hover:bg-destructive/10"
        >
          <Trash2 aria-hidden className="me-1 size-4" />
          הסרת תרגיל
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function IconButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg border border-border-strong bg-surface text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function formatReps(e: WorkoutTemplateExercise): string {
  if (e.rep_range_min !== null && e.rep_range_max !== null) {
    return `${e.rep_range_min}–${e.rep_range_max}`;
  }
  if (e.planned_reps !== null) return String(e.planned_reps);
  return "—";
}

function formatSecs(s: number): string {
  if (s < 60) return `${s}״`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}:${String(r).padStart(2, "0")}` : `${m} ד׳`;
}

export { SUPERSET_LETTERS };
