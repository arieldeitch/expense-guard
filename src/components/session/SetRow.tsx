/**
 * SetRow — שורה של סט בודד בזמן אימון.
 * שדות משתנים לפי tracking_type. השלמה שומרת timestamp ומפעילה rest timer.
 * ההזנה שומרת מיד (autosave), כפתור השלמה = ראשי (אגודל).
 */
import { Check, MoreHorizontal, Undo2 } from "lucide-react";
import type { TrackingType } from "@/lib/exercises";
import type { StrengthSet } from "@/lib/sessions";
import {
  addSet,
  completeSet,
  duplicateSet,
  removeSet,
  skipSet,
  undoCompleteSet,
  updateSet,
} from "@/lib/sessions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { NumberField } from "./NumberField";

interface Props {
  set: StrengthSet;
  trackingType: TrackingType | null;
  weightIncrement?: number;
  onComplete?: (set: StrengthSet) => void;
}

export function SetRow({ set, trackingType, weightIncrement = 2.5, onComplete }: Props) {
  const type = trackingType ?? "weight_reps";
  const showWeight =
    type === "weight_reps" ||
    type === "weight_time" ||
    type === "bodyweight_plus_weight" ||
    type === "assisted_reps";
  const showReps =
    type === "weight_reps" ||
    type === "reps_only" ||
    type === "bodyweight_reps" ||
    type === "bodyweight_plus_weight" ||
    type === "assisted_reps" ||
    type === "left_right_reps";
  const showTime = type === "time" || type === "static_hold" || type === "weight_time";

  const done = set.completed;
  const skipped = set.skipped;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-2",
        done
          ? "border-success/40 bg-success-soft/30"
          : skipped
            ? "border-warning/40 bg-warning-soft/30 opacity-80"
            : "border-border-strong bg-surface",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-tint text-xs font-black">
            {set.set_number}
          </span>
          {set.set_type !== "regular" ? (
            <span className="rounded-md bg-tint px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
              {setTypeLabel(set.set_type)}
            </span>
          ) : null}
          {set.planned_weight != null || set.planned_reps != null ? (
            <span className="text-[11px] text-muted-foreground">
              יעד: {set.planned_weight ?? "—"}
              {set.planned_weight != null && set.planned_reps != null ? " × " : " "}
              {set.planned_reps ?? ""}
            </span>
          ) : null}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="פעולות סט"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-tint"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-44 p-1">
            <RowMenuBtn onClick={() => duplicateSet(set.id)}>שכפול סט</RowMenuBtn>
            <RowMenuBtn onClick={() => addSet(set.session_exercise_id)}>הוסף סט</RowMenuBtn>
            <RowMenuBtn onClick={() => skipSet(set.id)}>סמן כדולג</RowMenuBtn>
            <RowMenuBtn onClick={() => updateSet(set.id, { set_type: "warmup" })}>
              סמן כחימום
            </RowMenuBtn>
            <RowMenuBtn onClick={() => updateSet(set.id, { set_type: "drop_set" })}>
              סמן כ־Drop
            </RowMenuBtn>
            <RowMenuBtn onClick={() => updateSet(set.id, { set_type: "amrap" })}>
              סמן כ־AMRAP
            </RowMenuBtn>
            <RowMenuBtn onClick={() => removeSet(set.id)} danger>
              הסר סט
            </RowMenuBtn>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
        {showWeight ? (
          <NumberField
            value={set.actual_weight}
            onChange={(v) => updateSet(set.id, { actual_weight: v })}
            step={weightIncrement}
            min={0}
            ariaLabel={`משקל סט ${set.set_number}`}
            suffix={set.weight_unit}
            placeholder={String(set.planned_weight ?? "משקל")}
          />
        ) : (
          <div className="text-xs text-muted-foreground">—</div>
        )}
        {showReps ? (
          <NumberField
            value={set.actual_reps}
            onChange={(v) => updateSet(set.id, { actual_reps: v })}
            step={1}
            min={0}
            ariaLabel={`חזרות סט ${set.set_number}`}
            suffix="×"
            placeholder={String(set.planned_reps ?? "חזרות")}
          />
        ) : showTime ? (
          <NumberField
            value={set.duration_seconds}
            onChange={(v) => updateSet(set.id, { duration_seconds: v })}
            step={5}
            min={0}
            ariaLabel={`זמן סט ${set.set_number}`}
            suffix="ש׳"
            placeholder="שניות"
          />
        ) : (
          <div className="text-xs text-muted-foreground">—</div>
        )}
        <button
          type="button"
          aria-pressed={done}
          aria-label={done ? "בטל השלמת סט" : "סמן סט כהושלם"}
          onClick={() => {
            if (done) {
              undoCompleteSet(set.id);
            } else {
              completeSet(set.id);
              onComplete?.(set);
            }
          }}
          className={cn(
            "grid h-11 min-w-11 place-items-center rounded-xl border font-black transition-colors",
            done
              ? "border-success bg-success text-success-foreground"
              : "border-border-strong bg-tint text-foreground active:bg-primary/20",
          )}
        >
          {done ? (
            <Undo2 className="size-5" aria-hidden />
          ) : (
            <Check className="size-5" aria-hidden />
          )}
        </button>
      </div>

      {/* RPE — נתמך בחוזה (`StrengthSet.rpe`). אופציונלי: null = לא דווח. */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[11px] font-bold text-muted-foreground">RPE</span>
        <NumberField
          compact
          value={set.rpe}
          onChange={(v) => updateSet(set.id, { rpe: v })}
          step={0.5}
          min={1}
          max={10}
          ariaLabel={`RPE סט ${set.set_number}`}
          placeholder="—"
          className="max-w-[9.5rem]"
        />
        {skipped ? (
          <button
            type="button"
            onClick={() => updateSet(set.id, { skipped: false, completed_at: null })}
            className="ms-auto min-h-9 rounded-lg px-2 text-[11px] font-bold text-warning underline"
          >
            בטל דילוג
          </button>
        ) : null}
      </div>

      {skipped ? (
        <p className="text-[11px] text-muted-foreground">
          סט זה דולג. הערכים שהוזנו נשמרו.
        </p>
      ) : null}
    </div>
  );
}

function RowMenuBtn({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-start rounded-md px-2 py-2 text-sm hover:bg-tint",
        danger && "text-destructive",
      )}
    >
      {children}
    </button>
  );
}

function setTypeLabel(t: StrengthSet["set_type"]): string {
  switch (t) {
    case "warmup":
      return "חימום";
    case "drop_set":
      return "Drop";
    case "failure":
      return "כישלון";
    case "amrap":
      return "AMRAP";
    case "timed":
      return "זמן";
    case "custom":
      return "מותאם";
    default:
      return "";
  }
}
