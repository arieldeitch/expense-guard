/**
 * ExerciseCard — אריח תרגיל בזמן אימון.
 * מציג: שם, אות (A1/A2 בסופרסט), snapshot, previous, PRs, כפתורי פעולה,
 * ורשימת סטים דרך SetRow.
 */
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
  MoreHorizontal,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Chip } from "@/components/catalog/shared";
import { useExercise, useMuscleGroups } from "@/lib/exercises";
import {
  addSet,
  moveExercise,
  removeExerciseFromSession,
  updateSessionExercise,
  usePersonalRecords,
  usePreviousPerformance,
  useExerciseSets,
  startRestTimer,
  useSessionPrefs,
  type StrengthSessionExercise,
} from "@/lib/sessions";
import { SetRow } from "./SetRow";
import { cn } from "@/lib/utils";

interface Props {
  sessionId: string;
  exercise: StrengthSessionExercise;
  supersetLabel?: string;
  onSubstitute: (id: string) => void;
  onEditNotes: (id: string) => void;
}

export function ExerciseCard({
  sessionId,
  exercise,
  supersetLabel,
  onSubstitute,
  onEditNotes,
}: Props) {
  const sets = useExerciseSets(exercise.id);
  const previous = usePreviousPerformance(sessionId, exercise.exercise_id);
  const prs = usePersonalRecords(sessionId, exercise.exercise_id);
  const ex = useExercise(exercise.exercise_id);
  const muscleGroups = useMuscleGroups();
  const prefs = useSessionPrefs();

  const primaryMuscle = useMemo(
    () => muscleGroups.find((m) => m.id === exercise.snapshot.primary_muscle_group_id),
    [muscleGroups, exercise.snapshot.primary_muscle_group_id],
  );

  const [expanded, setExpanded] = useState(true);
  const completedCount = sets.filter((s) => s.completed).length;

  return (
    <article
      className={cn(
        "rounded-2xl border bg-surface p-3 shadow-tile",
        exercise.completed ? "border-success/60" : "border-border-strong",
      )}
    >
      <header className="flex items-start gap-2">
        {supersetLabel ? (
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gym-soft text-[13px] font-black text-gym">
            {supersetLabel}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-base font-black leading-tight">
              {exercise.snapshot.exercise_name}
            </h3>
            {exercise.substituted_from_exercise_id ? <Chip tone="warning">הוחלף</Chip> : null}
            {exercise.completed ? <Chip tone="success">הושלם</Chip> : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            {primaryMuscle ? <span>{primaryMuscle.name_he}</span> : null}
            <span>•</span>
            <span>
              {completedCount}/{sets.length} סטים
            </span>
            {ex?.unilateral ? (
              <>
                <span>•</span>
                <span>חד־צדדי</span>
              </>
            ) : null}
          </div>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="פעולות תרגיל"
              className="grid size-9 place-items-center rounded-lg border border-border-strong bg-tint"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-52 p-1">
            <ItemBtn
              icon={<Repeat className="size-4" aria-hidden />}
              onClick={() => onSubstitute(exercise.id)}
            >
              החלף תרגיל
            </ItemBtn>
            <ItemBtn
              icon={<MessageSquarePlus className="size-4" aria-hidden />}
              onClick={() => onEditNotes(exercise.id)}
            >
              הערה
            </ItemBtn>
            <ItemBtn
              icon={<ChevronUp className="size-4" aria-hidden />}
              onClick={() => moveExercise(exercise.id, "up")}
            >
              העבר מעלה
            </ItemBtn>
            <ItemBtn
              icon={<ChevronDown className="size-4" aria-hidden />}
              onClick={() => moveExercise(exercise.id, "down")}
            >
              העבר מטה
            </ItemBtn>
            <ItemBtn
              icon={<Plus className="size-4" aria-hidden />}
              onClick={() => addSet(exercise.id)}
            >
              הוסף סט
            </ItemBtn>
            <ItemBtn
              onClick={() => updateSessionExercise(exercise.id, { completed: !exercise.completed })}
            >
              {exercise.completed ? "בטל השלמה" : "סמן כהושלם"}
            </ItemBtn>
            <ItemBtn
              danger
              icon={<Trash2 className="size-4" aria-hidden />}
              onClick={() => {
                if (confirm(`להסיר את "${exercise.snapshot.exercise_name}" מהאימון?`))
                  removeExerciseFromSession(exercise.id);
              }}
            >
              הסר מהאימון
            </ItemBtn>
          </PopoverContent>
        </Popover>
      </header>

      {previous || prs.length ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          {previous?.bestSet?.weight != null ? (
            <span className="rounded-md bg-tint px-1.5 py-0.5 text-muted-foreground">
              קודם: {previous.bestSet.weight}
              {previous.bestSet.unit} × {previous.bestSet.reps ?? "—"}
            </span>
          ) : previous ? (
            <span className="rounded-md bg-tint px-1.5 py-0.5 text-muted-foreground">
              קודם: {previous.sets.length} סטים
            </span>
          ) : null}
          {prs.map((p) => (
            <span
              key={p.kind}
              className="rounded-md bg-success-soft px-1.5 py-0.5 font-bold text-success"
            >
              🎯 {p.label}: {p.value}
            </span>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 flex w-full items-center justify-between rounded-lg bg-tint/40 px-2 py-1 text-[11px] font-bold text-muted-foreground"
      >
        <span>{expanded ? "צמצם סטים" : "הצג סטים"}</span>
        {expanded ? (
          <ChevronUp className="size-3" aria-hidden />
        ) : (
          <ChevronDown className="size-3" aria-hidden />
        )}
      </button>

      {expanded ? (
        <div className="mt-2 flex flex-col gap-2">
          {sets.map((s) => (
            <SetRow
              key={s.id}
              set={s}
              trackingType={exercise.snapshot.tracking_type}
              onComplete={() => {
                if (prefs.auto_start_rest && (s.rest_seconds ?? 0) > 0) {
                  startRestTimer(
                    sessionId,
                    s.rest_seconds ?? prefs.default_rest_seconds,
                    exercise.snapshot.exercise_name,
                  );
                }
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => addSet(exercise.id)}
            className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong bg-transparent text-sm font-bold text-muted-foreground active:bg-tint"
          >
            <Plus className="size-4" aria-hidden />
            הוסף סט
          </button>
        </div>
      ) : null}
    </article>
  );
}

function ItemBtn({
  children,
  onClick,
  icon,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-start text-sm hover:bg-tint",
        danger && "text-destructive",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
